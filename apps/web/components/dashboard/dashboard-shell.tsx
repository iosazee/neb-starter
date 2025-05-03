"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { BarChart, Calendar, CreditCard, Users, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOutButton } from "@/components/auth/logout-button";
import { SessionUser } from "@/@types";

interface DashboardShellProps {
  user: SessionUser;
}

export function DashboardShell({ user }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitials = (name: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
  };

  // Calculate the user's initials
  const userInitials = getInitials(`${user.firstName} ${user.lastName}`);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <h2 className="text-2xl font-bold">NEB Starter</h2>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-2 mb-1" asChild>
            <a href="/dashboard" className="font-medium">
              <BarChart className="w-5 h-5" />
              Dashboard
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 mb-1" asChild>
            <a href="/dashboard/users">
              <Users className="w-5 h-5" />
              Users
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 mb-1" asChild>
            <a href="/dashboard/calendar">
              <Calendar className="w-5 h-5" />
              Calendar
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 mb-1" asChild>
            <a href="/dashboard/billing">
              <CreditCard className="w-5 h-5" />
              Billing
            </a>
          </Button>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          {user && (
            <div className="flex items-center gap-3">
              <Avatar>
                {user.image ? (
                  <Image src={user.image} alt={user.name || ""} width={40} height={40} />
                ) : null}
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <LogOutButton variant="ghost" size="icon" />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-64 sm:max-w-none">
          <div className="p-4">
            <h2 className="text-2xl font-bold">NEB Starter</h2>
          </div>
          <nav className="flex-1 px-2 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 mb-1"
              asChild
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <a href="/dashboard" className="font-medium">
                <BarChart className="w-5 h-5" />
                Dashboard
              </a>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 mb-1"
              asChild
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <a href="/dashboard/users">
                <Users className="w-5 h-5" />
                Users
              </a>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 mb-1"
              asChild
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <a href="/dashboard/calendar">
                <Calendar className="w-5 h-5" />
                Calendar
              </a>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 mb-1"
              asChild
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <a href="/dashboard/billing">
                <CreditCard className="w-5 h-5" />
                Billing
              </a>
            </Button>
          </nav>
          {user && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
              <div className="flex items-center gap-3">
                <Avatar>
                  {user.image ? <AvatarImage src={user.image} alt={user.name || ""} /> : null}
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <LogOutButton variant="ghost" size="icon" />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="h-16 flex items-center bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h1 className="text-lg font-bold">Dashboard</h1>
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold">Dashboard</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {user.image ? <AvatarImage src={user.image} alt={user.name || ""} /> : null}
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">
                      Role: {user.role || "user"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/dashboard/profile">Profile</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/dashboard/settings">Settings</a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <LogOutButton variant="ghost" className="w-full justify-start p-2 h-8" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome to your dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Hello, {user.firstName}! You are logged in as {user.role || "user"}.
              </p>
              <p className="text-muted-foreground mt-2">
                This is a simple starter dashboard for your application.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <span className="font-medium">Full Name:</span>
                  <span>
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <span className="font-medium">Email:</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <span className="font-medium">Role:</span>
                  <span>{user.role || "user"}</span>
                </div>
                {user.image && (
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <span className="font-medium">Profile Image:</span>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.image} alt={user.name || ""} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
