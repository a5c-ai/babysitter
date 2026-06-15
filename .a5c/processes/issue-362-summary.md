Implemented #362 on branch `agent/issue-362`.

What changed:
- Added Amazon Nova 2 Sonic as a Bedrock-served model with `amazon.nova-2-sonic-v1:0` and bidirectional audio streaming transport metadata.
- Expanded Amazon Nova 2 Lite with Bedrock provider model IDs, 1M context, 64K max output, prompt caching, extended thinking, Converse/Invoke transport edges, and evidence-backed claims.
- Updated Amazon Nova 2 family and AWS Bedrock provider traversal so both Lite and Sonic are reachable from model family/provider/protocol graph paths.
- Added official AWS evidence sources and model-version claim records for Lite and Sonic.

Verification:
- `git diff --check`
- `npm run verify:metadata`

Residual notes:
- Nova 2 Sonic context/output is modeled as speech-to-speech streaming, not a normal text context window, until docs confirm otherwise.
- Bedrock pricing remains linked through AWS pricing evidence instead of hardcoding region-specific rates.
