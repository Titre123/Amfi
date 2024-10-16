"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Users, Activity, Wallet, Gift } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { Button } from '@/app/components/ui/button'

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/app/quests', label: 'Quests', icon: Activity },
  { href: '/app/campaigns', label: 'Campaigns', icon: Users },
  { href: '/app/rewards', label: 'Rewards', icon: Gift },
]

interface BottomBarProps {
  className?: string
  darkMode: boolean
}

export function BottomBar({ className, darkMode }: BottomBarProps) {
  const pathname = usePathname()

  return (
    <nav className={cn(`
      ${darkMode ? "bg-[#1A1A1A]" : "bg-[#F5F5F5]"}
      fixed bottom-0 left-0 right-0 z-50 border-t border-[#BFBFBF]
    `, className)}>
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "flex-1 h-full",
              pathname === item.href && "bg-muted"
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="h-6 w-6" />
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  )
}

export default BottomBar