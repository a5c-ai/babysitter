/**
 * @process specializations/common-utilities
 * @description Common reusable utilities for babysitter process composition
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:orchestration-loop, skill-area:agentic-loops, skill-area:file-handling]
 *   topics: [topic:developer-experience]
 *   roles: [role:platform-engineer, role:backend-engineer, role:tech-lead]
 *   workflows: [workflow:feature-development]
 */

export { convertToDocxTask } from './docx-conversion.js';
export { fanOutFanIn, pipeline } from './parallel-combinator.js';
