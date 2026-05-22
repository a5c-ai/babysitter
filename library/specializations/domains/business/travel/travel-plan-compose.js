/**
 * @process specializations/domains/business/travel/travel-plan-compose
 * @description Turn a traveler's profile + constraints into sophisticated
 *   multi-city itineraries -- including stopover-as-vacation legs and
 *   cheaper-than-direct two-destination trips -- by composing SQL queries
 *   against the SQLite travel database produced by
 *   `flight-dataset-build.js`. Every database interaction is performed by
 *   Python 3 scripts that import the stdlib `sqlite3` module. No MCP is
 *   used. No sqlite3 CLI shell-outs -- Python only. All tasks in this
 *   process are kind:'agent'.
 *
 * @inputs {
 *   dbPath: string,                            // absolute path to the SQLite DB from flight-dataset-build
 *   schemaDocPath: string,                     // absolute path to SCHEMA.md (also produced by flight-dataset-build)
 *   workDir: string,                           // absolute path where query scripts + plan outputs land
 *   traveler: {
 *     origin: string|string[],                 // IATA code(s); e.g. "TLV"
 *     window: { start: string, end: string },  // ISO dates
 *     partySize?: number,
 *     budgetPerPerson?: { currency: string, max: number },
 *     luggage?: 'carry-on-only'|'checked',
 *     weatherPreference?: 'warm'|'mild'|'same-as-origin'|'any',
 *     interests?: string[],                    // e.g. ["beach","food","walking-city"]
 *     acceptsMultipleBookings?: boolean,       // default true; required for stopover itineraries
 *     mustInclude?: string[],                  // airports/cities the plan must touch
 *     excludeCarriers?: string[],
 *     excludeAircraft?: string[]
 *   }
 * }
 *
 * @outputs {
 *   success: boolean,
 *   itineraries: Array<{
 *     kind: 'direct'|'one-stop-vacation',
 *     summary: string,
 *     legs: Array<{airline,aircraft,depart,arrive,origin,destination,priceEstimate}>,
 *     totalPriceEstimate: number,
 *     stopoverDays?: number,
 *     stopoverCity?: string,
 *     tradeoffs: string[]
 *   }>,
 *   planMarkdownPath: string,
 *   artifacts: Array<{ path: string; format?: string; label?: string }>
 * }
 *
 * Inspired by Michael Lugassy's curated-dataset + direct-SQL-tool travel
 * agent pattern:
 *   - https://github.com/mluggy
 *   - https://www.linkedin.com/posts/mluggy_%D7%9B%D7%9E%D7%95-%D7%9E%D7%99%D7%9C%D7%99%D7%95%D7%A0%D7%99-%D7%99%D7%A9%D7%A8%D7%90%D7%9C%D7%99%D7%9D-%D7%92%D7%9D-%D7%90%D7%A0%D7%97%D7%A0%D7%95-%D7%9E%D7%AA%D7%9B%D7%A0%D7%A0%D7%99%D7%9D-%D7%97%D7%95%D7%A4%D7%A9%D7%95%D7%AA-ugcPost-7448843353275858944-b7d4
  * @graph
 *   domains: [domain:travel]
 *   skillAreas: [skill-area:travel-itinerary-planning, skill-area:product-discovery]
 *   workflows: [workflow:customer-journey-optimization]
 *   roles: [role:product-manager, role:operations-analyst]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { dbPath, schemaDocPath, workDir, traveler } = inputs;

  const startedAt = ctx.now();
  const artifacts = [];
  ctx.log('info', `Composing travel plan for ${JSON.stringify(traveler.origin)} in window ${traveler.window.start}..${traveler.window.end}`);

  // Phase 1 -- Profile resolution: collapse loose traveler inputs into
  // concrete SQL-filterable constraints (IATA lists, date ranges, price
  // ceilings per leg, weather groups, airline/aircraft excludes).
  const profile = await ctx.task(travelerProfilingTask, {
    traveler, dbPath, schemaDocPath, workDir,
  });
  artifacts.push(...(profile.artifacts || []));

  // Phase 2 -- Direct options: author + run a Python query script that
  // lists direct flights origin->candidate-destinations ranked by price,
  // timing and aircraft quality. This is the baseline the stopover
  // itineraries must beat.
  const directs = await ctx.task(directFlightQueryTask, {
    constraints: profile.constraints, dbPath, schemaDocPath, workDir,
  });
  artifacts.push(...(directs.artifacts || []));

  // Phase 3 -- Stopover discovery: query the one_stop_itineraries view
  // (from flight-dataset-build) to surface 2-3 day stopover candidates on
  // the outbound, the return, or both. Think of the connection as the
  // vacation, not the obstacle.
  const stopovers = await ctx.task(stopoverDiscoveryTask, {
    constraints: profile.constraints, directsBaseline: directs.options, dbPath, schemaDocPath, workDir,
  });
  artifacts.push(...(stopovers.artifacts || []));

  // Phase 4 -- Cost composition: two separate bookings in one trip means
  // the cost of leg1 + leg2 must be compared against the direct baseline,
  // including airport-transfer and self-handoff risk buffer.
  const costs = await ctx.task(costCompositionTask, {
    directs: directs.options, stopovers: stopovers.candidates, constraints: profile.constraints,
    dbPath, schemaDocPath, workDir,
  });
  artifacts.push(...(costs.artifacts || []));

  // Phase 5 -- Airline + aircraft comparison: for the shortlisted options,
  // query per-carrier morning-vs-afternoon schedules and aircraft type
  // (NEO vs older Boeing, wide vs narrow body) so the narrative can
  // explain why one option beats another in plain language.
  const comparison = await ctx.task(carrierAircraftComparisonTask, {
    shortlist: costs.shortlist, dbPath, schemaDocPath, workDir,
  });
  artifacts.push(...(comparison.artifacts || []));

  // Phase 6 -- Tradeoff narration: the LLM-as-query-composer is also the
  // LLM-as-domain-UX. This phase explains the tradeoffs (carry-on only,
  // two bookings, weather match, morning vs afternoon) in natural language.
  const narrative = await ctx.task(tradeoffNarrationTask, {
    shortlist: costs.shortlist, comparison, constraints: profile.constraints, workDir,
  });
  artifacts.push(...(narrative.artifacts || []));

  // Phase 7 -- Plan synthesis: rank final itineraries (direct + stopover
  // mixed), each backed by the exact SQL that produced it so the result
  // is auditable.
  const plan = await ctx.task(planSynthesisTask, {
    directs: directs.options, stopovers: stopovers.candidates, costs, comparison,
    narrative, constraints: profile.constraints, workDir,
  });
  artifacts.push(...(plan.artifacts || []));

  // Phase 8 -- Export: write a human-readable plan.md with the ranked
  // itineraries, the SQL that produced each, and the traveler-facing
  // tradeoff explanation.
  const exportResult = await ctx.task(planExportTask, {
    itineraries: plan.itineraries, narrative, traveler, dbPath, workDir,
  });
  artifacts.push(...(exportResult.artifacts || []));

  return {
    success: true,
    itineraries: plan.itineraries,
    planMarkdownPath: exportResult.planMarkdownPath,
    artifacts,
    duration: ctx.now() - startedAt,
    metadata: {
      processId: 'specializations/domains/business/travel/travel-plan-compose',
      timestamp: startedAt,
      origin: traveler.origin,
      window: traveler.window,
    },
  };
}

// ============================================================================
// TASK DEFINITIONS -- all kind:'agent'. Agents author and execute Python
// scripts that use stdlib `sqlite3` to query the DB. No MCP, no sqlite3
// CLI, no ORM.
// ============================================================================

export const travelerProfilingTask = defineTask('traveler-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Resolve traveler profile into SQL-filterable constraints',
  agent: {
    name: 'traveler-profiler',
    prompt: {
      role: 'Traveler Profiler',
      task: 'Convert the loose traveler object into a concrete set of constraints the SQL authors can use.',
      context: args,
      instructions: [
        'Read schemaDocPath so you know the actual table/column names -- never guess.',
        'Normalize origin to an IATA code list. Resolve city names to airports via the airports table (compose a short Python stdlib sqlite3 query if needed -- read-only).',
        'Turn weatherPreference into a same_weather_group filter (look up the origin airport in climate_tags and derive the allowed koppen_class set).',
        'Turn window into explicit month_bucket values matching scheduled_flights.month_bucket.',
        'Turn budgetPerPerson + partySize into a per-leg max-price ceiling for later phases.',
        'Collapse excludeCarriers + excludeAircraft into SQL NOT IN lists.',
        'Default acceptsMultipleBookings to true -- stopover itineraries require it; if false, emit a warning and skip the stopover phases later.',
        'Return a constraints object: { originAirports, destinationRegions, monthBuckets, maxPricePerLegILS, weatherGroups, excludeCarriers, excludeAircraft, mustInclude, acceptsMultipleBookings, luggage }.',
      ],
      outputFormat: 'JSON: { constraints, warnings, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['constraints', 'artifacts'],
      properties: {
        constraints: { type: 'object' },
        warnings: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'planning', 'profile'],
}));

export const directFlightQueryTask = defineTask('direct-flight-query', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Query direct flights matching traveler constraints',
  agent: {
    name: 'sql-query-composer',
    prompt: {
      role: 'SQL Query Composer',
      task: 'Author and run a Python script that lists direct flight options from origin to candidate destinations.',
      context: args,
      instructions: [
        'Under workDir, write q_directs.py using ONLY the Python stdlib (`sqlite3`, `json`, `argparse`, `pathlib`, `time`).',
        'The script must: open dbPath read-only (sqlite3.connect(f"file:{dbPath}?mode=ro", uri=True)), set row_factory=sqlite3.Row, and run a SELECT against the direct_routes_from_origin view filtered by origin IN (?, ...), month bucket IN (?, ...), carrier NOT IN excludeCarriers, aircraft NOT IN excludeAircraft.',
        'Join to airlines, aircraft_types, airports to produce a flat result with human names.',
        'Rank by (estimated) price ascending, then by departure_local morning-first.',
        'Write results as JSON to workDir/directs.json and also print row count to stdout.',
        'Execute the script against dbPath via your harness python tool; do NOT use sqlite3 CLI.',
        'Return the parsed options array (cap 30) plus the SQL string verbatim for audit.',
      ],
      outputFormat: 'JSON: { options: [{ destination, airline, aircraft, depart, arrive, priceEstimate, sqlAudit }], scriptPath, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['options', 'artifacts'],
      properties: {
        options: { type: 'array' },
        scriptPath: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'planning', 'sql'],
}));

export const stopoverDiscoveryTask = defineTask('stopover-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover stopover-as-vacation itineraries',
  agent: {
    name: 'stopover-strategist',
    prompt: {
      role: 'Stopover Strategist',
      task: 'Find viable 2-3 day stopover itineraries that double as a second vacation destination.',
      context: args,
      instructions: [
        'Under workDir, write q_stopovers.py using only Python stdlib + sqlite3.',
        'Query the one_stop_itineraries view. A viable stopover must: (a) have the same weather group as the final destination OR match the traveler weather preference, (b) allow a 2-3 day gap between leg1.arrive and leg2.depart, (c) be a walking-city or match one of traveler.interests, (d) honour constraints.mustInclude if set.',
        'Express all of those as SQL predicates against the joined tables -- DO NOT filter in Python after the fact. Evidence should be the SQL, not post-processing.',
        'Generate variants: stopover-on-outbound, stopover-on-return, stopover-on-both (two different cities).',
        'Rank by (leg1.price + leg2.price) ascending vs the cheapest direct to the same final destination -- surface any stopover combination that is cheaper than direct.',
        'Cap at 25 candidates, write to workDir/stopovers.json.',
        'Execute the script via your harness python tool. Return candidates[] with { variant, stopoverCity, stopoverDays, finalDestination, leg1, leg2, combinedPrice, directBaselinePrice, delta, sqlAudit }.',
      ],
      outputFormat: 'JSON: { candidates, scriptPath, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['candidates', 'artifacts'],
      properties: {
        candidates: { type: 'array' },
        scriptPath: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'planning', 'stopover'],
}));

export const costCompositionTask = defineTask('cost-composition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compose total-trip cost comparison (direct vs stopover)',
  agent: {
    name: 'sql-query-composer',
    prompt: {
      role: 'SQL Query Composer (cost lens)',
      task: 'Produce a per-candidate total cost including per-leg fares, airport transfers and self-handoff risk buffer.',
      context: args,
      instructions: [
        'Under workDir, write q_costs.py using Python stdlib + sqlite3.',
        'For each stopover candidate compute: totalFare = leg1.priceEstimate + leg2.priceEstimate. If luggage === "carry-on-only", transferCost = 0; otherwise apply a flat 30 currency units handoff-risk premium.',
        'Compare against the cheapest direct to the same final destination. savingsVsDirect = directBaseline - (totalFare + transferCost).',
        'Shortlist: top 8 stopover candidates by savingsVsDirect > 0, plus the top 5 direct options. Must NOT exceed budgetPerPerson.max when set.',
        'Return shortlist[] with explicit kind ("direct"|"one-stop-vacation"), totalPriceEstimate, savingsVsDirect, and sqlAudit.',
        'Execute the script and persist shortlist.json under workDir.',
      ],
      outputFormat: 'JSON: { shortlist, savingsTable, scriptPath, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['shortlist', 'artifacts'],
      properties: {
        shortlist: { type: 'array' },
        savingsTable: { type: 'array' },
        scriptPath: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'planning', 'cost'],
}));

export const carrierAircraftComparisonTask = defineTask('carrier-aircraft-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare carriers and aircraft for the shortlisted itineraries',
  agent: {
    name: 'sql-query-composer',
    prompt: {
      role: 'SQL Query Composer (carrier/aircraft lens)',
      task: 'For every shortlisted option, produce a per-route carrier-vs-carrier comparison and aircraft-type comparison.',
      context: args,
      instructions: [
        'Under workDir, write q_carriers.py (Python stdlib + sqlite3 only).',
        'For each distinct route in the shortlist, SELECT from carrier_schedule_matrix the morning/afternoon/evening departure options per airline serving that route.',
        'Join aircraft_types to expose seat_layout, engine_generation (e.g. NEO vs CEO), age_bucket.',
        'Produce: schedulePerCarrier[routeId] = { morning:[...], afternoon:[...], evening:[...] } and aircraftPerCarrier[routeId] = [ { airline, aircraft, seats, engineGen, ageBucket } ].',
        'Flag meaningful differences (>1h earlier, newer aircraft, higher seat pitch if column present).',
        'Execute the script, return structured comparison keyed by routeId, plus sqlAudit per route.',
      ],
      outputFormat: 'JSON: { comparison: { [routeId]: { schedulePerCarrier, aircraftPerCarrier, highlights } }, scriptPath, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['comparison', 'artifacts'],
      properties: {
        comparison: { type: 'object' },
        scriptPath: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'planning', 'comparison'],
}));

export const tradeoffNarrationTask = defineTask('tradeoff-narration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Narrate tradeoffs in plain language',
  agent: {
    name: 'itinerary-narrator',
    prompt: {
      role: 'Itinerary Narrator',
      task: 'Produce a plain-language tradeoff summary per shortlisted itinerary.',
      context: args,
      instructions: [
        'Do not touch the database in this phase -- work from the structured shortlist and comparison objects only.',
        'For every shortlisted itinerary, produce 3-6 tradeoff bullets: morning vs afternoon departure, newer vs older aircraft, carry-on only vs checked luggage risk, two separate bookings and self-handoff, weather match at stopover, walking-city fit.',
        'Be concrete and specific -- quote the airline name, the aircraft type, the saving figure.',
        'Return tradeoffs keyed by itinerary id.',
      ],
      outputFormat: 'JSON: { tradeoffs: { [itineraryId]: string[] }, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['tradeoffs', 'artifacts'],
      properties: {
        tradeoffs: { type: 'object' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'planning', 'narrative'],
}));

export const planSynthesisTask = defineTask('plan-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Rank final itineraries with SQL evidence',
  agent: {
    name: 'itinerary-narrator',
    prompt: {
      role: 'Itinerary Narrator (ranker)',
      task: 'Combine shortlist + comparison + narrative into a ranked itinerary list.',
      context: args,
      instructions: [
        'Rank by a combined score: 0.55*priceRank + 0.20*scheduleConvenienceRank + 0.15*aircraftQualityRank + 0.10*weatherMatchRank (omit any factor that is not available for that itinerary).',
        'Each itinerary entry MUST include: kind, summary (one line), legs[], totalPriceEstimate, stopoverDays?, stopoverCity?, tradeoffs[], sqlEvidence (the concatenated sqlAudit strings that produced it).',
        'Produce at least one direct option and at least one stopover-vacation option if both exist; surface the stopover option even when only slightly cheaper than direct, because it is a two-destination trip.',
        'Cap at 10 itineraries total.',
      ],
      outputFormat: 'JSON: { itineraries: [...], artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['itineraries', 'artifacts'],
      properties: {
        itineraries: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'planning', 'synthesis'],
}));

export const planExportTask = defineTask('plan-export', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Export the travel plan as markdown',
  agent: {
    name: 'itinerary-narrator',
    prompt: {
      role: 'Itinerary Narrator (export)',
      task: 'Write plan.md under workDir.',
      context: args,
      instructions: [
        'Structure plan.md as: (1) Traveler summary, (2) Ranked itineraries -- for each include a headline, the legs table, the total price, the tradeoffs bullets, and a collapsible "SQL evidence" block with the verbatim sqlAudit strings that produced the result.',
        'At the bottom include a "How these were generated" section that explains the process used only Python + stdlib sqlite3 against a local SQLite database -- no MCP, no external APIs at query time.',
        'Return the absolute path planMarkdownPath.',
      ],
      outputFormat: 'JSON: { planMarkdownPath, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['planMarkdownPath', 'artifacts'],
      properties: {
        planMarkdownPath: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'planning', 'export'],
}));
