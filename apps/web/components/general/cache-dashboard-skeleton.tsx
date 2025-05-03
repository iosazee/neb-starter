import { Skeleton } from "@/components/ui/skeleton";

export function CacheDashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2 bg-gray-200 hover:bg-gray-200" />
          <Skeleton className="h-4 w-64 bg-gray-200 hover:bg-gray-200" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-32 bg-gray-200 hover:bg-gray-200" />
          <Skeleton className="h-9 w-24 bg-gray-200 hover:bg-gray-200" />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {/* Status Card */}
        <div className="bg-white p-3 md:p-4 rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-4 w-20 mb-2 bg-gray-200 hover:bg-gray-200" />
              <Skeleton className="h-5 w-16 mt-2 rounded-full bg-gray-200 hover:bg-gray-200" />
            </div>
            <Skeleton className="h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-200" />
          </div>
          <Skeleton className="h-3 w-24 mt-2 bg-gray-200 hover:bg-gray-200" />
        </div>

        {/* Memory Usage Card */}
        <div className="bg-white p-3 md:p-4 rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-4 w-24 mb-2 bg-gray-200 hover:bg-gray-200" />
              <Skeleton className="h-6 w-16 mt-1 bg-gray-200 hover:bg-gray-200" />
            </div>
            <Skeleton className="h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-200" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full mt-2 bg-gray-200 hover:bg-gray-200" />
          <Skeleton className="h-3 w-20 mt-1 bg-gray-200 hover:bg-gray-200" />
        </div>

        {/* Database Cache Card */}
        <div className="bg-white p-3 md:p-4 rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-4 w-24 mb-2 bg-gray-200 hover:bg-gray-200" />
              <Skeleton className="h-6 w-16 mt-1 bg-gray-200 hover:bg-gray-200" />
            </div>
            <Skeleton className="h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-200" />
          </div>
          <Skeleton className="h-3 w-32 mt-1 bg-gray-200 hover:bg-gray-200" />
        </div>

        {/* Sessions Card */}
        <div className="bg-white p-3 md:p-4 rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-4 w-24 mb-2 bg-gray-200 hover:bg-gray-200" />
              <Skeleton className="h-6 w-16 mt-1 bg-gray-200 hover:bg-gray-200" />
            </div>
            <Skeleton className="h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-200" />
          </div>
          <Skeleton className="h-3 w-24 mt-1 bg-gray-200 hover:bg-gray-200" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex -mb-px">
            <Skeleton className="py-2 px-3 md:px-4 h-9 w-20 mr-2 border-b-2 border-gray-300 bg-gray-200 hover:bg-gray-200" />
            <Skeleton className="py-2 px-3 md:px-4 h-9 w-20 mr-2 bg-gray-200 hover:bg-gray-200" />
            <Skeleton className="py-2 px-3 md:px-4 h-9 w-20 mr-2 bg-gray-200 hover:bg-gray-200" />
            <Skeleton className="py-2 px-3 md:px-4 h-9 w-20 mr-2 bg-gray-200 hover:bg-gray-200" />
            <Skeleton className="py-2 px-3 md:px-4 h-9 w-24 mr-2 bg-gray-200 hover:bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Tab Content Skeleton - Overview Tab */}
      <div className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Main metrics */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
            <Skeleton className="h-6 w-40 mb-4 bg-gray-200 hover:bg-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Memory metrics skeleton */}
              <div>
                <Skeleton className="h-5 w-32 mb-3 bg-gray-200 hover:bg-gray-200" />
                <div className="space-y-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-24 bg-gray-200 hover:bg-gray-200" />
                        <Skeleton className="h-4 w-12 bg-gray-200 hover:bg-gray-200" />
                      </div>
                    ))}
                </div>
              </div>

              {/* Database metrics skeleton */}
              <div>
                <Skeleton className="h-5 w-32 mb-3 bg-gray-200 hover:bg-gray-200" />
                <div className="space-y-2">
                  {Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-28 bg-gray-200 hover:bg-gray-200" />
                        <Skeleton className="h-4 w-16 bg-gray-200 hover:bg-gray-200" />
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Recommendations section skeleton */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <Skeleton className="h-5 w-32 mb-3 bg-gray-200 hover:bg-gray-200" />
              <div className="space-y-1">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex">
                      <Skeleton className="h-3 w-3 rounded-full mt-1.5 mr-2 bg-gray-200 hover:bg-gray-200" />
                      <Skeleton className="h-4 w-full bg-gray-200 hover:bg-gray-200" />
                    </div>
                  ))}
              </div>
            </div>

            {/* Button skeleton */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Skeleton className="h-9 w-40 bg-gray-200 hover:bg-gray-200" />
            </div>
          </div>

          {/* Side panel skeleton */}
          <div className="space-y-4 md:space-y-6">
            {/* Top keys skeleton */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <Skeleton className="h-5 w-32 mb-3 bg-gray-200 hover:bg-gray-200" />
              <div className="space-y-2">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24 bg-gray-200 hover:bg-gray-200" />
                      <Skeleton className="h-5 w-16 rounded-full bg-gray-200 hover:bg-gray-200" />
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick actions skeleton */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <Skeleton className="h-5 w-28 mb-3 bg-gray-200 hover:bg-gray-200" />
              <div className="space-y-2">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-10 w-full rounded-md bg-gray-200 hover:bg-gray-200"
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
