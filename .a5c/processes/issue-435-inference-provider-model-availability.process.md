# Issue 435 Inference Provider Model Availability Process

This process tracks current Together AI, Fireworks AI, and Groq inference-provider model catalog deltas in the Atlas graph.

1. Read issue #435 from GitHub at runtime.
2. Fetch the current official provider catalog docs for Together AI, Fireworks AI, and Groq.
3. Audit the existing Atlas graph provider/model/evidence surface.
4. Implement scoped provider-catalog availability, lifecycle, and evidence claims.
5. Verify targeted provider coverage, metadata validity, edge validity, and diff cleanliness.
6. Review the diff against the issue spec and provider docs.
7. Commit, push, create a PR against `staging`, and comment on issue #435.
