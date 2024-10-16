"use client"

import { useState } from "react"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Users, Activity, Gift, X } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { Button } from '@/app/components/ui/button'
import { ScrollArea } from "@/app/components/ui/scroll-area"

const navItems = [
  { href: '/user/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/user/quests', label: 'Quests', icon: Activity },
  { href: '/user/campaigns', label: 'Campaigns', icon: Users },
  { href: '/user/rewards', label: 'Rewards', icon: Gift },
]

interface SidebarProps {
  className?: string
  darkMode: boolean
  sidebarOpen: boolean
  setSidebarOpen: (value: boolean) => void
}

export function Sidebar({ className, darkMode, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname()

  return (
    <nav className={cn(`
      ${darkMode ? "bg-[#1A1A1A]" : "bg-[#F5F5F5]"}
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      fixed inset-y-0 left-0 z-50 lg:w-64 border-r border-[#BFBFBF] transition-transform duration-300 ease-in-out md:relative md:translate-x-0
    `, className)}>
      <div className="flex justify-between items-center p-4 border-b border-[#BFBFBF] md:hidden">
        <h2 className="text-xl font-semibold">Menu</h2>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
          <X className="h-6 w-6" />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)] p-4 ">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  pathname === item.href && "bg-muted"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span className="md:hidden lg:inline">{item.label}</span>
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </nav>
  )
}

export default Sidebar