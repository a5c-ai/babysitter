import Link from "next/link";
import type { Route } from "next";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsResponse } from "@/lib/api/types";
import {
  MetricCard,
  BarChart,
  PieChart,
  TreemapChart,
  RecentActivity,
  QuickLinks,
  StatsOverview,
  type BarChartData,
  type PieChartData,
  type TreemapData,
  type QuickLinkItem,
} from "@/components/dashboard";

async function getAnalytics(): Promise<AnalyticsResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/analytics`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const analytics = await getAnalytics();

  // Prepare data for charts
  const barChartData: BarChartData[] = analytics?.distributions.byCategory?.map((item) => ({
    name: item.name,
    value: item.count,
    href: `/processes?category=${encodeURIComponent(item.name)}`,
  })) || [];

  const pieChartData: PieChartData[] = analytics?.distributions.byType?.map((item) => ({
    name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
    value: item.count,
  })) || [];

  const treemapData: TreemapData[] = analytics?.distributions.byDomain?.map((item) => ({
    name: item.name,
    size: item.count,
  })) || [];

  // Prepare quick links with counts
  const quickLinks: QuickLinkItem[] = [
    {
      title: "Browse Processes",
      description: "View all process definitions with filtering and search",
      href: "/processes",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      count: analytics?.counts.processes,
    },
    {
      title: "Explore Domains",
      description: "Browse the hierarchical domain structure",
      href: "/domains",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      count: analytics?.counts.domains,
    },
    {
      title: "Skills Catalog",
      description: "Find reusable skills organized by category",
      href: "/skills",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      count: analytics?.counts.skills,
    },
    {
      title: "Agents Directory",
      description: "Discover specialized agents by expertise",
      href: "/agents",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      count: analytics?.counts.agents,
    },
  ];

  return (
    <div className="container py-10">
      {/* Hero Section */}
      <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-16 lg:pb-12">
        <Badge variant="secondary" className="mb-4">
          Babysitter Framework
        </Badge>
        <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
          Process Library Catalog
        </h1>
        <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
          Browse and explore process definitions, agents, and skills for
          building intelligent automation workflows.
        </p>
        <div className="flex w-full items-center justify-center space-x-4 py-4 md:pb-10">
          <Link
            href={"/processes" as Route}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Browse Catalog
          </Link>
          <Link
            href={"/search" as Route}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Search
          </Link>
        </div>
      </section>

      {/* Stats Overview */}
      {analytics && (
        <section className="mb-8">
          <StatsOverview
            totalEntities={analytics.counts.total}
            totalFilesIndexed={
              analytics.counts.processes +
              analytics.counts.agents +
              analytics.counts.skills
            }
            lastIndexTime={analytics.lastIndexedAt}
            databaseSize={analytics.databaseSize}
          />
        </section>
      )}

      {/* Metrics Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Processes"
          value={analytics?.counts.processes ?? "--"}
          subtitle="Process definitions"
          href="/processes"
          icon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <MetricCard
          title="Domains"
          value={analytics?.counts.domains ?? "--"}
          subtitle="Knowledge domains"
          href="/domains"
          icon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <MetricCard
          title="Specializations"
          value={analytics?.counts.specializations ?? "--"}
          subtitle="Domain specializations"
          href="/specializations"
          icon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          }
        />
        <MetricCard
          title="Skills"
          value={analytics?.counts.skills ?? "--"}
          subtitle="Reusable skill modules"
          href="/skills"
          icon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <MetricCard
          title="Agents"
          value={analytics?.counts.agents ?? "--"}
          subtitle="Specialized agents"
          href="/agents"
          icon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
      </section>

      {/* Quick Links Section */}
      <section className="mt-12">
        <div className="mb-6 flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Quick Links</h2>
          <p className="text-muted-foreground">
            Navigate to key sections of the catalog.
          </p>
        </div>
        <QuickLinks links={quickLinks} columns={4} />
      </section>

      {/* Distribution Charts */}
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* Pie Chart - By Type Distribution */}
        <PieChart
          title="Distribution by Type"
          description="Breakdown of entity types in the catalog"
          data={pieChartData}
          height={300}
          innerRadius={60}
          outerRadius={100}
        />

        {/* Bar Chart - By Methodology/Category */}
        <BarChart
          title="Processes by Category"
          description="Process definitions organized by methodology"
          data={barChartData}
          height={300}
        />
      </section>

      {/* Treemap - By Domain */}
      <section className="mt-6">
        <TreemapChart
          title="Agents by Domain"
          description="Distribution of agents across knowledge domains"
          data={treemapData}
          height={300}
        />
      </section>

      {/* Recent Activity Section */}
      <section className="mt-12">
        <div className="mb-6 flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
          <p className="text-muted-foreground">
            Latest additions and modifications to the catalog.
          </p>
        </div>
        <RecentActivity
          items={analytics?.recentActivity || []}
          maxItems={10}
          showHeader={false}
        />
      </section>
    </div>
  );
}
