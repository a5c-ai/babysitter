"use client";
import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ProjectSectionHeader } from "./project-section-header";
import { ProjectSection } from "./project-section";
import type { ProjectSummary } from "@/types";

interface ProjectAccordionProps {
  projects: ProjectSummary[];
  statusFilter?: string;
  className?: string;
}

export function ProjectAccordion({ projects, statusFilter, className }: ProjectAccordionProps) {
  // Default-open projects that have active runs
  const defaultOpen = projects
    .filter((p) => p.activeRuns > 0)
    .map((p) => p.projectName);

  // Track which projects are expanded
  const [expandedProjects, setExpandedProjects] = useState<string[]>(defaultOpen);

  if (projects.length === 0) {
    return (
      <div className="text-sm text-foreground-muted text-center py-8">
        No projects found
      </div>
    );
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpen}
      value={expandedProjects}
      onValueChange={(value) => setExpandedProjects(Array.isArray(value) ? value : [value])}
      className={className}
    >
      {projects.map((project) => {
        const isExpanded = expandedProjects.includes(project.projectName);
        return (
          <AccordionItem key={project.projectName} value={project.projectName}>
            <AccordionTrigger className="px-2 hover:bg-primary-muted/30 rounded-md transition-colors">
              <ProjectSectionHeader
                projectName={project.projectName}
                activeRuns={project.activeRuns}
                completedRuns={project.completedRuns}
                failedRuns={project.failedRuns}
                totalRuns={project.totalRuns}
                latestUpdate={project.latestUpdate}
              />
            </AccordionTrigger>
            <AccordionContent className="px-2">
              <ProjectSection
                projectName={project.projectName}
                runs={[]}
                defaultExpanded
                statusFilter={statusFilter}
                enabled={isExpanded}
              />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
