"use client"

import { useEffect, useState } from "react"
import { Plus, ChevronRight, DollarSign, Activity, Users, AlertCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useToast } from "@/app/hooks/use-toast"
import Link from 'next/link'
import { Skeleton } from '@/app/components/ui/skeleton'

const EmptyState = ({ type }: { type: 'quests' | 'campaigns' }) => (
  <Card className="flex flex-col items-center justify-center p-6 text-center">
    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">No {type} found</h3>
    <p className="text-sm text-muted-foreground mb-4">
      {type === 'quests'
        ? "You haven't created any quests yet."
        : "You haven't created any campaigns yet."}
    </p>
    <Link href={type === 'quests' ? '/app/quests/create' : '/app/campaigns/create'}>
      <Button>
        <Plus className="mr-2 h-4 w-4" /> Create New {type === 'quests' ? 'Quest' : 'Campaign'}
      </Button>
    </Link>
  </Card>
)

const SkeletonLoader = () => (
  <div className="max-w-7xl mx-auto space-y-8">
    <Skeleton className="h-10 w-64 mb-8" />
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-2 w-full mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Tabs defaultValue="quests" className="space-y-4">
      <TabsList>
        <TabsTrigger value="quests">Quests</TabsTrigger>
        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
      </TabsList>
      {['quests', 'campaigns'].map((tab) => (
        <TabsContent key={tab} value={tab} className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-[#BFBFBF]">
                {[...Array(5)].map((_, i) => (
                  <li key={i} className="p-4 flex justify-between items-center">
                    <div>
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  </div>
)

export default function SophisticatedDefiDashboard() {
  const moduleAddress = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
  const moduleName = process.env.NEXT_PUBLIC_MODULE_NAME;
  const { account, connected } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quests, setQuests] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const body = {
      function: `${moduleAddress}::${moduleName}::getProtocolMetrics`,
      type_arguments: [],
      arguments: [account?.address],
    };

    const fetchMetrics = async () => {
      setLoading(true);
      if (!account?.address || !connected) {
        setQuests([]);
        setCampaigns([]);
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("https://fullnode.testnet.aptoslabs.com/v1/view", {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setQuests(data[0] || []);
          setCampaigns(data[1] || []);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
        toast({
          title: "Error",
          description: "Failed to fetch metrics. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [connected, account?.address, moduleAddress, moduleName, toast]);

  if (loading || !connected || !account) {
    return <SkeletonLoader />
  }

  const activeQuests = quests.filter(quest => quest.deadline > Date.now());
  const completedQuests = quests.filter(quest => quest.deadline <= Date.now());
  const activeCampaigns = campaigns.filter(campaign => campaign.deadline > Date.now());
  const completedCampaigns = campaigns.filter(campaign => campaign.deadline <= Date.now());

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold">Protocol Overview</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quests.length}</div>
            <Progress value={(activeQuests.length / quests.length) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">{activeQuests.length} active, {completedQuests.length} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquidity Campaigns</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <Progress value={(activeCampaigns.length / campaigns.length) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">{activeCampaigns.length} active, {completedCampaigns.length} ended</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${quests.reduce((acc, quest) => acc + (quest.default_reward * (quest.merit?.participants > 0 ? quest.merit.participants : 1)), 0).toString().replace(/^0+/, '')}</div>
            <Progress value={
              quests.length > 0 ? (quests.reduce((acc, quest) => acc + (quest.default_reward || 0), 0) /
                quests.reduce((acc, quest) => acc + (quest.budget || 0), 0)) * 100 : 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {quests.length > 0 ? `${((quests.reduce((acc, quest) => acc + (quest.default_reward || 0), 0) /
                quests.reduce((acc, quest) => acc + (quest.budget || 0), 0)) * 100).toFixed(0)}% distributed` : '0% distributed'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{
              quests.length > 0 || campaigns.length > 0 ?
                (quests.reduce((acc, quest) => acc + (quest.merit?.participants ? quest.merit.participants.length : 0), 0) +
                  campaigns.reduce((acc, campaign) => acc + (campaign.merit?.participants ? campaign.merit.participants.length : 0), 0)
                ) : 0
            }</div>
            <Progress value={quests.length > 0 || campaigns.length > 0 ?
              (quests.reduce((acc, quest) => acc + (quest.merit?.participants ? quest.merit.participants.length : 0), 0) +
                campaigns.reduce((acc, campaign) => acc + (campaign.merit?.participants ? campaign.merit.participants.length : 0), 0)) * 100 /
              (quests.length + campaigns.length) : 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">{quests.length > 0 || campaigns.length > 0 ?
              (quests.reduce((acc, quest) => acc + (quest.merit?.participants ? quest.merit.participants.length : 0), 0) +
                campaigns.reduce((acc, campaign) => acc + (campaign.merit?.participants ? campaign.merit.participants.length : 0), 0)) * 100 /
              (quests.length + campaigns.length) : 0}% retention rate</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="quests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quests">Quests</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>
        <TabsContent value="quests" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Active Quests</h3>
            <Link href='/app/quests/create'>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create New Quest
              </Button>
            </Link>
          </div>
          {quests.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-[#BFBFBF]">
                  {activeQuests?.slice(0, 5).map((quest, index) => (
                    <li key={index} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{quest.quest_title}</p>
                        <p className="text-sm text-muted-foreground">{quest.description}</p>
                      </div>
                      <Badge>active</Badge>
                    </li>
                  ))}
                  {completedQuests?.slice(0, 5).map((quest, index) => (
                    <li key={index + activeQuests.length} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{quest.quest_title}</p>
                        <p className="text-sm text-muted-foreground">{quest.description}</p>
                      </div>
                      <Badge>completed</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <EmptyState type="quests" />
          )}
        </TabsContent>
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Active Liquidity Campaigns</h3>
            <Link href="/app/campaigns/create">
              <Button >
                <Plus className="mr-2 h-4 w-4" /> Create New Campaign
              </Button>
            </Link>
          </div>
          {campaigns.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-[#BFBFBF]">
                  {activeCampaigns?.slice(0, 5).map((campaign, index) => (
                    <li key={index} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{campaign.campaign_title}</p>
                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      </div>
                      <Badge>active</Badge>
                    </li>
                  ))}
                  {completedCampaigns?.slice(0, 5).map((campaign, index) => (
                    <li key={index + activeCampaigns.length} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{campaign.campaign_title}</p>
                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      </div>
                      <Badge>completed</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <EmptyState type="campaigns" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}