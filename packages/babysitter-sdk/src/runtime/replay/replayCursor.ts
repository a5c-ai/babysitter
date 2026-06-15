const STEP_PREFIX = "S";
const STEP_WIDTH = 6;

export class ReplayCursor {
  private counter = 0;

  nextStepId(): string {
    this.counter += 1;
    return formatStepId(this.counter);
  }

  peekNextStepId(): string {
    return formatStepId(this.counter + 1);
  }

  get value(): number {
    return this.counter;
  }
}

function formatStepId(value: number) {
  return `${STEP_PREFIX}${Math.max(value, 0).toString().padStart(STEP_WIDTH, "0")}`;
}
