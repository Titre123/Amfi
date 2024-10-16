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
  const [selectedQuest, setSelectedQuest] = useState(null)
  const [quests, setQuests] = useState([])
  const [loading, setLoading] = useState(false);

  const moduleAddress = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
  const moduleName = process.env.NEXT_PUBLIC_MODULE_NAME;

  useEffect(() => {
    let response;
    const body = {
      function: `${moduleAddress}::${moduleName}::getProtocolMetrics`,
      type_arguments: [],
      arguments: [account?.address],
    };
    const fetchQuests = async () => {
      setLoading(true);
      if(!account?.address || !connected) {
        setQuests([]);
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
          const questsData = await response.json();
          console.log(questsData);
          let needed = questsData[0];

          const formatNeeded = needed.map(quest => ({
            name: quest?.quest_title,
            description: quest?.description,
            status: quest?.status || 'active',
            created: quest?.created,
            particpants: quest?.particpants,
            questions: quest?.quest_list,
          }));
          if (questsData.flat().length > 0) {
             setQuests(formatNeeded || []);
          }
        } else {
          throw new Error('Failed to fetch documents');
        }
      } catch(error) {
        console.error('Error fetching quests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuests();
  }, [connected, account?.address, moduleAddress, moduleName])

  const downloadCSV = (questId: string) => {
    // Implement CSV download logic here
    console.log(`Downloading CSV for quest ${questId}`)
  }

  const shareQuest = (questId: string) => {
    // Implement share logic here
    console.log(`Sharing quest ${questId}`)
  }

  const QuestTable = ({ quests }: { quests: typeof quests }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quests?.map((quest) => (
          <TableRow key={quest.id}>
            <TableCell className="font-medium">{quest.name}</TableCell>
            <TableCell>
              <Badge variant={quest.status === 'active' ? 'default' : 'secondary'}>
                {quest.status}
              </Badge>
            </TableCell>
            <TableCell>{format(parseInt(quest.created), 'PP')}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedQuest(quest)}>
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{quest.name}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] overflow-auto">
                      <div className="space-y-4">
                        <p className="text-muted-foreground">{quest.description}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold">Created</h4>
                            <p>{format(parseInt(quest.created), 'PP')}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold">Status</h4>
                            <Badge variant={quest.status === 'active' ? 'default' : 'secondary'}>
                              {quest.status}
                            </Badge>
                          </div>
                          <div>
                            <h4 className="font-semibold">Active Participants</h4>
                            <p>{quest.activeParticipants}</p>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold mt-4">Questions:</h3>
                        {quest.questions.map((question, index) => (
                          <div key={index} className="border-t pt-4">
                            <h4 className="font-medium">{question.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                            {question.link && (
                              <a href={question.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-1 block">
                                Learn more
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={() => downloadCSV(quest.id)}>
                  <Download className="h-4 w-4 mr-2" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => shareQuest(quest.id)}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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

  const QuestContent = ({ quests, tabValue }) => {
    console.log(quests);
    console.log(account?.address);
    if (loading || !connected || !account ) {
      return <SkeletonLoader />
    }

    if (quests.length === 0) {
      return <EmptyState type='quests' />
    }

    const filteredQuests = tabValue === 'all' 
      ? quests 
      : quests.filter(q => q.status === tabValue)

    return <QuestTable quests={filteredQuests} />
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quests</h1>
        <Link href="/app/quests/create">
          <Button>Create New Quest</Button>
        </Link>
      </div>
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Quests</TabsTrigger>
          <TabsTrigger value="active">Active Quests</TabsTrigger>
          <TabsTrigger value="closed">Closed Quests</TabsTrigger>
        </TabsList>
        {['all', 'active', 'closed'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            <Card>
              <CardHeader>
                <CardTitle>{tabValue.charAt(0).toUpperCase() + tabValue.slice(1)} Quests</CardTitle>
              </CardHeader>
              <CardContent>
                <QuestContent quests={quests} tabValue={tabValue} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}