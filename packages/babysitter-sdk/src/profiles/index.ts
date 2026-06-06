/**
 * Profiles Module for Babysitter SDK
 *
 * Provides types and utilities for managing user profiles (personal preferences,
 * expertise, and configuration) and project profiles (technical context,
 * architecture, tooling, and workflow information).
 *
 * @example
 * ```ts
 * import {
 *   readUserProfile,
 *   writeUserProfile,
 *   createDefaultUserProfile,
 *   mergeUserProfile,
 *   readProjectProfile,
 *   writeProjectProfile,
 *   createDefaultProjectProfile,
 *   mergeProjectProfile,
 * } from "@a5c-ai/babysitter-sdk";
 * ```
 */
export * from "./types";
export * from "./userProfile";
export * from "./projectProfile";
