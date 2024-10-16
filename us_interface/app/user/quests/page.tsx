"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { AlertCircle } from 'lucide-react'

export default function Page() {
  const [quests, setQuests] = useState([])
  const [loading, setLoading] = useState([]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quests</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Available Quests</CardTitle>
        </CardHeader>
        <CardContent>
          {quests.length > 0 ? (
            <Link href="/quests" className="text-primary hover:underline">
              View {quests.length} available quests
            </Link>
          ) : (
            <div className="flex flex-col items-center justify-center h-40">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground">No available quests</p>
              <p className="text-center text-muted-foreground mt-2">You don't have any available quests</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}