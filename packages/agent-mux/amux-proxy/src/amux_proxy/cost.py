from __future__ import annotations
from dataclasses import dataclass, field
import time


@dataclass
class CostTracker:
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_requests: int = 0
    total_errors: int = 0
    started_at: float = field(default_factory=time.time)

    def record(self, input_tokens: int, output_tokens: int) -> None:
        self.total_input_tokens += input_tokens
        self.total_output_tokens += output_tokens
        self.total_requests += 1

    def record_error(self) -> None:
        self.total_errors += 1

    def to_dict(self) -> dict:
        uptime = time.time() - self.started_at
        return {
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_requests": self.total_requests,
            "total_errors": self.total_errors,
            "uptime_seconds": round(uptime, 1),
            "avg_tokens_per_request": round(
                (self.total_input_tokens + self.total_output_tokens) / max(self.total_requests, 1), 1
            ),
        }
