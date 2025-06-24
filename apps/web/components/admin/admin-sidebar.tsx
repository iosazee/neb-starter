"use client";

import { useRouter, usePathname } from "next/navigation";
import { Activity, Database, Settings, Home, Shield, Users, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOutButton } from "@/components/auth/logout-button";
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { maskEmail } from "@/lib/utils";

interface AdminSidebarProps {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: Home,
      current: pathname === "/admin/dashboard",
    },
    {
      name: "Cache Monitor",
      href: "/admin/cache",
      icon: Database,
      current: pathname === "/admin/cache",
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: Users,
      current: pathname === "/admin/users",
    },
    {
      name: "System Health",
      href: "/admin/health",
      icon: Activity,
      current: pathname === "/admin/health",
    },
    {
      name: "Security",
      href: "/admin/security",
      icon: Shield,
      current: pathname === "/admin/security",
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      current: pathname === "/admin/settings",
    },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-lg font-bold">Admin Console</h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  variant={item.current ? "default" : "ghost"}
                  className="w-full justify-start"
                >
                  <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center w-full">
              <div className="truncate">
                <p className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {maskEmail(user.email)}
                </p>
              </div>
              <div className="ml-auto">
                <LogOutButton variant="ghost" size="icon" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header with menu */}
      <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 md:hidden">
        <Sheet>
          <SheetTitle></SheetTitle>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between p-4">
                <h2 className="text-lg font-semibold">Admin Console</h2>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                  </Button>
                </SheetClose>
              </div>
              <Separator />
              <div className="flex-1 overflow-auto py-2">
                <nav className="space-y-1 px-2">
                  {navigation.map((item) => (
                    <SheetClose key={item.name} asChild>
                      <Button
                        onClick={() => router.push(item.href)}
                        variant={item.current ? "default" : "ghost"}
                        className="w-full justify-start"
                      >
                        <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                        {item.name}
                      </Button>
                    </SheetClose>
                  ))}
                </nav>
              </div>
              <Separator />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="truncate pr-2">
                    <p className="text-sm font-medium truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {maskEmail(user.email)}
                    </p>
                  </div>
                  <div>
                    <LogOutButton variant="ghost" size="icon" />
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex-1 text-center text-lg font-semibold">Admin Console</div>
      </div>
    </>
  );
}
