/**
 * @process specializations/common-utilities
 * @description Common reusable utilities for babysitter process composition
 */

export { convertToDocxTask } from './docx-conversion.js';
export { fanOutFanIn, pipeline } from './parallel-combinator.js';
