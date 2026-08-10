/**
 * @deprecated Moved to specializations/domains/business/business-strategy/revenue.js
 *   as part of the business/ vestigial-directory fold (a single-process specialization
 *   folded into the matching business domain subdomain, per the process-library placement
 *   policy: domain-specific processes live under specializations/domains/<domain>). This
 *   header-only pointer re-exports the process so existing imports of
 *   'specializations/business/revenue.js' keep resolving. Import from the new path.
 * @process specializations/business/revenue
 */
export * from '../domains/business/business-strategy/revenue.js';
