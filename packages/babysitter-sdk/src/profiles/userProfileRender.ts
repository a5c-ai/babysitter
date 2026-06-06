import type { ExpertiseRating, UserProfile } from "./types";

export function renderUserProfileMarkdown(profile: UserProfile): string {
  const lines: string[] = [];

  lines.push(`# User Profile: ${profile.name}`);
  lines.push("");
  lines.push(`> Last updated: ${profile.updatedAt} | Version: ${profile.version}`);
  lines.push("");

  if (profile.specialties.length > 0) {
    lines.push("## Specialties");
    lines.push("");
    for (const spec of profile.specialties) {
      const subdomains = spec.subdomains?.length
        ? ` (${spec.subdomains.join(", ")})`
        : "";
      const years = spec.yearsActive !== undefined
        ? ` - ${spec.yearsActive} years`
        : "";
      lines.push(`- **${spec.domain}**${subdomains}${years}`);
    }
    lines.push("");
  }

  const expertiseEntries = Object.entries(profile.expertiseLevels);
  if (expertiseEntries.length > 0) {
    lines.push("## Expertise Levels");
    lines.push("");
    lines.push("| Skill | Level | Confidence |");
    lines.push("|-------|-------|------------|");
    for (const [skill, rating] of expertiseEntries) {
      lines.push(`| ${skill} | ${rating.level} | ${formatConfidence(rating)} |`);
    }
    lines.push("");
  }

  if (profile.goals.length > 0) {
    lines.push("## Goals");
    lines.push("");
    for (const goal of profile.goals) {
      const priority = goal.priority ? ` [${goal.priority}]` : "";
      const status = goal.status ? ` (${goal.status})` : "";
      lines.push(`- **${goal.category}**${priority}: ${goal.description}${status}`);
    }
    lines.push("");
  }

  lines.push("## Preferences");
  lines.push("");
  if (profile.preferences.verbosity) lines.push(`- Verbosity: ${profile.preferences.verbosity}`);
  if (profile.preferences.autonomyLevel) lines.push(`- Autonomy: ${profile.preferences.autonomyLevel}`);
  if (profile.preferences.riskTolerance) lines.push(`- Risk tolerance: ${profile.preferences.riskTolerance}`);
  if (profile.preferences.learningStyle) lines.push(`- Learning style: ${profile.preferences.learningStyle}`);
  if (profile.preferences.workingHours) {
    const wh = profile.preferences.workingHours;
    const parts: string[] = [];
    if (wh.start && wh.end) parts.push(`${wh.start}-${wh.end}`);
    if (wh.timezone) parts.push(wh.timezone);
    if (parts.length > 0) lines.push(`- Working hours: ${parts.join(" ")}`);
  }
  lines.push("");

  const toolEntries = Object.entries(profile.toolPreferences).filter(
    ([, value]) => value !== undefined,
  );
  if (toolEntries.length > 0) {
    lines.push("## Tool Preferences");
    lines.push("");
    for (const [key, value] of toolEntries) {
      if (Array.isArray(value)) {
        lines.push(`- ${key}: ${value.join(", ")}`);
      } else if (typeof value === "string") {
        lines.push(`- ${key}: ${value}`);
      }
    }
    lines.push("");
  }

  lines.push("## Breakpoint Tolerance");
  lines.push("");
  lines.push(`- Global: **${profile.breakpointTolerance.global}**`);
  if (profile.breakpointTolerance.skipBreakpointsForKnownPatterns) {
    lines.push("- Skip known patterns: yes");
  }
  if (profile.breakpointTolerance.alwaysBreakOn?.length) {
    lines.push(`- Always break on: ${profile.breakpointTolerance.alwaysBreakOn.join(", ")}`);
  }
  if (profile.breakpointTolerance.perCategory) {
    for (const [category, level] of Object.entries(profile.breakpointTolerance.perCategory)) {
      lines.push(`- ${category}: ${level}`);
    }
  }
  lines.push("");

  lines.push("## Communication Style");
  lines.push("");
  if (profile.communicationStyle.tone) lines.push(`- Tone: ${profile.communicationStyle.tone}`);
  if (profile.communicationStyle.language) lines.push(`- Language: ${profile.communicationStyle.language}`);
  if (profile.communicationStyle.useEmojis !== undefined) {
    lines.push(`- Emojis: ${profile.communicationStyle.useEmojis ? "yes" : "no"}`);
  }
  if (profile.communicationStyle.explanationDepth) {
    lines.push(`- Explanation depth: ${profile.communicationStyle.explanationDepth}`);
  }
  if (profile.communicationStyle.preferredResponseFormat) {
    lines.push(`- Response format: ${profile.communicationStyle.preferredResponseFormat}`);
  }
  lines.push("");

  const experience = profile.experience;
  const hasExperience =
    experience.currentRole ||
    experience.currentOrganization ||
    experience.totalYearsProfessional !== undefined ||
    (experience.previousRoles && experience.previousRoles.length > 0);
  if (hasExperience) {
    lines.push("## Experience");
    lines.push("");
    if (experience.totalYearsProfessional !== undefined) {
      lines.push(`- Total years: ${experience.totalYearsProfessional}`);
    }
    if (experience.currentRole) lines.push(`- Current role: ${experience.currentRole}`);
    if (experience.currentOrganization) lines.push(`- Organization: ${experience.currentOrganization}`);
    if (experience.industries?.length) lines.push(`- Industries: ${experience.industries.join(", ")}`);
    if (experience.previousRoles?.length) {
      lines.push("- Previous roles:");
      for (const role of experience.previousRoles) {
        const organization = role.organization ? ` at ${role.organization}` : "";
        const duration = role.duration ? ` (${role.duration})` : "";
        lines.push(`  - ${role.title}${organization}${duration}`);
      }
    }
    if (experience.education?.length) {
      lines.push("- Education:");
      for (const education of experience.education) {
        const parts: string[] = [];
        if (education.degree) parts.push(education.degree);
        if (education.field) parts.push(`in ${education.field}`);
        if (education.institution) parts.push(`from ${education.institution}`);
        if (education.year) parts.push(`(${education.year})`);
        lines.push(`  - ${parts.join(" ")}`);
      }
    }
    if (experience.certifications?.length) {
      lines.push(`- Certifications: ${experience.certifications.join(", ")}`);
    }
    lines.push("");
  }

  if (profile.socialProfiles?.length) {
    lines.push("## Social Profiles");
    lines.push("");
    for (const socialProfile of profile.socialProfiles) {
      const username = socialProfile.username ? ` (@${socialProfile.username})` : "";
      lines.push(`- [${socialProfile.platform}](${socialProfile.url})${username}`);
    }
    lines.push("");
  }

  const hasExtensions =
    (profile.installedPlugins?.length ?? 0) > 0 ||
    (profile.installedSkills?.length ?? 0) > 0 ||
    (profile.installedAgents?.length ?? 0) > 0;
  if (hasExtensions) {
    lines.push("## Installed Extensions");
    lines.push("");
    if (profile.installedPlugins?.length) {
      lines.push(`- Plugins: ${profile.installedPlugins.join(", ")}`);
    }
    if (profile.installedSkills?.length) {
      lines.push(`- Skills: ${profile.installedSkills.join(", ")}`);
    }
    if (profile.installedAgents?.length) {
      lines.push(`- Agents: ${profile.installedAgents.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatConfidence(rating: ExpertiseRating): string {
  if (rating.confidence === undefined) return "-";
  return `${Math.round(rating.confidence * 100)}%`;
}
