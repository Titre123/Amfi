'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Pagination } from "@/app/components/ui/pagination"
import { Gift, Trophy, ArrowRight, Calendar, MapPin, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

// Mock data and functions (replace with actual API calls)

export default function Dashboard() {
  const moduleAddress = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
  const moduleName = process.env.NEXT_PUBLIC_MODULE_NAME;
  const { account, connected } = useWallet();
  const [userData, setUserData] = useState<any>(null)
  const [questsAndCampaigns, setQuestsAndCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      if (!account || !connected) {
        return ;
      }

      try {
        const body = {
          function: `${moduleAddress}::${moduleName}::getUserMetric`,
          type_arguments: [],
          arguments: [account?.address],
        };

        const body_app = {
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

        const response_app = await fetch("https://fullnode.testnet.aptoslabs.com/v1/view", {
          method: "POST",
          body: JSON.stringify(body_app),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok || !response_app.ok) {
          throw new Error('Failed to fetch user metrics');
        }

        const [user, qAndC] = await Promise.all([
          response.json(),
          response_app.json(),
        ]);

        console.log(user);
        console.log(qAndC)

        setUserData(user);
        setQuestsAndCampaigns(qAndC);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData()
  }, [account?.address, moduleAddress, moduleName, connected])

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


  const filteredItems = questsAndCampaigns.flat(1).map(item => {
    if (item.quest_title) {
      return { ...item, type: 'quest' };
    } else if (item.campaign_title) {
      return { ...item, type: 'campaign' };
    }
    return item; // Return the item as is if it doesn't match
  }).filter(item => {
    console.log(item);
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = (item.quest_title?.toLowerCase().includes(search.toLowerCase()) || 
                           item.campaign_title?.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const SkeletonLoader = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[200px] w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (loading) return <SkeletonLoader />

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${userData?.unscratched_reward + userData?.scratched_reward || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scratched Rewards</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${userData?.scratched_reward || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unscratched Rewards</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${userData?.unscratched_reward || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Quests</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.[1]?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quests and Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paginatedItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-primary/10 p-4">
                      <h3 className="text-lg font-semibold text-primary">{item.quest_title || item.campaign_title}</h3>
                      <p className="text-sm text-muted-foreground uppercase">{item.protocol || 'Amfi'}</p>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center text-sm">
                        <Trophy className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span>{item.type}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span>Deadline: {convertTimestampToDate(item.deadline)}</span>
                      </div>
                      <p className="text-sm mt-2">{item.description}</p>
                      <div className="flex items-center justify-between mt-4">
                        <Badge variant={item.deadline > Date.now() ? (item.status === 'completed' ? 'secondary' : 'default') : 'secondary'}>
                          {item.deadline > (Date.now() / 1000) ? (item.status === 'completed' ? 'completed' : 'active') : 'completed'}
                        </Badge>
                        <span className="font-semibold">
                          ${item.type === 'quest' ? item.default_reward : (item.metric.total_reward / item.metric.participants).toFixed(2)} Reward
                        </span>
                      </div>
                    </div>
                    <div className="border-t p-4">
                      <Link href={item.type === 'quest' ? `/user/quests/${item.id}` : '/user/campaigns'}>
                        <Button className="w-full">
                          View Details
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}