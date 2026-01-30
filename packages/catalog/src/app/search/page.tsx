"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/common/LoadingSkeleton";
import type { SearchResultItem } from "@/lib/api/types";
import SearchLoading from "./loading";

type EntityType = "agent" | "skill" | "process" | "domain" | "specialization";

// Small Gear Icon for card corners and section headers
function GearIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
    </svg>
  );
}

// Globe Icon for SearchResultCard
function GlobeIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  );
}

// Steampunk Pipe SVG component for card side decorations - pixel-perfect match to mock
function SteampunkPipe({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side]: 0,
        width: '36px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}
    >
      {/* Pipe body - narrower cylinder */}
      <div
        style={{
          position: 'absolute',
          top: '22px',
          bottom: '22px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '20px',
          background: 'linear-gradient(90deg, #3A2A18 0%, #6A5A48 25%, #8A7A68 50%, #6A5A48 75%, #3A2A18 100%)',
          boxShadow: 'inset 3px 0 6px rgba(0,0,0,0.4), inset -3px 0 6px rgba(255,255,255,0.15)',
          zIndex: 1,
        }}
      />
      {/* Top barrel cap - wider than pipe */}
      <div
        style={{
          width: '36px',
          height: '24px',
          background: 'linear-gradient(180deg, #7A6A58 0%, #5A4A38 50%, #3A2A18 100%)',
          borderRadius: '6px',
          position: 'relative',
          border: '2px solid #2A1A08',
          zIndex: 2,
        }}
      >
        {/* Bolt with screw slot */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #7A6A4A 0%, #4A3A28 60%, #2A1A08 100%)',
            border: '1px solid #1A0A00',
          }}
        >
          {/* Screw slot line */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '2px',
              right: '2px',
              height: '2px',
              background: '#0A0500',
              transform: 'translateY(-50%)',
            }}
          />
        </div>
      </div>
      {/* Bottom barrel cap - wider than pipe */}
      <div
        style={{
          width: '36px',
          height: '24px',
          background: 'linear-gradient(180deg, #7A6A58 0%, #5A4A38 50%, #3A2A18 100%)',
          borderRadius: '6px',
          position: 'relative',
          border: '2px solid #2A1A08',
          zIndex: 2,
        }}
      >
        {/* Bolt with screw slot */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #7A6A4A 0%, #4A3A28 60%, #2A1A08 100%)',
            border: '1px solid #1A0A00',
          }}
        >
          {/* Screw slot line */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '2px',
              right: '2px',
              height: '2px',
              background: '#0A0500',
              transform: 'translateY(-50%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialType = searchParams.get("type") as EntityType | null;

  const [query, setQuery] = React.useState(initialQuery);
  const [inputValue, setInputValue] = React.useState(initialQuery);
  const [activeType, setActiveType] = React.useState<EntityType | "all">(initialType || "all");
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Perform search
  const performSearch = React.useCallback(async (searchQuery: string, type: EntityType | "all") => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: "50",
      });
      if (type !== "all") {
        params.set("type", type);
      }

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search on initial load if query exists
  const initialSearchDoneRef = React.useRef(false);
  React.useEffect(() => {
    if (initialQuery && !initialSearchDoneRef.current) {
      initialSearchDoneRef.current = true;
      performSearch(initialQuery, activeType);
    }
  }, [initialQuery, activeType, performSearch]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setInputValue(newQuery);
    updateUrl(newQuery, activeType);
    performSearch(newQuery, activeType);
  };

  const handleTypeChange = (type: EntityType | "all") => {
    setActiveType(type);
    updateUrl(query, type);
    performSearch(query, type);
  };

  const updateUrl = (q: string, type: EntityType | "all") => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type !== "all") params.set("type", type);

    const search = params.toString();
    const url = search ? `/search?${search}` : "/search";
    router.push(url as Route);
  };

  const clearSearch = () => {
    setQuery("");
    setInputValue("");
    setResults([]);
    setHasSearched(false);
    router.push("/search" as Route);
  };

  const clearFilters = () => {
    setActiveType("all");
    if (query) {
      updateUrl(query, "all");
      performSearch(query, "all");
    }
  };

  // Group results by type
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, SearchResultItem[]> = {};
    results.forEach((result) => {
      const type = result.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(result);
    });
    return groups;
  }, [results]);

  const typeOrder: EntityType[] = ["process", "skill", "agent", "domain", "specialization"];
  const sortedTypes = Object.keys(groupedResults).sort(
    (a, b) => typeOrder.indexOf(a as EntityType) - typeOrder.indexOf(b as EntityType)
  );

  // Active filters for display
  const activeFilters: { key: string; label: string }[] = [];
  if (query) {
    activeFilters.push({ key: "query", label: `boost: '${query}'` });
  }

  return (
    <PageContainer>


      {/* Steampunk Header Banner with Elaborate Pipes, Valves and Gears */}
      <div className="mb-8 relative">
        <div className="relative mx-auto max-w-4xl">
          <svg width="100%" height="160" viewBox="0 0 800 160" preserveAspectRatio="xMidYMid meet">
            <defs>
              {/* Brass plaque gradient */}
              <linearGradient id="plaqueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E8D5B0" />
                <stop offset="20%" stopColor="#D4C4A0" />
                <stop offset="50%" stopColor="#C4B090" />
                <stop offset="80%" stopColor="#B8A080" />
                <stop offset="100%" stopColor="#A89070" />
              </linearGradient>
              {/* Copper pipe gradient - horizontal */}
              <linearGradient id="pipeGradH" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E8A060" />
                <stop offset="30%" stopColor="#CD7F32" />
                <stop offset="70%" stopColor="#A66829" />
                <stop offset="100%" stopColor="#8B5A2B" />
              </linearGradient>
              {/* Copper pipe gradient - vertical */}
              <linearGradient id="pipeGradV" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5A2B" />
                <stop offset="30%" stopColor="#CD7F32" />
                <stop offset="50%" stopColor="#E8A060" />
                <stop offset="70%" stopColor="#CD7F32" />
                <stop offset="100%" stopColor="#8B5A2B" />
              </linearGradient>
              {/* Brass gear gradient */}
              <radialGradient id="gearGrad" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#F0D060" />
                <stop offset="50%" stopColor="#B8860B" />
                <stop offset="100%" stopColor="#6B4E11" />
              </radialGradient>
              {/* Valve gradient */}
              <linearGradient id="valveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#CD7F32" />
                <stop offset="50%" stopColor="#A66829" />
                <stop offset="100%" stopColor="#6B4E11" />
              </linearGradient>
              {/* Gauge gradient */}
              <radialGradient id="gaugeGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF8E7" />
                <stop offset="70%" stopColor="#F5E6C8" />
                <stop offset="100%" stopColor="#E8D5B0" />
              </radialGradient>
              {/* Dark brass gradient for pipes */}
              <linearGradient id="darkBrassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8B5A2B" />
                <stop offset="50%" stopColor="#6B4423" />
                <stop offset="100%" stopColor="#4A3008" />
              </linearGradient>
            </defs>

            {/* Top horizontal pipe spanning width */}
            <rect x="60" y="5" width="680" height="16" fill="url(#pipeGradH)" rx="3" />
            <rect x="60" y="8" width="680" height="4" fill="rgba(255,255,255,0.15)" />
            {/* Pipe bands on top pipe */}
            <rect x="120" y="2" width="20" height="22" fill="#8B5A2B" rx="2" />
            <rect x="300" y="2" width="20" height="22" fill="#8B5A2B" rx="2" />
            <rect x="480" y="2" width="20" height="22" fill="#8B5A2B" rx="2" />
            <rect x="660" y="2" width="20" height="22" fill="#8B5A2B" rx="2" />

            {/* Left elaborate pipe assembly with valve and gauge */}
            <g transform="translate(10, 5)">
              {/* Main vertical pipe */}
              <rect x="15" y="0" width="22" height="145" fill="url(#pipeGradV)" rx="3" />
              {/* Pipe highlight */}
              <rect x="22" y="0" width="6" height="145" fill="rgba(255,255,255,0.15)" />
              {/* Pipe bands */}
              <rect x="11" y="8" width="30" height="10" fill="#8B5A2B" rx="2" />
              <rect x="11" y="125" width="30" height="10" fill="#8B5A2B" rx="2" />

              {/* Horizontal pipe to center */}
              <rect x="35" y="55" width="110" height="18" fill="url(#pipeGradH)" rx="3" />
              <rect x="35" y="60" width="110" height="4" fill="rgba(255,255,255,0.15)" />

              {/* Elbow joint - more detailed */}
              <circle cx="26" cy="64" r="18" fill="url(#pipeGradH)" stroke="#4A3008" strokeWidth="2" />
              <circle cx="26" cy="64" r="12" fill="#8B5A2B" />
              <circle cx="26" cy="64" r="6" fill="#6B4423" />
              {/* Bolt details on elbow */}
              {[0, 90, 180, 270].map((angle, i) => (
                <circle key={i} cx="26" cy="50" r="2" fill="#4A3008" transform={`rotate(${angle} 26 64)`} />
              ))}

              {/* Large Valve wheel on vertical pipe */}
              <g transform="translate(26, 35)">
                <circle cx="0" cy="0" r="20" fill="none" stroke="url(#valveGrad)" strokeWidth="5" />
                <circle cx="0" cy="0" r="8" fill="url(#valveGrad)" stroke="#4A3008" strokeWidth="1" />
                {/* Valve spokes - more detailed */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <line key={i} x1="0" y1="0" x2="0" y2="-17" stroke="#6B4423" strokeWidth="4" strokeLinecap="round" transform={`rotate(${angle})`} />
                ))}
                {/* Center rivet */}
                <circle cx="0" cy="0" r="4" fill="#4A3008" />
                <circle cx="0" cy="0" r="2" fill="#CD7F32" />
              </g>

              {/* Pressure gauge - enhanced */}
              <g transform="translate(80, 30)">
                {/* Gauge mounting bracket */}
                <rect x="-8" y="8" width="16" height="25" fill="#8B5A2B" rx="2" />
                {/* Gauge body */}
                <circle cx="0" cy="0" r="22" fill="#6B4423" stroke="#4A3008" strokeWidth="2" />
                <circle cx="0" cy="0" r="18" fill="url(#gaugeGrad)" stroke="#8B5A2B" strokeWidth="2" />
                <circle cx="0" cy="0" r="14" fill="none" stroke="#A89070" strokeWidth="1" />
                {/* Gauge marks - more */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                  <line key={i} x1="0" y1="-11" x2="0" y2="-15" stroke="#6B4E11" strokeWidth={i % 3 === 0 ? 2 : 1} transform={`rotate(${angle})`} />
                ))}
                {/* Gauge needle */}
                <line x1="0" y1="2" x2="8" y2="-8" stroke="#8B2500" strokeWidth="2" strokeLinecap="round" />
                <circle cx="0" cy="0" r="4" fill="#4A3008" />
                <circle cx="0" cy="0" r="2" fill="#CD7F32" />
              </g>

              {/* Second smaller gauge */}
              <g transform="translate(120, 45)">
                <circle cx="0" cy="0" r="14" fill="#6B4423" stroke="#4A3008" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="11" fill="url(#gaugeGrad)" stroke="#8B5A2B" strokeWidth="1" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <line key={i} x1="0" y1="-7" x2="0" y2="-9" stroke="#6B4E11" strokeWidth="1" transform={`rotate(${angle})`} />
                ))}
                <line x1="0" y1="0" x2="4" y2="-6" stroke="#8B2500" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="0" cy="0" r="2" fill="#4A3008" />
              </g>

              {/* Large gear */}
              <g transform="translate(60, 110)">
                <circle cx="0" cy="0" r="32" fill="url(#gearGrad)" stroke="#4A3508" strokeWidth="2" />
                <circle cx="0" cy="0" r="12" fill="#3D2806" stroke="#4A3508" strokeWidth="1" />
                {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => (
                  <rect key={i} x="-6" y="-38" width="12" height="14" fill="url(#gearGrad)" stroke="#4A3508" strokeWidth="0.5" transform={`rotate(${angle})`} rx="2" />
                ))}
                {/* Inner ring detail */}
                <circle cx="0" cy="0" r="22" fill="none" stroke="#8B5A2B" strokeWidth="2" opacity="0.5" />
              </g>

              {/* Small interlocking gear */}
              <g transform="translate(100, 130)">
                <circle cx="0" cy="0" r="18" fill="url(#gearGrad)" stroke="#4A3508" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="6" fill="#3D2806" />
                {[0, 51, 102, 153, 204, 255, 306].map((angle, i) => (
                  <rect key={i} x="-4" y="-22" width="8" height="8" fill="url(#gearGrad)" transform={`rotate(${angle})`} rx="1" />
                ))}
              </g>
            </g>

            {/* Right elaborate pipe assembly (mirrored) */}
            <g transform="translate(790, 5) scale(-1, 1)">
              {/* Main vertical pipe */}
              <rect x="15" y="0" width="22" height="145" fill="url(#pipeGradV)" rx="3" />
              <rect x="22" y="0" width="6" height="145" fill="rgba(255,255,255,0.15)" />
              {/* Pipe bands */}
              <rect x="11" y="8" width="30" height="10" fill="#8B5A2B" rx="2" />
              <rect x="11" y="125" width="30" height="10" fill="#8B5A2B" rx="2" />

              {/* Horizontal pipe to center */}
              <rect x="35" y="55" width="110" height="18" fill="url(#pipeGradH)" rx="3" />
              <rect x="35" y="60" width="110" height="4" fill="rgba(255,255,255,0.15)" />

              {/* Elbow joint */}
              <circle cx="26" cy="64" r="18" fill="url(#pipeGradH)" stroke="#4A3008" strokeWidth="2" />
              <circle cx="26" cy="64" r="12" fill="#8B5A2B" />
              <circle cx="26" cy="64" r="6" fill="#6B4423" />
              {[0, 90, 180, 270].map((angle, i) => (
                <circle key={i} cx="26" cy="50" r="2" fill="#4A3008" transform={`rotate(${angle} 26 64)`} />
              ))}

              {/* Valve wheel */}
              <g transform="translate(26, 35)">
                <circle cx="0" cy="0" r="20" fill="none" stroke="url(#valveGrad)" strokeWidth="5" />
                <circle cx="0" cy="0" r="8" fill="url(#valveGrad)" stroke="#4A3008" strokeWidth="1" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <line key={i} x1="0" y1="0" x2="0" y2="-17" stroke="#6B4423" strokeWidth="4" strokeLinecap="round" transform={`rotate(${angle})`} />
                ))}
                <circle cx="0" cy="0" r="4" fill="#4A3008" />
                <circle cx="0" cy="0" r="2" fill="#CD7F32" />
              </g>

              {/* Pressure gauge */}
              <g transform="translate(80, 30)">
                <rect x="-8" y="8" width="16" height="25" fill="#8B5A2B" rx="2" />
                <circle cx="0" cy="0" r="22" fill="#6B4423" stroke="#4A3008" strokeWidth="2" />
                <circle cx="0" cy="0" r="18" fill="url(#gaugeGrad)" stroke="#8B5A2B" strokeWidth="2" />
                <circle cx="0" cy="0" r="14" fill="none" stroke="#A89070" strokeWidth="1" />
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                  <line key={i} x1="0" y1="-11" x2="0" y2="-15" stroke="#6B4E11" strokeWidth={i % 3 === 0 ? 2 : 1} transform={`rotate(${angle})`} />
                ))}
                <line x1="0" y1="2" x2="-6" y2="-9" stroke="#8B2500" strokeWidth="2" strokeLinecap="round" />
                <circle cx="0" cy="0" r="4" fill="#4A3008" />
                <circle cx="0" cy="0" r="2" fill="#CD7F32" />
              </g>

              {/* Second smaller gauge */}
              <g transform="translate(120, 45)">
                <circle cx="0" cy="0" r="14" fill="#6B4423" stroke="#4A3008" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="11" fill="url(#gaugeGrad)" stroke="#8B5A2B" strokeWidth="1" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <line key={i} x1="0" y1="-7" x2="0" y2="-9" stroke="#6B4E11" strokeWidth="1" transform={`rotate(${angle})`} />
                ))}
                <line x1="0" y1="0" x2="-3" y2="-6" stroke="#8B2500" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="0" cy="0" r="2" fill="#4A3008" />
              </g>

              {/* Large gear */}
              <g transform="translate(60, 110)">
                <circle cx="0" cy="0" r="32" fill="url(#gearGrad)" stroke="#4A3508" strokeWidth="2" />
                <circle cx="0" cy="0" r="12" fill="#3D2806" stroke="#4A3508" strokeWidth="1" />
                {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => (
                  <rect key={i} x="-6" y="-38" width="12" height="14" fill="url(#gearGrad)" stroke="#4A3508" strokeWidth="0.5" transform={`rotate(${angle})`} rx="2" />
                ))}
                <circle cx="0" cy="0" r="22" fill="none" stroke="#8B5A2B" strokeWidth="2" opacity="0.5" />
              </g>

              {/* Small gear */}
              <g transform="translate(100, 130)">
                <circle cx="0" cy="0" r="18" fill="url(#gearGrad)" stroke="#4A3508" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="6" fill="#3D2806" />
                {[0, 51, 102, 153, 204, 255, 306].map((angle, i) => (
                  <rect key={i} x="-4" y="-22" width="8" height="8" fill="url(#gearGrad)" transform={`rotate(${angle})`} rx="1" />
                ))}
              </g>
            </g>

            {/* Center brass plaque */}
            <g transform="translate(150, 30)">
              {/* Connecting pipes from top */}
              <rect x="20" y="-25" width="14" height="30" fill="url(#pipeGradV)" rx="2" />
              <rect x="466" y="-25" width="14" height="30" fill="url(#pipeGradV)" rx="2" />

              {/* Plaque shadow */}
              <rect x="5" y="5" width="500" height="95" fill="rgba(0,0,0,0.25)" rx="10" />
              {/* Plaque body */}
              <rect x="0" y="0" width="500" height="95" fill="url(#plaqueGrad)" stroke="#6B4E11" strokeWidth="4" rx="10" />
              {/* Inner border */}
              <rect x="10" y="10" width="480" height="75" fill="none" stroke="#A89070" strokeWidth="2" rx="6" />
              {/* Decorative inner line */}
              <rect x="16" y="16" width="468" height="63" fill="none" stroke="#C9B896" strokeWidth="1" rx="4" />

              {/* Corner rivets - enhanced */}
              {[[24, 24], [476, 24], [24, 71], [476, 71]].map(([cx, cy], i) => (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="7" fill="url(#gearGrad)" stroke="#4A3508" strokeWidth="1" />
                  <circle cx={cx} cy={cy} r="3" fill="#6B4E11" />
                  <circle cx={cx - 1} cy={cy - 1} r="1.5" fill="#E8C860" opacity="0.6" />
                </g>
              ))}

              {/* Additional side rivets */}
              {[[24, 47.5], [476, 47.5]].map(([cx, cy], i) => (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="5" fill="url(#gearGrad)" stroke="#4A3508" strokeWidth="0.5" />
                  <circle cx={cx} cy={cy} r="2" fill="#6B4E11" />
                </g>
              ))}

              {/* Title text */}
              <text x="250" y="58" textAnchor="middle" fontSize="34" fontFamily="'Playfair Display', Georgia, serif" fontWeight="700" fill="#3D2314">
                Search Catalog
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Page Title and Subtitle */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#3D2314' }}
        >
          Search Catalog
        </h1>
        <p className="text-sm mt-1" style={{ color: '#5C4033', fontFamily: 'Georgia, serif' }}>
          Search across all processes, skills, agents, and domains.
        </p>
      </div>

      {/* Search Bar with Brass Pipe Frame - v30 PIXEL PERFECT to Mock */}
      {/* Mock: Unified capsule with integrated vertical end bands, all one piece */}
      <div className="mb-4" style={{ overflow: 'visible' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Main pipe frame - unified capsule v34 FINAL - maximum shadow depth */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              height: '50px',
              /* Main capsule - RICHER brown brass tones */
              background: 'linear-gradient(180deg, #8A6840 0%, #7A5830 8%, #6A4820 22%, #5A3A18 45%, #4A3012 70%, #3A2508 100%)',
              borderRadius: '25px',
              border: '2.5px solid #2A1808',
              boxShadow: '0 5px 12px rgba(0,0,0,0.65), inset 0 3px 6px rgba(140,100,50,0.3), inset 0 -5px 10px rgba(0,0,0,0.55)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Left end band - BRIGHTER golden vertical cylinder */}
            <div
              style={{
                width: '32px',
                height: '100%',
                background: 'linear-gradient(90deg, #4A3008 0%, #6A4512 6%, #8A6525 16%, #B08540 30%, #D4A855 44%, #E8C068 50%, #D4A855 56%, #B08540 70%, #8A6525 84%, #6A4512 94%, #4A3008 100%)',
                borderRadius: '25px 5px 5px 25px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '14px',
                borderRight: '1.5px solid #2A1808',
                boxShadow: 'inset 0 2px 5px rgba(230,190,110,0.35), inset 0 -2px 5px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #3A2A10 0%, #1A0A00 55%, #000 100%)',
                border: '1px solid #000',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
              }} />
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #3A2A10 0%, #1A0A00 55%, #000 100%)',
                border: '1px solid #000',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
              }} />
            </div>

            {/* Inner cream/white search input area */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(180deg, #FDFBF5 0%, #F7F3EA 35%, #EDE7D8 100%)',
                borderRadius: '3px',
                padding: '0 14px',
                margin: '0 3px',
                border: '2px solid #5A4520',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                height: '34px',
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="#5A4A35" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(inputValue);
                  }
                }}
                placeholder="Search..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ fontFamily: 'Georgia, serif', color: '#2A2015' }}
              />
              <button onClick={clearSearch} className="p-0.5 hover:opacity-70 rounded flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="#5A4A3A" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Right end band - BRIGHTER golden vertical cylinder */}
            <div
              style={{
                width: '32px',
                height: '100%',
                background: 'linear-gradient(90deg, #4A3008 0%, #6A4512 6%, #8A6525 16%, #B08540 30%, #D4A855 44%, #E8C068 50%, #D4A855 56%, #B08540 70%, #8A6525 84%, #6A4512 94%, #4A3008 100%)',
                borderRadius: '5px 25px 25px 5px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '14px',
                borderLeft: '1.5px solid #2A1808',
                boxShadow: 'inset 0 2px 5px rgba(230,190,110,0.35), inset 0 -2px 5px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #3A2A10 0%, #1A0A00 55%, #000 100%)',
                border: '1px solid #000',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
              }} />
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #3A2A10 0%, #1A0A00 55%, #000 100%)',
                border: '1px solid #000',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
              }} />
            </div>
          </div>

          {/* "All Types" dropdown - aged brass with checkmark */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={activeType}
              onChange={(e) => handleTypeChange(e.target.value as EntityType | "all")}
              className="cursor-pointer appearance-none"
              style={{
                background: 'linear-gradient(180deg, #C09858 0%, #A88045 12%, #906830 35%, #7A5525 60%, #654520 100%)',
                border: '2.5px solid #3D2815',
                borderRadius: '6px',
                padding: '12px 42px 12px 14px',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                color: '#1A1408',
                fontSize: '14px',
                fontWeight: 600,
                textShadow: '0 1px 0 rgba(255,255,255,0.1)',
                boxShadow: '0 3px 6px rgba(0,0,0,0.5), inset 0 2px 3px rgba(170,130,80,0.25), inset 0 -2px 4px rgba(0,0,0,0.3)',
                height: '48px',
                minWidth: '118px',
              }}
            >
              <option value="all">All Types</option>
              <option value="process">Processes</option>
              <option value="skill">Skills</option>
              <option value="agent">Agents</option>
              <option value="domain">Domains</option>
              <option value="specialization">Specializations</option>
            </select>
            <div
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#1A1408',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters - Simple text with removable filter chips */}
      {activeFilters.length > 0 && (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <span
            className="text-sm"
            style={{
              color: '#5C4033',
              fontFamily: 'Georgia, serif',
            }}
          >
            Active Filters:
          </span>
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs"
              style={{
                background: '#E8E0C8',
                border: '1px solid #C9A655',
                color: '#5C4033',
                fontFamily: 'Georgia, serif',
                borderRadius: '4px',
              }}
            >
              {filter.label}
              <button onClick={clearSearch} className="ml-1 opacity-70 hover:opacity-100">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-sm hover:underline"
            style={{ color: '#C9A655', fontFamily: 'Georgia, serif' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Buttons - Brass Styled with Screw Decorations */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { type: "all" as const, label: "All", icon: null },
          { type: "process" as const, label: "Processes", icon: <ProcessIcon className="w-4 h-4" /> },
          { type: "skill" as const, label: "Skills", icon: <SkillIcon className="w-4 h-4" /> },
          { type: "agent" as const, label: "Agents", icon: <AgentIcon className="w-4 h-4" /> },
          { type: "domain" as const, label: "Domains", icon: <DomainIcon className="w-4 h-4" /> },
          { type: "specialization" as const, label: "Specializations", icon: <SpecializationIcon className="w-4 h-4" /> },
        ].map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className="relative inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium transition-all"
            style={activeType === type ? {
              background: 'linear-gradient(180deg, #D4B896 0%, #C9A655 30%, #8B6914 100%)',
              color: '#FEFCF5',
              border: '2px solid #5C4A1F',
              borderRadius: '6px',
              boxShadow: '0 3px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
              fontFamily: 'Georgia, serif',
              textShadow: '0 1px 1px rgba(0,0,0,0.4)',
            } : {
              background: 'linear-gradient(180deg, #A08550 0%, #8B7040 50%, #6B5530 100%)',
              color: '#FEFCF5',
              border: '2px solid #5C4A1F',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
              fontFamily: 'Georgia, serif',
              textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            }}
          >
            {/* Top-left screw */}
            <span
              style={{
                position: 'absolute',
                top: '3px',
                left: '3px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #8B7A5C 0%, #4A3A2A 100%)',
                border: '1px solid #3D3226',
              }}
            />
            {/* Top-right screw */}
            <span
              style={{
                position: 'absolute',
                top: '3px',
                right: '3px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #8B7A5C 0%, #4A3A2A 100%)',
                border: '1px solid #3D3226',
              }}
            />
            {/* Bottom-left screw */}
            <span
              style={{
                position: 'absolute',
                bottom: '3px',
                left: '3px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #8B7A5C 0%, #4A3A2A 100%)',
                border: '1px solid #3D3226',
              }}
            />
            {/* Bottom-right screw */}
            <span
              style={{
                position: 'absolute',
                bottom: '3px',
                right: '3px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #8B7A5C 0%, #4A3A2A 100%)',
                border: '1px solid #3D3226',
              }}
            />
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
        </div>
      ) : hasSearched ? (
        results.length > 0 ? (
          <div className="space-y-10">
            {/* Grouped results */}
            {activeType === "all" ? (
              sortedTypes.map((type) => {
                const typeResults = groupedResults[type];
                if (!typeResults) return null;
                return (
                  <div key={type}>
                    {/* Section header - enhanced */}
                    <div className="mb-5 flex items-center gap-2.5 pb-2" style={{ borderBottom: '2px solid rgba(184, 134, 11, 0.25)' }}>
                      <GearIcon size={18} className="text-[#B8860B]" />
                      <h2
                        className="text-lg font-semibold tracking-wide"
                        style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#3D2314' }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </h2>
                      <span className="text-sm font-normal" style={{ color: '#8B7355', fontFamily: 'Georgia, serif' }}>
                        ({typeResults.length})
                      </span>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {typeResults.map((result) => (
                        <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((result) => (
                  <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card
            className="relative"
            style={{
              background: 'linear-gradient(135deg, #F8F0E0 0%, #F2E8D5 100%)',
              border: '2px solid #8B7355',
            }}
          >
            <CardContent className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="#B8860B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-semibold" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#3D2314' }}>
                No results found
              </h3>
              <p className="mt-2 text-sm" style={{ color: '#5C4033', fontFamily: 'Georgia, serif' }}>
                Try different keywords or adjust your filters
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card
          className="relative"
          style={{
            background: 'linear-gradient(135deg, #F8F0E0 0%, #F2E8D5 100%)',
            border: '2px solid #8B7355',
          }}
        >
          <CardContent className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="#B8860B" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#3D2314' }}>
              Start searching
            </h3>
            <p className="mt-2 text-sm" style={{ color: '#5C4033', fontFamily: 'Georgia, serif' }}>
              Enter a search term to find processes, skills, agents, and more
            </p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </React.Suspense>
  );
}

function SearchResultCard({ result }: { result: SearchResultItem }) {
  const getHref = (): string => {
    switch (result.type) {
      case "agent":
        return `/agents/${encodeURIComponent(result.name)}`;
      case "skill":
        return `/skills/${encodeURIComponent(result.name)}`;
      case "process":
        return `/processes/${result.id}`;
      case "domain":
        return `/domains/${encodeURIComponent(result.name)}`;
      case "specialization":
        return `/specializations/${encodeURIComponent(result.name)}`;
      default:
        return "#";
    }
  };

  return (
    <Link href={getHref() as Route}>
      {/* Outer wrapper - darker brass frame with shadow */}
      <div
        className="h-full group relative transition-all hover:shadow-lg hover:-translate-y-0.5"
        style={{
          position: 'relative',
          borderRadius: '14px',
          background: 'linear-gradient(180deg, #6B5A3A 0%, #4A3A2A 100%)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          overflow: 'visible',
          padding: '4px',
        }}
      >
        {/* Left Steampunk Pipe */}
        <SteampunkPipe side="left" />

        {/* Right Steampunk Pipe */}
        <SteampunkPipe side="right" />

        {/* Card content area with inner brass border */}
        <div
          style={{
            position: 'relative',
            marginLeft: '34px',
            marginRight: '34px',
            borderRadius: '8px',
            border: '2px solid #C9A86C',
            background: 'linear-gradient(180deg, #F5E6D3 0%, #E8D4BE 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Card body */}
          <div className="p-3">
            {/* Title row with globe icon on the right */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="truncate flex-1"
                style={{
                  fontFamily: '"Courier New", Courier, monospace',
                  color: '#4A3A2A',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '1.3',
                }}
              >
                {result.name}
              </span>
              <GlobeIcon size={18} className="flex-shrink-0" style={{ color: '#8B7A5C' }} />
            </div>

            {/* Badge - olive/khaki green */}
            <div
              className="inline-block capitalize mb-2"
              style={{
                background: '#6B7B5A',
                color: '#FFFFFF',
                borderRadius: '3px',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                padding: '2px 8px',
                lineHeight: '1.4',
              }}
            >
              {result.type}
            </div>

            {/* Description */}
            <p
              className="line-clamp-2"
              style={{
                fontFamily: 'Georgia, serif',
                color: '#5C4A36',
                lineHeight: '1.5',
                fontSize: '13px',
                fontWeight: 400,
                margin: 0,
              }}
            >
              {result.description || "No description available"}
            </p>

            {/* Highlights if present */}
            {result.highlights?.content && (
              <div
                className="mt-2 leading-relaxed"
                style={{
                  color: '#5C4A36',
                  fontFamily: 'Georgia, serif',
                  fontSize: '12px',
                }}
              >
                <span
                  dangerouslySetInnerHTML={{
                    __html: result.highlights.content.replace(
                      /<mark>/g,
                      '<mark style="background-color: rgba(201, 169, 97, 0.4); color: #4A3A2A; padding: 1px 3px; border-radius: 2px;">'
                    ),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProcessIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function SkillIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function AgentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function DomainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function SpecializationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}
