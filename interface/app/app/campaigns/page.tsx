"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { format } from 'date-fns'
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Badge } from "@/app/components/ui/badge"
import { Download, Share2, Eye, Plus, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/app/components/ui/skeleton'

export default function Page() {
  const { account, signAndSubmitTransaction, connected } = useWallet();
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(false);

  const moduleAddress = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
  const moduleName = process.env.NEXT_PUBLIC_MODULE_NAME;

  function convertTimestampToDate(timestamp) {
    // If the timestamp is in seconds (10 digits), convert it to milliseconds
    if (String(timestamp).length === 10) {
        timestamp *= 1000;
    }

    const date = new Date(timestamp);

    // Format the date to 'YYYY-MM-DD'
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so add 1
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

  useEffect(() => {
    let response;
    const body = {
      function: `${moduleAddress}::${moduleName}::getProtocolMetrics`,
      type_arguments: [],
      arguments: [account?.address],
    };
    const fetchCampaigns = async () => {
      setLoading(true);
      if(!account?.address || !connected) {
        setCampaigns([]);
        return;
      }
      try {
        setLoading(true);
        response = await fetch("https://fullnode.testnet.aptoslabs.com/v1/view", {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        if (response.ok) {
          const campaignsData = await response.json();
          console.log(campaignsData);
          let needed = campaignsData[1];
          const formatNeeded = needed.map(campaign => ({
            id: campaign?.id,
            protocol: campaign?.protocol,
            campaign_title: campaign?.campaign_title,
            description: campaign?.description,
            status: campaign?.status,
            created: campaign?.created,
            quest_list: campaign?.quest_list,
            metric: campaign?.metric,
            participants: campaign?.participants,
            prices: campaign?.prices,
            deadline: campaign?.deadline,
          }));
          if (campaignsData.flat().length > 0) {
             setCampaigns(formatNeeded || []);
          }
        } else {
          throw new Error('Failed to fetch documents');
        }
      } catch(error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [connected, account?.address, moduleAddress, moduleName])

  const downloadCSV = (campaignId: string) => {
    // Implement CSV download logic here
    console.log(`Downloading CSV for campaign ${campaignId}`)
  }

  const shareCampaign = (campaignId: string) => {
    // Implement share logic here
    console.log(`Sharing campaign ${campaignId}`)
  }

  const CampaignTable = ({ campaigns }: { campaigns: typeof campaigns }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Active Participants</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns?.map((campaign) => (
          <TableRow key={campaign.id}>
            <TableCell className="font-medium">{campaign.campaign_title}</TableCell>
            <TableCell>
              <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                {campaign.status}
              </Badge>
            </TableCell>
            <TableCell>{convertTimestampToDate(parseInt(campaign.created))}</TableCell>
            <TableCell>{campaign.participants?.length}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCampaign(campaign)}>
                      <Eye className="h-4 w-4 mr-2" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{campaign.campaign_title}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] overflow-auto">
                      <div className="space-y-4">
                        <p className="text-muted-foreground">{campaign.description}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold">Created</h4>
                            <p>{campaign.created}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold">Status</h4>
                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                              {campaign.status}
                            </Badge>
                          </div>
                          <div>
                            <h4 className="font-semibold">Active Participants</h4>
                            <p>{campaign.participants?.length}</p>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold mt-4">Quests:</h3>
                        {campaign.quest_list.map((quest, index) => (
                          <div key={index} className="border-t pt-4">
                            <h4 className="font-medium">{quest.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{quest.description}</p>
                            {quest.link && (
                              <a href={quest.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-1 block">
                                Learn more
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={() => downloadCSV(campaign.id)}>
                  <Download className="h-4 w-4 mr-2" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => shareCampaign(campaign.id)}>
                  <Share2 className="h-4 w-4 mr-2" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const EmptyState = ({ type }: { type: 'quests' | 'campaigns' }) => (
    <Card className="flex flex-col shadow-none border-none items-center justify-center p-6 text-center">
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
    <div className="space-y-4">
      <Skeleton className="h-10 w-[250px]" />
      <Skeleton className="h-4 w-[300px]" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )

  const CampaignContent = ({ campaigns, tabValue }) => {
    console.log(campaigns);
    console.log(account?.address);
    if (loading || !connected || !account ) {
      return <SkeletonLoader />
    }

    if (campaigns.length === 0) {
      return <EmptyState type='camapigns' />
    }

    const filteredCampaigns = tabValue === 'all' 
      ? campaigns 
      : campaigns.filter(c => c.status === tabValue)

    return <CampaignTable campaigns={filteredCampaigns} />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Link href="/app/campaigns/create">
          <Button>Create New Campaign</Button>
        </Link>
      </div>
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Campaigns</TabsTrigger>
          <TabsTrigger value="active">Active Campaigns</TabsTrigger>
          <TabsTrigger value="completed">Closed Campaigns</TabsTrigger>
        </TabsList>
        {['all', 'active', 'completed'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            <Card>
              <CardHeader>
                <CardTitle>{tabValue.charAt(0).toUpperCase() + tabValue.slice(1)} Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <CampaignContent campaigns={campaigns} tabValue={tabValue} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}