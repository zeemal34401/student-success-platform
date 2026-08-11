import Card from '../ui/Card'
import PageLayout from '../ui/PageLayout'
import { Skeleton } from '../ui/Skeleton'

function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  )
}

function StatCardsSkeleton({ count = 4 }) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${count === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <PageLayout>
      <HeaderSkeleton />
      <div className="mt-6">
        <StatCardsSkeleton />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
          <Skeleton className="mt-6 h-72 w-full rounded-lg" />
        </Card>
        <Card className="lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-52" />
          <div className="mt-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageLayout>
  )
}

export function RiskAlertsSkeleton() {
  return (
    <PageLayout>
      <HeaderSkeleton />
      <Card className="mt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Skeleton className="h-10 max-w-md flex-1 rounded-md" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-badge" />
            ))}
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </Card>
    </PageLayout>
  )
}

export function FacultyOverviewSkeleton() {
  return (
    <PageLayout>
      <HeaderSkeleton />
      <div className="mt-6">
        <StatCardsSkeleton count={3} />
      </div>
      <Card className="mt-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </Card>
    </PageLayout>
  )
}

export function ReportsSkeleton() {
  return (
    <PageLayout>
      <HeaderSkeleton />
      <div className="mt-6">
        <StatCardsSkeleton />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-4 w-56" />
          <Skeleton className="mt-6 h-64 w-full rounded-lg" />
        </Card>
        <Card>
          <Skeleton className="h-5 w-52" />
          <Skeleton className="mt-2 h-4 w-40" />
          <Skeleton className="mt-6 mx-auto h-64 w-64 rounded-full" />
        </Card>
      </div>
      <Card className="mt-6">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-2 h-4 w-72" />
        <Skeleton className="mt-6 h-80 w-full rounded-lg" />
      </Card>
    </PageLayout>
  )
}
