"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatsOverviewProps {
  totalEntities: number;
  totalFilesIndexed: number;
  lastIndexTime: string | null;
  databaseSize: number;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleString();
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-sm text-[var(--scifi-cyan)]"
        style={{
          background: 'rgba(0, 223, 223, 0.08)',
          border: '1px solid rgba(0, 223, 223, 0.15)',
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-sm font-medium leading-none text-white"
          style={{
            fontFamily: 'var(--font-header, var(--font-scifi-header))',
          }}
        >
          {value}
        </p>
        <p className="mt-1 text-xs text-[rgba(255,255,255,0.4)]">{label}</p>
      </div>
    </div>
  );
}

export function StatsOverview({
  totalEntities,
  totalFilesIndexed,
  lastIndexTime,
  databaseSize,
  className,
}: StatsOverviewProps) {
  return (
    <div
      className={cn(
        "grid gap-6 rounded-sm p-6 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
      style={{
        background: 'var(--scifi-card)',
        border: '1px solid rgba(255, 0, 224, 0.15)',
        boxShadow: '0 0 12px rgba(0, 0, 0, 0.3), 0 0 4px rgba(255, 0, 224, 0.05)',
      }}
    >
      <StatItem
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        }
        label="Total Entities"
        value={totalEntities.toLocaleString()}
      />
      <StatItem
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        label="Files Indexed"
        value={totalFilesIndexed.toLocaleString()}
      />
      <StatItem
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        label="Last Indexed"
        value={formatDate(lastIndexTime)}
      />
      <StatItem
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        }
        label="Database Size"
        value={formatBytes(databaseSize)}
      />
    </div>
  );
}

export default StatsOverview;
