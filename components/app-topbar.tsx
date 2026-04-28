"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  LayoutDashboardIcon,
  ListIcon,
  BrickWallShield,
  BatteryPlusIcon,
  Radar,
  Menu,
  Settings2Icon,
  SearchIcon,
  BellIcon,
  UserCircleIcon,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navMain = [
  {
    title: "Dashboard",
    url: "/",
    icon: <LayoutDashboardIcon className="w-4 h-4" />,
  },
  {
    title: "Vulnerability Scan",
    url: "/vulnerability-scan",
    icon: <Radar className="w-4 h-4" />,
  },
  {
    title: "Asset Manager",
    url: "/asset-manager",
    icon: <ListIcon className="w-4 h-4" />,
  },
  {
    title: "Security Ops",
    url: "/security-ops-monitoring",
    icon: <BrickWallShield className="w-4 h-4" />,
  },
  {
    title: "Energy Monitoring",
    url: "/energy-monitoring",
    icon: <BatteryPlusIcon className="w-4 h-4" />,
  },
];

export function AppTopbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md transition-colors duration-300">
      <div className="flex h-16 items-center px-4 md:px-8 max-w-[1600px] mx-auto gap-4">
        {/* LOGO */}
        <div className="flex items-center gap-3 shrink-0 mr-4">
          <Image
            src="/images/sw-logo.png"
            alt="SW Logo"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="text-lg font-bold text-zinc-900 dark:text-white hidden md:block">
            Smart Energy Lab
          </span>
        </div>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center justify-center gap-1 flex-1 overflow-x-auto no-scrollbar">
          {navMain.map((item) => {
            const isActive = pathname === item.url;
            return (
              <Link
                key={item.title}
                href={item.url}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-all select-none whitespace-nowrap",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
          <Button variant="ghost" size="icon" className="text-zinc-600 dark:text-zinc-400">
            <SearchIcon className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-zinc-600 dark:text-zinc-400">
            <BellIcon className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 rounded-full overflow-hidden ml-2 border border-border bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <UserCircleIcon className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
          </div>
        </div>

        {/* MOBILE NAVIGATION */}
        <div className="md:hidden shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-zinc-900 dark:text-white">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e]">
              <SheetHeader className="text-left border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4">
                <SheetTitle className="flex items-center gap-3">
                  <Image
                    src="/images/sw-logo.png"
                    alt="SW Logo"
                    width={32}
                    height={32}
                    className="rounded-md"
                  />
                  <span className="font-bold text-zinc-900 dark:text-white">Smart Energy Lab</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2">
                {navMain.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <Link
                      key={item.title}
                      href={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-all",
                        isActive
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      {item.icon}
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
