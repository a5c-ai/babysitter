import { describe, it, expect } from "vitest";
import {
  createPlan,
  updateStepStatus,
  insertStep,
  removeStep,
  getNextStep,
  getPlanProgress,
  formatPlanForDisplay,
} from "../planMode";

function makeSteps() {
  return [
    { id: "s1", title: "Step 1", description: "First step", dependsOn: [] as string[] },
    { id: "s2", title: "Step 2", description: "Second step", dependsOn: ["s1"] },
    { id: "s3", title: "Step 3", description: "Third step", dependsOn: ["s1"] },
  ];
}

describe("GAP-USER-012: Plan Mode", () => {
  describe("createPlan", () => {
    it("creates a plan in draft status", () => {
      const plan = createPlan("p1", "Test Plan", "A test plan", makeSteps());
      expect(plan.id).toBe("p1");
      expect(plan.status).toBe("draft");
      expect(plan.steps).toHaveLength(3);
      expect(plan.steps.every((s) => s.status === "pending")).toBe(true);
    });
  });

  describe("updateStepStatus", () => {
    it("marks a step as completed", () => {
      const plan = createPlan("p1", "Plan", "desc", makeSteps());
      const updated = updateStepStatus(plan, "s1", "completed");
      expect(updated.steps[0].status).toBe("completed");
      expect(updated.steps[0].completedAt).toBeTruthy();
    });

    it("marks plan as failed when a step fails", () => {
      const plan = createPlan("p1", "Plan", "desc", makeSteps());
      const updated = updateStepStatus(plan, "s1", "failed", "broke");
      expect(updated.status).toBe("failed");
      expect(updated.steps[0].feedback).toBe("broke");
    });

    it("marks plan as completed when all steps done", () => {
      let plan = createPlan("p1", "Plan", "desc", makeSteps());
      plan = updateStepStatus(plan, "s1", "completed");
      plan = updateStepStatus(plan, "s2", "completed");
      plan = updateStepStatus(plan, "s3", "completed");
      expect(plan.status).toBe("completed");
    });

    it("marks plan as executing when a step is in progress", () => {
      let plan = createPlan("p1", "Plan", "desc", makeSteps());
      plan = updateStepStatus(plan, "s1", "in_progress");
      expect(plan.status).toBe("executing");
    });
  });

  describe("insertStep", () => {
    it("inserts step after a specified step", () => {
      const plan = createPlan("p1", "Plan", "desc", makeSteps());
      const newStep = { id: "s1.5", title: "Inserted", description: "new", dependsOn: ["s1"] };
      const updated = insertStep(plan, newStep, "s1");
      expect(updated.steps[1].id).toBe("s1.5");
      expect(updated.status).toBe("modified");
    });

    it("appends when afterStepId not found", () => {
      const plan = createPlan("p1", "Plan", "desc", makeSteps());
      const newStep = { id: "s4", title: "Last", description: "end", dependsOn: [] as string[] };
      const updated = insertStep(plan, newStep, "nonexistent");
      expect(updated.steps[updated.steps.length - 1].id).toBe("s4");
    });

    it("appends when no afterStepId given", () => {
      const plan = createPlan("p1", "Plan", "desc", makeSteps());
      const newStep = { id: "s4", title: "Last", description: "end", dependsOn: [] as string[] };
      const updated = insertStep(plan, newStep);
      expect(updated.steps[updated.steps.length - 1].id).toBe("s4");
    });
  });

  describe("removeStep", () => {
    it("removes a step", () => {
      const plan = createPlan("p1", "Plan", "desc", makeSteps());
      const updated = removeStep(plan, "s2");
      expect(updated.steps).toHaveLength(2);
      expect(updated.steps.find((s) => s.id === "s2")).toBeUndefined();
    });

    it("cleans up dangling dependencies", () => {
      const plan = createPlan("p1", "Plan", "desc", makeSteps());
      const updated = removeStep(plan, "s1");
      // s2 and s3 depended on s1 -- those deps should be removed
      expect(updated.steps.find((s) => s.id === "s2")?.dependsOn).toEqual([]);
      expect(updated.steps.find((s) => s.id === "s3")?.dependsOn).toEqual([]);
    });

    it("preserves other dependencies when removing a step", () => {
      const steps = [
        { id: "a", title: "A", description: "", dependsOn: [] as string[] },
        { id: "b", title: "B", description: "", dependsOn: ["a"] },
        { id: "c", title: "C", description: "", dependsOn: ["a", "b"] },
      ];
      const plan = createPlan("p1", "Plan", "desc", steps);
      const updated = removeStep(plan, "a");
      // c should still depend on b, but not a
      expect(updated.steps.find((s) => s.id === "c")?.dependsOn).toEqual(["b"]);
    });
  });

  describe("getNextStep", () => {
    it("returns first step with no deps when all pending", () => {
      const plan = createPlan("p1", "Plan", "desc", makeSteps());
      const next = getNextStep(plan);
      expect(next?.id).toBe("s1");
    });

    it("returns step whose deps are satisfied", () => {
      let plan = createPlan("p1", "Plan", "desc", makeSteps());
      plan = updateStepStatus(plan, "s1", "completed");
      const next = getNextStep(plan);
      expect(next?.id).toBe("s2");
    });

    it("returns undefined when no steps are ready", () => {
      const plan = createPlan("p1", "Plan", "desc", [
        { id: "s1", title: "A", description: "", dependsOn: ["s2"] },
        { id: "s2", title: "B", description: "", dependsOn: ["s1"] },
      ]);
      expect(getNextStep(plan)).toBeUndefined();
    });
  });

  describe("getPlanProgress", () => {
    it("reports zero progress for new plan", () => {
      const plan = createPlan("p1", "Plan", "desc", makeSteps());
      const progress = getPlanProgress(plan);
      expect(progress.total).toBe(3);
      expect(progress.completed).toBe(0);
      expect(progress.percentComplete).toBe(0);
    });

    it("reports correct progress", () => {
      let plan = createPlan("p1", "Plan", "desc", makeSteps());
      plan = updateStepStatus(plan, "s1", "completed");
      plan = updateStepStatus(plan, "s2", "skipped");
      const progress = getPlanProgress(plan);
      expect(progress.completed).toBe(2);
      expect(progress.percentComplete).toBe(67);
    });
  });

  describe("formatPlanForDisplay", () => {
    it("includes plan title and steps", () => {
      const plan = createPlan("p1", "My Plan", "Plan description", makeSteps());
      const output = formatPlanForDisplay(plan);
      expect(output).toContain("My Plan");
      expect(output).toContain("Step 1");
      expect(output).toContain("Step 2");
      expect(output).toContain("0/3");
    });
  });
});
