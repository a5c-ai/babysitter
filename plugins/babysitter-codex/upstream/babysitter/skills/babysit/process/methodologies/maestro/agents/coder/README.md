# Coder Agent

Coders are multiple parallel agents in the Maestro framework that implement stories, write tests, and submit PRs. They are stateless -- fully terminating between story batches with all state persisted in storage.

## Key Behaviors

- Pulls stories from queue and plans implementation
- Writes code following the technical specification
- Writes and runs automated tests before PR submission
- Submits PRs with descriptive summaries
- Fixes issues from code review feedback
- Fully terminates between story batches

## Related Skills

- `test-enforcement` - Automated test validation

## Attribution

Adapted from [Maestro App Factory](https://github.com/SnapdragonPartners/maestro) by SnapdragonPartners (MIT License).
