"use client";

import { WalletReadyState, useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { FaucetClient, Network } from "aptos";
import { Wallet } from "lucide-react";
import { callASmartContract } from "../lib/utils";
import { useToast } from "../hooks/use-toast";

/* 
  Component that displays a button to connect a wallet. If the wallet is connected, it displays the 
  wallet's APT balance, address and a button to disconnect the wallet. 

  When the connect button is clicked, a dialog is displayed with a list of all supported wallets. If 
  a supported wallet is installed, the user can click the connect button to connect the wallet. If
  the wallet is not installed, the user can click the install button to install the wallet.
*/
export default function WalletSelector(props: { isTxnInProgress?: boolean }) {
  // wallet state variables
  const { connect, account, connected, disconnect, wallets, isLoading, signAndSubmitTransaction } = useWallet();
  // State to hold the current account's APT balance. In string - floating point format.
  const [balance, setBalance] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const moduleAddress = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
  const moduleName = process.env.NEXT_PUBLIC_MODULE_NAME;
  const [txn, setTxn] = useState<boolean>(false);
  // State to hold whether the faucet is loading or not.
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);

  /* 
    Gets the balance of the connected account whenever the connected, account, isFaucetLoading,
    and isTxnInProgress variables change.

    Also checks if the account exists. If the account does not exist, it initializes the account
    by funding it with 1 APT. 
  */
  useEffect(() => {
    if (connected && account) {
      ensureAccountExists().then(() => {
        getBalance(account.address);
        registerAccount();
      });
    }
  }, [connected, account, props.isTxnInProgress, isFaucetLoading]);

  const registerAccount = async () => {
    if (!account || !connected) {
      return;
    }

    try {
      const payload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::${moduleName}::register_protocol`,
        type_arguments: [],
        arguments: [],
      };
      setTxn(true);
      await callASmartContract(payload, signAndSubmitTransaction,
        {
          setTxn,
          description: `You have successfully registered or updated your protocol account`,
          title: `Account Setup Confirmation`,
          toast: toast
        });
    } catch (err) {
      setTxn(false);
    }
  }

  /* 
    Checks if the account exists. If the account does not exist, it initializes the account
    by funding it with 1 APT. 
  */
  const ensureAccountExists = async () => {
    /* 
      TODO #5: Make a request to the api endpoint to retrieve the account data. If the request returns 
            an object that contains `error_code` of `account_not_found`, call the initializeAccount
            function to initialize the account.
    */

    const response = await fetch(
      `https://fullnode.testnet.aptoslabs.com/v1/accounts/${account?.address}`,
      {
        method: "GET",
      }
    );

    // Parsing the response into a json
    const accountData = await response.json();

    // If the response is the error code for account not found, the account has not been initialized
    if (accountData.error_code == "account_not_found") {
      initializeAccount();
    }
  }

  /* 
    Initializes the account by funding it with 1 APT.
  */
  const initializeAccount = async () => {
    /* 
      TODO #6: Return if the wallet is not connected, the account is not defined, a transaction is 
      in progress, or the faucet is loading.
    */
    if (!connected || !account || isFaucetLoading || props.isTxnInProgress) {
      return;
    }
    /* 
      TODO #7: Set the isFaucetLoading state variable to prevent this function from being called again.
    */
    setIsFaucetLoading(true);
    /* 
      TODO #8: Create a new faucet client with the testnet network and faucet url. Then, call the
      fundAccount function to fund the account with 1 APT. Catch any errors that occur. 
    */
    const faucetClient = new FaucetClient(
      Network.TESTNET,
      "https://faucet.testnet.aptoslabs.com"
    );

    // Try anc catch for faucet client initialization
    try {
      await faucetClient.fundAccount(account.address, 100000000, 1);
    } catch (error) {
      console.log(error);
    }
    /* 
      TODO #9: Set the isFaucetLoading state variable to false. 
    */
    setIsFaucetLoading(false);
  }

  /*
    Gets the balance of the given address. In case of an error, the balance is set to 0. The balance
    is returned in floating point format.
    @param address - The address to get the APT balance of.
  */
  const getBalance = async (address: string) => {
    /* 
 
      TODO #3: Make a call to the 0x1::coin::balance function to get the balance of the given address. 
      
      HINT: 
        - The APT balance is return with a certain number of decimal places. Remember to convert the 
          balance to floating point format as a string.
        - Remember to make the API request in a try/catch block. If there is an error, set the 
          balance to "0".
    */

    const bodyReq = {
      function: "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [address],
    };

    let response;

    // Try and catch block for error handling
    try {
      response = await fetch(`https://fullnode.testnet.aptoslabs.com/v1/view`, {
        method: "POST",
        body: JSON.stringify(bodyReq),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    } catch (e) {
      setBalance("0");
      return;
    }

    const balanceInExpo = await response.json();

    setBalance((balanceInExpo / 100000000).toLocaleString());
  };

  return (
    <div>
      {!connected && !isLoading && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Wallet className="mr-2 h-4 w-4" /> Connect Aptos Wallet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect your wallet</DialogTitle>
              {
                /* 
                  TODO #1: Return a list of all supported wallets. If the wallet is installed, display
                  a button to connect the wallet. If the wallet is not installed, display a button 
                  to install the wallet. 
 
                  HINT: 
                    - Use the two components below to display the wallet name and the connect or 
                      install button. Remember to fill in the `onClick` event handler for the connect 
                      button and the `href` for the install button. 
                    - Use the `wallets` array to get the list of supported wallets.
                    - Fill in the `Wallet Name` placeholder with the name of the wallet.
 
                  -- Connect Wallet Component --
                  <div
                    key={wallet.name}
                    className="flex w-full items-center justify-between rounded-xl p-2"
                  >
                    <h1>PLACEHOLDER: Wallet Name</h1>
                    <Button variant="secondary" onClick={() => console.log("PLACEHOLDER: Connect wallet")}>
                      Connect
                    </Button>
                  </div>
 
                  -- Install Wallet Component --
                  <div
                    key={wallet.name}
                    className="flex w-full items-center justify-between rounded-xl p-2"
                  >
                    <h1>PLACEHOLDER: Wallet Name</h1>
                    <a href="PLACEHOLDER.com" target="_blank">
                      <Button variant="secondary">
                        Install
                      </Button>
                    </a>
                  </div>
                */
              }
              {wallets.map((wallet) => (
                <div
                  key={wallet.name}
                  className="flex w-full  items-center justify-between rounded-xl p-2"
                >
                  <h1>{wallet.name}</h1>
                  {wallet.readyState === WalletReadyState.Installed && (
                    <Button
                      variant="secondary"
                      onClick={() => connect(wallet.name)}
                    >
                      Connect
                    </Button>
                  )}

                  {wallet.readyState === WalletReadyState.NotDetected && (
                    <a href={wallet.url} target="_blank">
                      <Button variant="secondary">Install</Button>
                    </a>
                  )}
                </div>
              ))}
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
      {
        /* 
          TODO #4: Display a loading button if the wallet is currently loading
 
          HINT: 
            - Use the `isLoading` variable to check if the wallet is loading.
            - Use the Button component below to display.
 
          -- Loading Button Component --
          <Button variant="secondary" disabled>
            Loading...
          </Button>
        */
      }
      {isLoading && (
        <Button variant="secondary" disabled>
          Loading...
        </Button>
      )}
      {
        /* 
          TODO #2: Display the wallet's APT balance and address if the wallet is connected and the 
                account is defined. Use the component below to display the wallet's APT balance and 
                address, as well as provide the disconnect button. 
 
          HINT: 
            - Use the `connected` and `account` variables to check if the wallet is connected and the
              account is defined.
            - Use the `balance` state variable to display the wallet's APT balance.
            - Remember to fill in the `onClick` event handler for the disconnect button.
          
          -- Wallet Balance Component --
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="font-mono">
                  PLACEHOLDER APT | {account.address.slice(0, 5)}...{account.address.slice(-4)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {console.log("PLACEHOLDER: Disconnect wallet")}}>
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        */
      }
      {
        account && connected && (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default">
                  {account.address.slice(0, 5)}...{account.address.slice(-4)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => disconnect()}>
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
    </div>
  );
}