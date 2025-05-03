"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Database,
  Activity,
  Settings,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  User,
  UserCheck,
} from "lucide-react";

// Define the type for the initial data
interface DashboardData {
  userStats: {
    totalUsers: number;
    recentUsers: number;
    activeUsers: number;
  };
  sessionStats: {
    totalSessions: number;
    recentSessions: number;
    averageSessionAge: number;
    byUserAgent: Array<{ agent: string; count: number }>;
  };
  cacheStats: {
    status: string;
    memoryUsage: number;
    databaseEntries: number;
    totalEntries: number;
    alerts: number;
  };
}

interface AdminDashboardProps {
  initialData: DashboardData;
}

export default function AdminDashboard({ initialData }: AdminDashboardProps) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh dashboard data
  const refreshData = async () => {
    try {
      setIsLoading(true);

      // Cache-busting parameter
      const timestamp = Date.now();

      // Fetch fresh data from our API
      const response = await fetch(`/api/admin/dashboard?_=${timestamp}`);

      if (!response.ok) {
        throw new Error("Failed to refresh dashboard data");
      }

      const freshData = await response.json();
      setData(freshData.data);
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      // Could show toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation helper
  const navigateTo = (path: string) => {
    router.push(path);
  };

  // Format numbers with commas
  const formatNumber = (num: number, decimals = 0) => {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(num);
  };

  // Helper to render cache status badge
  const renderCacheStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
            <span className="text-xs font-medium">Healthy</span>
          </div>
        );
      case "degraded":
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
            <span className="text-xs font-medium">Degraded</span>
          </div>
        );
      case "unhealthy":
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
            <span className="text-xs font-medium">Unhealthy</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
            <span className="text-xs font-medium">Unknown</span>
          </div>
        );
    }
  };

  return (
    <div className="container px-4 py-6 mx-auto md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500">System overview and management</p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
        {/* Total Users */}
        <div className="bg-white p-3 md:p-6 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <User className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mb-1 md:mb-2" />
            <p className="text-xs md:text-sm font-medium text-gray-500 mb-0.5 md:mb-1">
              Total Users
            </p>
            <p className="text-lg md:text-2xl font-bold">
              {formatNumber(data.userStats.totalUsers)}
            </p>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white p-3 md:p-6 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <UserCheck className="h-6 w-6 md:h-8 md:w-8 text-green-500 mb-1 md:mb-2" />
            <p className="text-xs md:text-sm font-medium text-gray-500 mb-0.5 md:mb-1">
              New Users (30d)
            </p>
            <p className="text-lg md:text-2xl font-bold">
              {formatNumber(data.userStats.recentUsers)}
            </p>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white p-3 md:p-6 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <Users className="h-6 w-6 md:h-8 md:w-8 text-indigo-500 mb-1 md:mb-2" />
            <p className="text-xs md:text-sm font-medium text-gray-500 mb-0.5 md:mb-1">
              Active Users
            </p>
            <p className="text-lg md:text-2xl font-bold">
              {formatNumber(data.userStats.activeUsers)}
            </p>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white p-3 md:p-6 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <Activity className="h-6 w-6 md:h-8 md:w-8 text-purple-500 mb-1 md:mb-2" />
            <p className="text-xs md:text-sm font-medium text-gray-500 mb-0.5 md:mb-1">
              Active Sessions
            </p>
            <p className="text-lg md:text-2xl font-bold">
              {formatNumber(data.sessionStats.totalSessions)}
            </p>
          </div>
        </div>

        {/* Cache Status */}
        <div className="bg-white p-3 md:p-6 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <Database className="h-6 w-6 md:h-8 md:w-8 text-cyan-500 mb-1 md:mb-2" />
            <p className="text-xs md:text-sm font-medium text-gray-500 mb-0.5 md:mb-1">
              Cache Status
            </p>
            <div>{renderCacheStatusBadge(data.cacheStats.status)}</div>
          </div>
        </div>

        {/* Cache Alerts */}
        <div className="bg-white p-3 md:p-6 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-amber-500 mb-1 md:mb-2" />
            <p className="text-xs md:text-sm font-medium text-gray-500 mb-0.5 md:mb-1">
              Cache Alerts
            </p>
            <p className="text-lg md:text-2xl font-bold">{data.cacheStats.alerts}</p>
          </div>
        </div>
      </div>

      {/* Section Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* User Stats Module */}
        <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 md:p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              User Statistics
            </h2>
          </div>
          <div className="p-4 md:p-5">
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total users</span>
                <span className="font-medium">{formatNumber(data.userStats.totalUsers)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">New users (30 days)</span>
                <span className="font-medium">{formatNumber(data.userStats.recentUsers)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Active users</span>
                <span className="font-medium">{formatNumber(data.userStats.activeUsers)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">User growth</span>
                <span className="font-medium">
                  {data.userStats.totalUsers > 0
                    ? formatNumber(
                        (data.userStats.recentUsers / data.userStats.totalUsers) * 100,
                        1
                      ) + "%"
                    : "0%"}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200">
              <Link
                href="/admin/users"
                className="w-full inline-flex items-center justify-between px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span>Manage Users</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Session Stats Module */}
        <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 md:p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-500" />
              Session Statistics
            </h2>
          </div>
          <div className="p-4 md:p-5">
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Active sessions</span>
                <span className="font-medium">{formatNumber(data.sessionStats.totalSessions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Recent sessions (24h)</span>
                <span className="font-medium">
                  {formatNumber(data.sessionStats.recentSessions)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Avg. session age</span>
                <span className="font-medium">
                  {formatNumber(data.sessionStats.averageSessionAge, 1)} hours
                </span>
              </div>
            </div>

            {/* Top user agents */}
            {data.sessionStats.byUserAgent && data.sessionStats.byUserAgent.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium mb-3">Top Browsers</h3>
                <div className="space-y-2">
                  {data.sessionStats.byUserAgent.slice(0, 3).map((agent, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm truncate max-w-[70%]">{agent.agent}</span>
                      <div className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                        {agent.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-gray-200">
              <Link
                href="/admin/cache?tab=sessions"
                className="w-full inline-flex items-center justify-between px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span>View Session Details</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Cache Stats Module */}
        <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 md:p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center">
              <Database className="w-5 h-5 mr-2 text-cyan-500" />
              Cache Statistics
            </h2>
          </div>
          <div className="p-4 md:p-5">
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <span>{renderCacheStatusBadge(data.cacheStats.status)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Memory usage</span>
                <span className="font-medium">
                  {formatNumber(data.cacheStats.memoryUsage, 1)} MB
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Database entries</span>
                <span className="font-medium">{formatNumber(data.cacheStats.databaseEntries)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total entries</span>
                <span className="font-medium">{formatNumber(data.cacheStats.totalEntries)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Alerts</span>
                <span className="font-medium">{data.cacheStats.alerts}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200">
              <Link
                href="/admin/cache"
                className="w-full inline-flex items-center justify-between px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span>View Cache Monitor</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 md:p-5 mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <button
            onClick={() => navigateTo("/admin/users")}
            className="flex items-center justify-center px-3 py-2.5 md:px-4 md:py-3 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            <Users className="w-4 h-4 mr-2 text-blue-500" />
            <span>Manage Users</span>
          </button>

          <button
            onClick={() => navigateTo("/admin/cache?tab=maintenance")}
            className="flex items-center justify-center px-3 py-2.5 md:px-4 md:py-3 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            <Settings className="w-4 h-4 mr-2 text-green-500" />
            <span>Cache Maintenance</span>
          </button>

          <button
            onClick={() => navigateTo("/admin/cache?tab=sessions")}
            className="flex items-center justify-center px-3 py-2.5 md:px-4 md:py-3 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            <Activity className="w-4 h-4 mr-2 text-purple-500" />
            <span>View Sessions</span>
          </button>

          <button
            onClick={() => navigateTo("/admin/settings")}
            className="flex items-center justify-center px-3 py-2.5 md:px-4 md:py-3 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            <Settings className="w-4 h-4 mr-2 text-gray-500" />
            <span>System Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
