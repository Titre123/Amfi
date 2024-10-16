import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ToastAction } from "@/app/components/ui/toast"
import 'react-toastify/dist/ReactToastify.css';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callASmartContract(payload: any, signaturefunc: any, props: any) {
  try {
    const signatureResponse = await signaturefunc({payload});
      
  
    if (signatureResponse) {
      props.toast({
        title: props.title,
        description: props.description,
        action: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${signatureResponse.hash}?network=testnet`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    }
    props.setTxn(false);
  } catch (e) {
    props.setTxn(false);
    return;
  }
}
