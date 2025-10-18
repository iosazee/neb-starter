"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  Shield,
  Info,
  X,
  Trash2,
  HardDrive,
  Users,
  Activity,
} from "lucide-react";
import { CacheDashboardSkeleton } from "../general/cache-dashboard-skeleton";

// Type definitions for cache metrics
interface MemoryMetrics {
  totalEntries: number;
  byKeyType: Record<string, number>;
  sizeBytes: number;
  sizeMB: number;
  memoryUtilization: number;
  hitRate: number;
  missRate: number;
  evictionRate: number;
  topKeys: Array<{ key: string; hits: number }>;
}

interface DatabaseMetrics {
  totalEntries: number;
  byPrefix: Record<string, number>;
  expiredEntries: number;
  oldestEntryAgeHours: number;
  averageEntryAgeHours: number;
}

interface SessionMetrics {
  activeSessionsCount: number;
  recentSessionsCount: number;
  averageSessionAgeHours: number;
  userCount: number;
  byStorage: {
    memory: number;
    database: number;
  };
  byUserAgent: Array<{ agent: string; count: number }>;
  byUser: Record<string, number>;
}

interface CacheHealthMetrics {
  status: "healthy" | "degraded" | "unhealthy";
  memory: MemoryMetrics;
  database: DatabaseMetrics;
  sessions: SessionMetrics;
  timestamp: number;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

interface MaintenanceOptions {
  cleanExpired: boolean;
  compactMemory: boolean;
  cleanDatabase: boolean;
}

interface MaintenanceResult {
  successful: boolean;
  actionsPerformed: string[];
  entriesAffected: number;
  memoryFreed: number;
  databaseEntriesRemoved: number;
  timestamp: number;
  error?: string;
}

interface CacheMetricsResponse {
  data: CacheHealthMetrics;
  timestamp: number;
}

interface MaintenanceResponse {
  result: MaintenanceResult;
}

interface ClearCacheResponse {
  success: boolean;
  memoryEntriesRemoved: number;
  databaseEntriesRemoved: number;
  totalRemoved: number;
}

// Custom hook for fetching cache metrics with proper typing
const useCacheMetrics = () => {
  const [data, setData] = useState<CacheHealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async (_forceRefresh = false): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Add cache-busting parameter
      const timestamp = Date.now();
      const response = await fetch(`/api/cache/metrics?_=${timestamp}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = (await response.json()) as CacheMetricsResponse;
      setData(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch cache metrics";
      setError(errorMessage);
      console.error("Error fetching cache metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchMetrics();
  }, []);

  return { data, isLoading, error, refetch: fetchMetrics };
};

export default function CacheDashboard(): React.JSX.Element {
  const { data, isLoading, error, refetch } = useCacheMetrics();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isPerformingMaintenance, setIsPerformingMaintenance] = useState<boolean>(false);
  const [maintenanceOptions, setMaintenanceOptions] = useState<MaintenanceOptions>({
    cleanExpired: true,
    compactMemory: true,
    cleanDatabase: true,
  });
  const [maintenanceResult, setMaintenanceResult] = useState<MaintenanceResult | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // Auto-refresh setup
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (autoRefresh) {
      intervalId = setInterval(() => {
        refetch(true);
      }, 15000); // Refresh every 15 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refetch]);

  // Perform maintenance
  const handleMaintenance = async (): Promise<void> => {
    try {
      setIsPerformingMaintenance(true);
      setMaintenanceResult(null);

      const response = await fetch("/api/cache/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: maintenanceOptions }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = (await response.json()) as MaintenanceResponse;
      setMaintenanceResult(result.result);

      // Refresh metrics after maintenance with slight delay
      setTimeout(() => refetch(true), 1000);
    } catch (err) {
      console.error("Maintenance error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to perform maintenance";
      setMaintenanceResult({
        successful: false,
        actionsPerformed: [],
        entriesAffected: 0,
        memoryFreed: 0,
        databaseEntriesRemoved: 0,
        timestamp: Date.now(),
        error: errorMessage,
      });
    } finally {
      setIsPerformingMaintenance(false);
    }
  };

  // Clear cache by prefix
  const clearCacheByPrefix = async (prefix: string): Promise<void> => {
    try {
      const confirmed = window.confirm(
        `Are you sure you want to clear all cache entries with prefix "${prefix || "ALL"}"?`
      );

      if (!confirmed) return;

      const response = await fetch(`/api/cache/clear?prefix=${prefix || ""}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = (await response.json()) as ClearCacheResponse;
      alert(`Successfully removed ${result.totalRemoved} cache entries`);

      // Refresh metrics after clearing
      setTimeout(() => refetch(true), 1000);
    } catch (err) {
      console.error("Error clearing cache:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert(`Failed to clear cache: ${errorMessage}`);
    }
  };

  // Toggle maintenance option
  const toggleOption = (option: keyof MaintenanceOptions): void => {
    setMaintenanceOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  // Format numbers
  const formatNumber = (num: number, decimals = 1): string => {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(num);
  };

  // Helper to render status badge
  const renderStatusBadge = (
    status: "healthy" | "degraded" | "unhealthy" | string
  ): React.JSX.Element => {
    switch (status) {
      case "healthy":
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span className="text-xs font-medium">Healthy</span>
          </div>
        );
      case "degraded":
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            <span className="text-xs font-medium">Degraded</span>
          </div>
        );
      case "unhealthy":
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            <span className="text-xs font-medium">Unhealthy</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
            <Info className="w-3 h-3 mr-1" />
            <span className="text-xs font-medium">Unknown</span>
          </div>
        );
    }
  };

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Error Loading Cache Metrics
          </h2>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => refetch(true)}
            className="mt-3 px-4 py-2 bg-white border border-red-300 rounded-md text-red-700 hover:bg-red-50"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show skeleton for both loading state and when no data is available
  if (isLoading || !data) {
    return <CacheDashboardSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cache Monitor</h1>
          <p className="text-gray-500">Monitor and manage cache performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 text-sm border rounded-md flex items-center ${
              autoRefresh ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300"
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto-refreshing" : "Auto-refresh"}
          </button>
          <button
            onClick={() => refetch(true)}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-md flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {/* Status Card */}
          <div className="bg-white p-3 md:p-4 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Cache Status</p>
                <div className="mt-2">{renderStatusBadge(data.status)}</div>
              </div>
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            {data.errors && data.errors.length > 0 && (
              <p className="mt-2 text-xs text-red-600">{data.errors.length} critical issues</p>
            )}
          </div>

          {/* Memory Usage Card */}
          <div className="bg-white p-3 md:p-4 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Memory Usage</p>
                <p className="text-base sm:text-xl font-semibold mt-1">
                  {formatNumber(data.memory ? data.memory.sizeMB : 0)} MB
                </p>
              </div>
              <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  data.memory && data.memory.memoryUtilization > 90
                    ? "bg-red-500"
                    : data.memory && data.memory.memoryUtilization > 75
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${data.memory ? data.memory.memoryUtilization : 0}%` }}
              ></div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formatNumber(data.memory ? data.memory.memoryUtilization : 0)}% of allocated
            </p>
          </div>

          {/* Database Cache Card */}
          <div className="bg-white p-3 md:p-4 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Database Cache</p>
                <p className="text-base sm:text-xl font-semibold mt-1">
                  {data.database ? data.database.totalEntries : 0} entries
                </p>
              </div>
              <Database className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
            </div>
            {data.database && data.database.expiredEntries > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {data.database.expiredEntries} expired entries
              </p>
            )}
          </div>

          {/* Sessions Card */}
          <div className="bg-white p-3 md:p-4 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Active Sessions</p>
                <p className="text-base sm:text-xl font-semibold mt-1">
                  {data.sessions ? data.sessions.activeSessionsCount : 0}
                </p>
              </div>
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {data.sessions ? data.sessions.userCount : 0} unique users
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-3 md:px-4 text-xs md:text-sm font-medium ${
                  activeTab === "overview"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("memory")}
                className={`py-2 px-3 md:px-4 text-xs md:text-sm font-medium ${
                  activeTab === "memory"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Memory
              </button>
              <button
                onClick={() => setActiveTab("database")}
                className={`py-2 px-3 md:px-4 text-xs md:text-sm font-medium ${
                  activeTab === "database"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Database
              </button>
              <button
                onClick={() => setActiveTab("sessions")}
                className={`py-2 px-3 md:px-4 text-xs md:text-sm font-medium ${
                  activeTab === "sessions"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Sessions
              </button>
              <button
                onClick={() => setActiveTab("maintenance")}
                className={`py-2 px-3 md:px-4 text-xs md:text-sm font-medium ${
                  activeTab === "maintenance"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Maintenance
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Main metrics */}
              <div className="lg:col-span-3 bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">Cache Overview</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Memory metrics */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 text-gray-500">Memory Cache</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Entries</span>
                        <span className="text-sm font-medium">{data.memory.totalEntries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Size</span>
                        <span className="text-sm font-medium">
                          {formatNumber(data.memory.sizeMB)} MB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Hit rate</span>
                        <span className="text-sm font-medium">
                          {formatNumber(data.memory.hitRate * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Miss rate</span>
                        <span className="text-sm font-medium">
                          {formatNumber(data.memory.missRate * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Memory utilization</span>
                        <span className="text-sm font-medium">
                          {formatNumber(data.memory.memoryUtilization)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Database metrics */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 text-gray-500">Database Cache</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Total entries</span>
                        <span className="text-sm font-medium">{data.database.totalEntries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Expired entries</span>
                        <span className="text-sm font-medium">{data.database.expiredEntries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Avg. entry age</span>
                        <span className="text-sm font-medium">
                          {formatNumber(data.database.averageEntryAgeHours)} hours
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Oldest entry</span>
                        <span className="text-sm font-medium">
                          {formatNumber(data.database.oldestEntryAgeHours)} hours
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {data.recommendations && data.recommendations.length > 0 && (
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium mb-3 text-gray-500">Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {data.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings and errors */}
                {data.warnings &&
                  data.errors &&
                  (data.warnings.length > 0 || data.errors.length > 0) && (
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-medium mb-3 text-gray-500">Issues</h3>

                      {data.errors.map((error: string, i: number) => (
                        <div key={`error-${i}`} className="flex items-start gap-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 mt-0.5">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Error
                          </span>
                          <span className="text-sm">{error}</span>
                        </div>
                      ))}

                      {data.warnings.map((warning: string, i: number) => (
                        <div key={`warning-${i}`} className="flex items-start gap-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-0.5">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Warning
                          </span>
                          <span className="text-sm">{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleMaintenance}
                    disabled={isPerformingMaintenance}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isPerformingMaintenance ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Running Maintenance...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Run Maintenance
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Side panel */}
              <div className="space-y-4 md:space-y-6">
                {/* Top keys */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                  <h3 className="text-sm font-medium mb-3">Top Cache Keys</h3>
                  {data.memory && data.memory.topKeys && data.memory.topKeys.length > 0 ? (
                    <div className="space-y-2">
                      {data.memory.topKeys.slice(0, 5).map((key, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="truncate max-w-[160px] text-xs text-gray-500">
                            {key.key}
                          </div>
                          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                            {key.hits} hits
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No hot keys data available</p>
                  )}
                </div>

                {/* Quick actions */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                  <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => clearCacheByPrefix("auth:secondary:session")}
                      className="w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="truncate">Clear Session Cache</span>
                    </button>
                    <button
                      onClick={() => clearCacheByPrefix("auth:secondary:token")}
                      className="w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="truncate">Clear Token Cache</span>
                    </button>
                    <button
                      onClick={() => clearCacheByPrefix("auth:secondary:")}
                      className="w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-md hover:bg-gray-50 flex items-center text-amber-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span className="truncate">Clear All Cache</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "memory" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">Memory Cache Details</h2>

                <div className="space-y-6">
                  {/* Memory usage chart (simplified) */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-2 text-gray-500">Memory Utilization</h3>
                    <div className="h-6 w-full bg-gray-200 rounded-full">
                      <div
                        className={`h-6 rounded-full ${
                          data?.memory?.memoryUtilization > 90
                            ? "bg-red-500"
                            : data?.memory?.memoryUtilization > 75
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        } flex items-center justify-center text-xs text-white font-medium`}
                        style={{ width: `${data?.memory?.memoryUtilization || 0}%` }}
                      >
                        {formatNumber(data?.memory?.memoryUtilization || 0)}%
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Performance stats */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-500">Performance</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Hit Rate</p>
                        <p className="text-lg font-semibold">
                          {formatNumber((data?.memory?.hitRate || 0) * 100)}%
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Miss Rate</p>
                        <p className="text-lg font-semibold">
                          {formatNumber((data?.memory?.missRate || 0) * 100)}%
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Eviction Rate</p>
                        <p className="text-lg font-semibold">
                          {formatNumber((data?.memory?.evictionRate || 0) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Entries by type */}
                  {data?.memory?.byKeyType && Object.keys(data.memory.byKeyType).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3 text-gray-500">Entries by Type</h3>
                      <div className="space-y-2">
                        {Object.entries(data.memory.byKeyType).map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 truncate max-w-[60%]">
                              {type}
                            </span>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hot keys */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">Hot Keys</h2>

                {data?.memory?.topKeys && data.memory.topKeys.length > 0 ? (
                  <div className="space-y-3">
                    {data.memory.topKeys.map((key, i) => (
                      <div key={i} className="border-b border-gray-200 pb-2 last:border-0">
                        <div className="flex justify-between items-center mb-1">
                          <div className="truncate max-w-[180px] text-sm font-medium">
                            {key.key}
                          </div>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                            {key.hits} hits
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Type:{" "}
                          {key.key.includes("session")
                            ? "Session"
                            : key.key.includes("token")
                              ? "Token"
                              : key.key.includes("user_role")
                                ? "User Role"
                                : "Other"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-500">No hot keys data available</p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => clearCacheByPrefix("")}
                    className="w-full px-3 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Database Tab */}
          {activeTab === "database" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">Database Cache Details</h2>

                <div className="space-y-6">
                  {/* Database metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500">Total Entries</p>
                      <p className="text-xl sm:text-2xl font-semibold">
                        {data?.database?.totalEntries || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500">Expired Entries</p>
                      <p className="text-xl sm:text-2xl font-semibold">
                        {data?.database?.expiredEntries || 0}
                      </p>
                    </div>
                  </div>

                  {/* Age metrics */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-500">Age Metrics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Average Entry Age</p>
                        <p className="text-lg font-semibold">
                          {formatNumber(data?.database?.averageEntryAgeHours || 0)} hours
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Oldest Entry</p>
                        <p className="text-lg font-semibold">
                          {formatNumber(data?.database?.oldestEntryAgeHours || 0)} hours
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Entries by prefix */}
                  {data?.database?.byPrefix && Object.keys(data.database.byPrefix).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3 text-gray-500">Entries by Prefix</h3>
                      <div className="space-y-2">
                        {Object.entries(data.database.byPrefix).map(([prefix, count]) => (
                          <div key={prefix} className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 truncate max-w-[40%] md:max-w-[60%]">
                              {prefix}
                            </span>
                            <div className="flex items-center">
                              <span className="text-sm font-medium mr-2">{count}</span>
                              <button
                                onClick={() => clearCacheByPrefix(prefix)}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center"
                              >
                                <Trash2 className="w-3 h-3 mr-1 text-gray-500" />
                                Clear
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">Database Actions</h2>

                <div className="space-y-4">
                  <button
                    onClick={() => handleMaintenance()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clean Expired Entries
                  </button>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-medium mb-3 text-gray-500">Clear by Prefix</h3>

                    <div className="space-y-2">
                      <button
                        onClick={() => clearCacheByPrefix("auth:secondary:session")}
                        className="w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="truncate">Clear Session Cache</span>
                      </button>
                      <button
                        onClick={() => clearCacheByPrefix("auth:secondary:token")}
                        className="w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="truncate">Clear Token Cache</span>
                      </button>
                      <button
                        onClick={() => clearCacheByPrefix("auth:secondary:user_role")}
                        className="w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="truncate">Clear User Role Cache</span>
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => clearCacheByPrefix("")}
                        className="w-full px-3 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Database Cache
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">Session Statistics</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <p className="text-xs text-gray-500">Active Sessions</p>
                    <p className="text-xl md:text-2xl font-semibold">
                      {data?.sessions?.activeSessionsCount || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <p className="text-xs text-gray-500">Unique Users</p>
                    <p className="text-xl md:text-2xl font-semibold">
                      {data?.sessions?.userCount || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <p className="text-xs text-gray-500">Recent Sessions (24h)</p>
                    <p className="text-xl md:text-2xl font-semibold">
                      {data?.sessions?.recentSessionsCount || 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Storage breakdown */}
                  {data?.sessions?.byStorage && (
                    <div>
                      <h3 className="text-sm font-medium mb-3 text-gray-500">Storage Breakdown</h3>
                      {data.sessions.activeSessionsCount > 0 ? (
                        <>
                          <div className="flex h-4 mb-2">
                            <div
                              className="bg-blue-500 rounded-l text-xs flex items-center justify-center px-1 text-white"
                              style={{
                                width: `${(data.sessions.byStorage.memory / data.sessions.activeSessionsCount) * 100}%`,
                              }}
                            >
                              {data.sessions.byStorage.memory > 5 ? "Memory" : ""}
                            </div>
                            <div
                              className="bg-green-500 rounded-r text-xs flex items-center justify-center px-1 text-white"
                              style={{
                                width: `${(data.sessions.byStorage.database / data.sessions.activeSessionsCount) * 100}%`,
                              }}
                            >
                              {data.sessions.byStorage.database > 5 ? "Database" : ""}
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Memory: {data.sessions.byStorage.memory} sessions</span>
                            <span>Database: {data.sessions.byStorage.database} sessions</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No active sessions found</p>
                      )}
                    </div>
                  )}

                  {/* Sessions by user */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 text-gray-500">
                      Sessions by User
                      <span className="ml-2 text-xs text-gray-400">(Top 10)</span>
                    </h3>

                    <div className="max-h-48 overflow-y-auto pr-2">
                      {data?.sessions?.byUser && Object.entries(data.sessions.byUser).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(data.sessions.byUser)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 10)
                            .map(([userId, count]) => (
                              <div key={userId} className="flex justify-between items-center">
                                <div className="truncate max-w-[180px] text-sm">{userId}</div>
                                <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                                  {count} sessions
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <p>No user session data</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* User agents */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">User Agents</h2>

                {data?.sessions?.byUserAgent && data.sessions.byUserAgent.length > 0 ? (
                  <div className="space-y-4">
                    {data.sessions.byUserAgent.map((item, i) => (
                      <div key={i} className="border-b border-gray-200 pb-3 last:border-0">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium truncate max-w-[70%]">
                            {item.agent}
                          </span>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                            {item.count} sessions
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{
                              width: `${data.sessions.activeSessionsCount > 0 ? (item.count / data.sessions.activeSessionsCount) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-500">No user agent data available</p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => clearCacheByPrefix("auth:secondary:session")}
                    className="w-full px-3 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Session Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === "maintenance" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Maintenance options */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">Maintenance Options</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <h3 className="text-sm font-medium">Clean Expired Entries</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Remove expired items from both memory and database
                      </p>
                    </div>
                    <button
                      onClick={() => toggleOption("cleanExpired")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        maintenanceOptions.cleanExpired ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          maintenanceOptions.cleanExpired ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <h3 className="text-sm font-medium">Compact Memory</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Optimize memory usage and reduce fragmentation
                      </p>
                    </div>
                    <button
                      onClick={() => toggleOption("compactMemory")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        maintenanceOptions.compactMemory ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          maintenanceOptions.compactMemory ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <h3 className="text-sm font-medium">Clean Database Cache</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Remove expired entries from the database
                      </p>
                    </div>
                    <button
                      onClick={() => toggleOption("cleanDatabase")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        maintenanceOptions.cleanDatabase ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          maintenanceOptions.cleanDatabase ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleMaintenance}
                    disabled={isPerformingMaintenance}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isPerformingMaintenance ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Running Maintenance...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Run Maintenance
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Maintenance results */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">Maintenance Results</h2>

                {maintenanceResult ? (
                  <div>
                    {maintenanceResult.successful ? (
                      <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">Maintenance completed successfully</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                        <div className="flex items-center">
                          <AlertCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">Maintenance failed</span>
                        </div>
                        {maintenanceResult.error && (
                          <p className="mt-1 text-sm">{maintenanceResult.error}</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Actions Performed</h3>
                      {maintenanceResult.actionsPerformed &&
                      maintenanceResult.actionsPerformed.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {maintenanceResult.actionsPerformed.map((action: string, i: number) => (
                            <li key={i} className="text-sm">
                              {action}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No actions performed</p>
                      )}

                      <h3 className="text-sm font-medium pt-2">Results</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Entries affected</span>
                          <span className="text-sm font-medium">
                            {maintenanceResult.entriesAffected}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Memory freed</span>
                          <span className="text-sm font-medium">
                            {maintenanceResult.memoryFreed} MB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Database entries removed</span>
                          <span className="text-sm font-medium">
                            {maintenanceResult.databaseEntriesRemoved}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Timestamp</span>
                          <span className="text-sm font-medium">
                            {new Date(maintenanceResult.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-500">No maintenance has been performed yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Run maintenance to see results here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
