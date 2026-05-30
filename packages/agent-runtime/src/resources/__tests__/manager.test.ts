import { describe, it, expect, vi } from "vitest";
import { BudgetTracker, BudgetExceededError } from "../budget-tracker";
import { ConcurrencyGuard, ConcurrencyLimitError } from "../concurrency-guard";
import { TimeoutCascade } from "../timeout-cascade";
import { ResourceManagerImpl } from "../manager";

// ---------------------------------------------------------------------------
// BudgetTracker
// ---------------------------------------------------------------------------

describe("BudgetTracker", () => {
  it("consume reduces remaining balance", () => {
    const bt = new BudgetTracker(100);
    bt.consume(40);

    expect(bt.used).toBe(40);
    expect(bt.remaining).toBe(60);
  });

  it("throws BudgetExceededError when consume exceeds remaining", () => {
    const bt = new BudgetTracker(50);
    bt.consume(30);

    expect(() => bt.consume(25)).toThrow(BudgetExceededError);
    // Ensure state was not mutated by the failed consume
    expect(bt.used).toBe(30);
    expect(bt.remaining).toBe(20);
  });

  it("release adds units back to remaining", () => {
    const bt = new BudgetTracker(100);
    bt.consume(60);
    bt.release(20);

    expect(bt.used).toBe(40);
    expect(bt.remaining).toBe(60);
  });

  it("release clamps used to zero (never goes negative)", () => {
    const bt = new BudgetTracker(100);
    bt.consume(10);
    bt.release(50); // more than consumed

    expect(bt.used).toBe(0);
    expect(bt.remaining).toBe(100);
  });

  it("threshold callback fires when usage crosses the threshold", () => {
    const bt = new BudgetTracker(100);
    const cb = vi.fn();

    bt.onThreshold(80, cb);
    expect(cb).not.toHaveBeenCalled();

    bt.consume(79);
    expect(cb).not.toHaveBeenCalled();

    bt.consume(1); // exactly 80%
    expect(cb).toHaveBeenCalledTimes(1);

    // Should not fire again on further consumption
    bt.consume(5);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("threshold re-arms after release drops below the threshold", () => {
    const bt = new BudgetTracker(100);
    const cb = vi.fn();

    bt.onThreshold(50, cb);
    bt.consume(60); // fires
    expect(cb).toHaveBeenCalledTimes(1);

    bt.release(30); // usage drops to 30%, re-arm
    bt.consume(25); // usage rises to 55%, fires again
    expect(cb).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// ConcurrencyGuard
// ---------------------------------------------------------------------------

describe("ConcurrencyGuard", () => {
  it("acquire and release update active/available counts", () => {
    const cg = new ConcurrencyGuard(3);

    expect(cg.active).toBe(0);
    expect(cg.available).toBe(3);

    cg.acquire();
    expect(cg.active).toBe(1);
    expect(cg.available).toBe(2);

    cg.release();
    expect(cg.active).toBe(0);
    expect(cg.available).toBe(3);
  });

  it("tryAcquire returns false when all slots are in use", () => {
    const cg = new ConcurrencyGuard(2);

    expect(cg.tryAcquire()).toBe(true);
    expect(cg.tryAcquire()).toBe(true);
    expect(cg.tryAcquire()).toBe(false);

    expect(cg.active).toBe(2);
    expect(cg.available).toBe(0);
  });

  it("acquire throws ConcurrencyLimitError when no slots available", () => {
    const cg = new ConcurrencyGuard(1);
    cg.acquire();

    expect(() => cg.acquire()).toThrow(ConcurrencyLimitError);
    expect(cg.active).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// TimeoutCascade
// ---------------------------------------------------------------------------

describe("TimeoutCascade", () => {
  it("createRunTimeout returns a handle with an AbortSignal", () => {
    const tc = new TimeoutCascade();
    const handle = tc.createRunTimeout(10_000);

    expect(handle.signal).toBeInstanceOf(AbortSignal);
    expect(handle.signal.aborted).toBe(false);

    // Clean up
    handle.clear();
    expect(handle.signal.aborted).toBe(true);
  });

  it("child iteration timeout is aborted when parent run timeout is cleared", () => {
    const tc = new TimeoutCascade();
    const runHandle = tc.createRunTimeout(10_000);
    const iterHandle = tc.createIterationTimeout(10_000);

    expect(iterHandle.signal.aborted).toBe(false);

    runHandle.clear(); // clears run and cascades to children

    expect(runHandle.signal.aborted).toBe(true);
    expect(iterHandle.signal.aborted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ResourceManagerImpl
// ---------------------------------------------------------------------------

describe("ResourceManagerImpl", () => {
  it("checkBudget returns token budget state", () => {
    const rm = new ResourceManagerImpl({ tokenLimit: 1000, costLimit: 50 });

    const budget = rm.checkBudget("tokens");
    expect(budget.limit).toBe(1000);
    expect(budget.used).toBe(0);
    expect(budget.remaining).toBe(1000);
  });

  it("consume reduces the budget for the given kind", () => {
    const rm = new ResourceManagerImpl({ tokenLimit: 1000, costLimit: 50 });

    rm.consume("tokens", 200);
    const budget = rm.checkBudget("tokens");
    expect(budget.used).toBe(200);
    expect(budget.remaining).toBe(800);
  });

  it("getSnapshot returns a complete resource snapshot", () => {
    const rm = new ResourceManagerImpl({
      tokenLimit: 500,
      costLimit: 10,
      costCurrency: "EUR",
    });

    rm.consume("tokens", 100);
    rm.consume("cost", 3);

    const snap = rm.getSnapshot();

    expect(snap.tokens.limit).toBe(500);
    expect(snap.tokens.used).toBe(100);
    expect(snap.tokens.remaining).toBe(400);

    expect(snap.cost.limit).toBe(10);
    expect(snap.cost.used).toBe(3);
    expect(snap.cost.remaining).toBe(7);
    expect((snap.cost as { currency?: string }).currency).toBe("EUR");

    expect(snap.concurrency).toBeDefined();
    expect(snap.timestamp).toBeDefined();
  });

  it("admits execution resource policies through an OS-limit seam", () => {
    const rm = new ResourceManagerImpl({ tokenLimit: 1000, costLimit: 50 });

    const admission = rm.admitExecutionPolicy({
      resources: {
        cpuCount: 2,
        memoryBytes: 536_870_912,
        pidsLimit: 64,
      },
    });

    expect(admission.accepted).toBe(true);
    expect(admission.osLimits).toEqual({
      cpuCount: 2,
      memoryBytes: 536_870_912,
      pidsLimit: 64,
    });
    expect(admission.unsupported).toEqual([]);
  });

  it("admits and reserves work that fits configured budgets", () => {
    const rm = new ResourceManagerImpl({ tokenLimit: 1000, costLimit: 50 });

    const admission = rm.admit({ tokens: 250, cost: 10 });

    expect(admission.allowed).toBe(true);
    expect(rm.checkBudget("tokens").used).toBe(250);
    expect(rm.checkBudget("cost").used).toBe(10);
  });

  it("rejects over-budget work before mutating budget state", () => {
    const rm = new ResourceManagerImpl({ tokenLimit: 100, costLimit: 5 });
    rm.consume("tokens", 80);

    const admission = rm.admit({ tokens: 25, cost: 1 });

    expect(admission.allowed).toBe(false);
    expect(admission.reason).toContain("tokens");
    expect(rm.checkBudget("tokens").used).toBe(80);
    expect(rm.checkBudget("cost").used).toBe(0);
  });
});
