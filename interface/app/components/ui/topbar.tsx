"use client";

import { Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import Image from "next/image";
import WalletSelector from "@/app/components/wallet_selector";
import AmniLogo from "@/public/Amfi.png";
import AmfiLogoDark from "@/public/Amfi_dark.png";

interface TopbarProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
}

export default function Topbar({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: TopbarProps) {
  return (
    <header className="flex justify-between items-center px-8 py-4 border-b border-[#BFBFBF]">
      <div className="flex items-center">
        {!darkMode ? <Image src={AmniLogo} alt="Amfi Logo" width={40} height={40} className="mr-2" /> : <Image src={AmfiLogoDark} alt="Amfi Logo" width={40} height={40} className="mr-2" />}
      </div>
      <div className="flex items-center space-x-4">
        <WalletSelector />
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="User" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-full"
        >
          {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
        </Button>
      </div>
    </header>
  )
}