'use client'

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { AlertCircle } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useToast } from '@/app/hooks/use-toast';
import { callASmartContract } from '@/app/lib/utils';

async function fetchGraphQL(operationsDoc: string, operationName: string, variables: {}) {
  const result = await fetch(
    "https://api.testnet.aptoslabs.com/v1/graphql",
    {
      method: "POST",
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName
      })
    }
  );

  return await result.json();
}

async function fetchMyQuery(addr: string) { // Added type for addr
  return fetchGraphQL(
    `
    query MyQuery {
      token_activities_v2(
        where: {current_token_data: {current_token_ownerships: {owner_address: {_eq: "${addr}"}}}}
      ) {
        token_amount
        token_data_id
        current_token_data {
          token_name
          current_token_ownerships {
            owner_address
          }
          current_collection {
            collection_id
            creator_address
            uri
          }
          token_uri
        }
      }
    }
  `,
    "MyQuery",
    {}
  );
}

export default function TokenRewardPage() {
  const { token_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const moduleAddress = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
  const moduleName = process.env.NEXT_PUBLIC_MODULE_NAME;
  const { account, connected, signAndSubmitTransaction } = useWallet();

  useEffect(() => {
    async function loadTokenData() {
      setLoading(true);
      if (!account || !connected) {
        return;
      }
      try {
        const { errors, data } = await fetchMyQuery(account.address); // Changed to use account address
        if (errors) {
          throw new Error(errors[0].message);
        }
        setNfts(data.token_activities_v2);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadTokenData();
  }, [token_id, account, connected]);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  if (!loading && nfts.length === 0) {
    return <EmptyState />
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Claim Your NFT Rewards</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((nft) => (
          <NFTCard token_id={token_id} moduleAddress={moduleAddress} moduleName={moduleName} signAndSubmitTransaction={signAndSubmitTransaction} key={nft.token_data_id} nft={nft} />
        ))}
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="w-64 h-8 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <Skeleton className="h-4 w-[250px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="w-full h-[200px]" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col bg-white shadow rounded-md items-center justify-center h-[60vh]">
      <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">No NFT Rewards Yet</h2>
      <p className="text-gray-500 text-center max-w-md">
        Complete quests and participate in campaigns to earn NFT rewards.
        They'll appear here once you've earned them!
      </p>
    </div>
  );
}

function NFTCard({ nft, signAndSubmitTransaction, moduleAddress, moduleName, token_id }: { nft: any; signAndSubmitTransaction: any; moduleAddress: string; moduleName: string; token_id: string}) {
  const { toast } = useToast();
  const [claiming, setClaiming] = useState(false);

  const claimReward = async () => {
    setClaiming(true);
    const payload = {
      type: "entry_function_payload",
      function: `${moduleAddress}::${moduleName}::claimRewardItem`,
      type_arguments: [],
      arguments: [token_id, token_id, nft.token_data_id],
    };

    try {
      await callASmartContract(payload, signAndSubmitTransaction, {
        description: `Claiming reward for NFT: ${nft.token_data_id}`,
        title: "Reward Claimed",
        toast,
      });
      console.log(`Successfully claimed reward for NFT: ${nft.token_data_id}`);
      setClaiming(false);
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast({
        title: "Reward Claim Failed",
        description: "There was an error claiming your reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{`${nft.current_token_data.token_name} from ${nft.current_token_data.current_collection.collection_name}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[200px]">
          <img
            src={nft.current_token_data.token_uri}
            alt={nft.current_token_data.token_name}
            className="rounded-md w-full h-[200px] object-cover"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Collection: {nft.current_token_data.current_collection.collection_name}
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={claimReward}>
          {
            claiming ? 'claiming' : 'Claim Reward'
          }
        </Button>
      </CardFooter>
    </Card>
  );
}
