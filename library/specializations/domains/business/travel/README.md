---
domain: business/travel
---

# Travel (Curated-Dataset + SQL-Tool Pattern)

Two processes that together turn a local SQLite file into a sophisticated
travel planner. The pattern is: do the curation once, then let an LLM
compose SQL against the curated database through Python scripts at plan
time. No MCP is involved at any stage.

## Processes

- **`flight-dataset-build.js`** -- discover open flight/airport/climate
  data sources, design a SQLite schema, author and run Python 3 + stdlib
  `sqlite3` ETL scripts, build indexes and denormalized helper views, and
  produce `SCHEMA.md` so downstream agents can author SQL without guessing.
- **`travel-plan-compose.js`** -- read `SCHEMA.md`, resolve a traveler's
  loose intent into SQL-filterable constraints, compose and execute
  Python query scripts against the DB, and return ranked itineraries that
  include stopover-as-vacation options (two-destination trips that can
  beat a direct flight on price). Every itinerary carries the verbatim
  SQL that produced it as audit evidence.

## Hard constraints (honoured by both processes)

- Only `kind: 'agent'` tasks are used. No shell tasks, no sqlite3 CLI,
  no MCP adapters.
- All database creation, loading, indexing, and querying happens through
  Python 3 scripts that use ONLY the standard library `sqlite3` module.
- Database is opened read-only during planning (`mode=ro` URI) so the
  planner cannot mutate the dataset.
- SQL used in the plan output is carried verbatim as audit evidence.

## Agents

Under `agents/`:

- `trip-scope-planner` -- turns origin + window + interests into concrete dataset scope.
- `open-data-scout` -- discovers authoritative open data sources.
- `sqlite-schema-architect` -- designs the schema, indexes, views, and writes `SCHEMA.md`.
- `python-etl-engineer` -- writes and executes Python + stdlib `sqlite3` ETL scripts.
- `data-quality-inspector` -- validates the DB against expected queries + integrity checks.
- `traveler-profiler` -- resolves loose traveler inputs into SQL-filterable constraints.
- `sql-query-composer` -- authors and runs Python query scripts against the DB.
- `stopover-strategist` -- finds stopover-as-vacation itineraries.
- `itinerary-narrator` -- explains tradeoffs in plain language, ranks, and exports markdown.

## Inspired by

- https://github.com/mluggy
- https://www.linkedin.com/posts/mluggy_%D7%9B%D7%9E%D7%95-%D7%9E%D7%99%D7%9C%D7%99%D7%95%D7%A0%D7%99-%D7%99%D7%A9%D7%A8%D7%90%D7%9C%D7%99%D7%9D-%D7%92%D7%9D-%D7%90%D7%A0%D7%97%D7%A0%D7%95-%D7%9E%D7%AA%D7%9B%D7%A0%D7%A0%D7%99%D7%9D-%D7%97%D7%95%D7%A4%D7%A9%D7%95%D7%AA-ugcPost-7448843353275858944-b7d4
