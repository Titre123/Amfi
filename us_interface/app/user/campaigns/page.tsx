"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { AlertCircle } from 'lucide-react'

export default function Page() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState([]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Campaigns</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Available Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length > 0 ? (
            <Link href="/campaigns" className="text-primary hover:underline">
              View {campaigns.length} available campaigns
            </Link>
          ) : (
            <div className="flex flex-col items-center justify-center h-40">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground">No available campaigns</p>
              <p className="text-center text-muted-foreground mt-2">You don't have any available campaigns</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}