import { describe, expect, it } from "vitest";
import {
  getCatalogDiscoverySnapshot,
  getCatalogDomainByName,
  getCatalogProcessById,
  getCatalogSkillBySlug,
  getCatalogSpecializationByName,
  listCatalogAgents,
  listCatalogDomains,
  listCatalogProcesses,
  listCatalogSkills,
  listCatalogSpecializations,
  refreshCatalogDiscoverySnapshot,
  searchCatalogDiscovery,
} from "./index";

const CONTRACT_TIMEOUT_MS = 60_000;

describe("agent-catalog discovery contract", () => {
  it("keeps the list helpers aligned with the cached discovery snapshot counts", () => {
    const snapshot = getCatalogDiscoverySnapshot();

    expect(listCatalogAgents()).toHaveLength(snapshot.counts.agents);
    expect(listCatalogSkills()).toHaveLength(snapshot.counts.skills);
    expect(listCatalogProcesses()).toHaveLength(snapshot.counts.processes);
    expect(listCatalogDomains()).toHaveLength(snapshot.counts.domains);
    expect(listCatalogSpecializations()).toHaveLength(snapshot.counts.specializations);
  }, CONTRACT_TIMEOUT_MS);

  it("round-trips detail lookups for representative discovery entities", () => {
    const snapshot = getCatalogDiscoverySnapshot();
    const process = snapshot.processes.find((entry) => entry.tasks.length > 0) ?? snapshot.processes[0];
    const skill = snapshot.skills.find((entry) => entry.domainName) ?? snapshot.skills[0];
    const domain = snapshot.domains.find((entry) => entry.specializations.length > 0) ?? snapshot.domains[0];
    const specialization =
      snapshot.specializations.find((entry) => entry.skills.length > 0 || entry.agents.length > 0) ??
      snapshot.specializations[0];

    expect(process).toBeDefined();
    expect(skill).toBeDefined();
    expect(domain).toBeDefined();
    expect(specialization).toBeDefined();

    expect(getCatalogProcessById(process!.id)).toEqual(process);
    expect(getCatalogSkillBySlug(skill!.slug)).toEqual(skill);
    expect(getCatalogDomainByName(domain!.name)).toEqual(domain);
    expect(getCatalogSpecializationByName(specialization!.name)).toEqual(specialization);
  }, CONTRACT_TIMEOUT_MS);

  it("returns cloned snapshot data so consumer mutations do not leak into cache state", () => {
    const original = getCatalogDiscoverySnapshot();
    const mutated = getCatalogDiscoverySnapshot();

    mutated.skills[0]!.name = "__mutated__";
    mutated.processes.pop();

    const fresh = refreshCatalogDiscoverySnapshot();

    expect(fresh.skills[0]!.name).toBe(original.skills[0]!.name);
    expect(fresh.processes).toHaveLength(original.processes.length);
  }, CONTRACT_TIMEOUT_MS);

  it("supports filtered search across every discovery entity type", () => {
    const snapshot = getCatalogDiscoverySnapshot();
    const domain = snapshot.domains.find((entry) => entry.category) ?? snapshot.domains[0];
    const specialization = snapshot.specializations.find((entry) => entry.domainName) ?? snapshot.specializations[0];

    expect(domain).toBeDefined();
    expect(specialization).toBeDefined();

    const domainResults = searchCatalogDiscovery(domain!.name, ["domain"]);
    expect(domainResults.length).toBeGreaterThan(0);
    expect(domainResults.every((result) => result.type === "domain")).toBe(true);
    expect(domainResults.some((result) => result.id === domain!.id)).toBe(true);

    const specializationResults = searchCatalogDiscovery(specialization!.name, ["specialization"]);
    expect(specializationResults.length).toBeGreaterThan(0);
    expect(specializationResults.every((result) => result.type === "specialization")).toBe(true);
    expect(specializationResults.some((result) => result.id === specialization!.id)).toBe(true);
  });
});
