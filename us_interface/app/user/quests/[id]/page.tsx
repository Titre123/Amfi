'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion"
import { Skeleton } from "@/app/components/ui/skeleton"
import { ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import { setCookie, getCookie } from 'cookies-next'
import { callASmartContract } from '@/app/lib/utils'
import { toast } from '@/app/hooks/use-toast'

export default function QuestPageComponent() {
  const [questData, setQuestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingQuest, setCheckingQuest] = useState(false);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const params = useParams();
  const questId = params.id;

  const moduleAddress = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
  const moduleName = process.env.NEXT_PUBLIC_MODULE_NAME;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!account || !connected) {
        setLoading(false);
        return;
      }

      try {
        const body = {
          function: `${moduleAddress}::${moduleName}::getAppStat`,
          type_arguments: [],
          arguments: [],
        };

        const response = await fetch("https://fullnode.testnet.aptoslabs.com/v1/view", {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch quests');
        }

        const qAndc = await response.json();
        console.log(qAndc);
        const quest = qAndc[0].find(q => q.id === questId);
        console.log(quest);
        setQuestData(quest);

        // Load completed tasks from cookie
        const completedTasksCookie = getCookie(`quest_${questId}_completed_tasks`);
        setCompletedTasks(completedTasksCookie ? parseInt(completedTasksCookie) : 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [questId, moduleAddress, moduleName, account, connected]);

  const truncateText = (text: string, maxLength: number) => {
    if (text?.length <= maxLength) return text;
    return text?.slice(0, maxLength) + '...';
  };

  const checkQuestCompletion = async (link) => {
    setCheckingQuest(true);

    await new Promise(resolve => setTimeout(resolve, 60000)); // Simulate 1 minute loading
    const newCompletedTasks = completedTasks + 1;
    setCompletedTasks(newCompletedTasks);
    setCookie(`quest_${questId}_completed_tasks`, newCompletedTasks.toString(), { maxAge: 7 * 24 * 60 * 60 }); // 7 days expiration
    setCheckingQuest(false);
    window.location.href = link; // Route user to the link
  };

  const ClaimToken = async () => {
    setClaiming(true);
    if (!account || !connected) {
      return;
    }

    try {
      const payload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::${moduleName}::claimRewardNft`,
        type_arguments: [],
        arguments: [
          questData.quest_title,
          "https://violet-patient-squid-248.mypinata.cloud/ipfs/bafkreiarcmrsmokumqo2bztyyjesh4h7mwamuxzdawfdqlexedddzzmkpy",
          `Quests nfts for ${account?.address}`,
          parseInt(questData.default_reward),
          questId
        ],
      };
      setClaiming(true);
      await callASmartContract(payload, signAndSubmitTransaction, {
        setClaiming,
        description: `You have successfully claimed your reward for the quest: ${questData.quest_title}`,
        title: `Reward Claim Confirmation`,
        toast: toast
      });
    } catch (err) {
      setClaiming(false);
      console.error('Error claiming reward:', err);
    }
  }

  const QuestItemContent = ({ item, index }: { item: any, index: number }) => {
    const [expanded, setExpanded] = useState(false);
    const maxLength = 150;

    return (
      <div className="space-y-2 flex flex-col">
        <p className="text-sm text-muted-foreground">
          {expanded ? item?.description : truncateText(item?.description, maxLength)}
          {item?.description?.length > maxLength && (
            <Button
              variant="link"
              onClick={() => setExpanded(!expanded)}
              className="p-0 h-auto font-normal"
            >
              {expanded ? 'View less' : 'View more'}
            </Button>
          )}
        </p>
        <div>

          <Link onClick={checkQuestCompletion} href={item.link}>
            <Button
              disabled={checkingQuest || completedTasks > index}
              className="w-full sm:w-max"
            >
              {checkingQuest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Quest
                </>
              ) : completedTasks > index ? (
                'Completed'
              ) : (
                <>
                  Proceed to Quest <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  const SkeletonLoader = () => (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-9 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) return <SkeletonLoader />;
  if (!questData) return (
    <div className="flex flex-col items-center justify-center h-40">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-center text-muted-foreground mt-2">This quest cannot be found</p>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{questData.quest_title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-lg">
            {truncateText(questData.description, 200)}
          </CardDescription>
        </CardContent>
      </Card>

      <Card className='pt-6'>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {questData.quest_list.map((item: any, index: number) => (
              <AccordionItem value={item.title} key={item.title}>
                <AccordionTrigger className="text-lg font-medium">
                  {index + 1}. {item.title}
                </AccordionTrigger>
                <AccordionContent>
                  <QuestItemContent item={item} index={index} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {completedTasks === questData.quest_list.length && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <Button onClick={ClaimToken} className="w-full">Claim Reward</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}