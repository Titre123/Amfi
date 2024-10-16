"use client";

import { useState, useEffect } from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { Toaster } from "@/app/components/ui/toaster";
import Topbar from "@/app/components/ui/topbar";
import Sidebar from "@/app/components/ui/sidebar";
import BottomBar from "@/app/components/ui/bottom_bar"; // Assuming you have a BottomBar component
import '@/app/components/global.css';
import { karla } from '@/app/components/fonts';

const wallets = [new PetraWallet(), new MartianWallet()];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <html lang="en">
      <body className={`h-screen ${karla.className} flex flex-col ${darkMode ? "dark bg-[#1A1A1A] text-[#F5F5F5]" : "bg-[#F5F5F5] text-[#1A1A1A]"}`}>
        <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
          <div className="flex flex-col h-full">
            <Topbar
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar
                className="hidden md:block"
                darkMode={darkMode}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
              <main className="flex-1 p-6 md:p-8 overflow-auto">
                {children}
              </main>
            </div>
            <BottomBar className="md:hidden" darkMode={darkMode} />
            <Toaster />
          </div>
        </AptosWalletAdapterProvider>
      </body>
    </html>
  );
}
