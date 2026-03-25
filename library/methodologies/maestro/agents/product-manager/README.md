# Product Manager Agent

The Product Manager (PM) is a singleton agent in the Maestro framework responsible for requirements elicitation and specification generation. It conducts interactive interviews adapted to user expertise, generates structured specs, and iterates with the Architect for approval.

## Key Behaviors

- Adapts interview depth to user expertise level
- Generates structured requirements with acceptance criteria
- Iterates with Architect feedback loop until spec is approved
- Can ingest pre-written spec files instead of interviewing
- Never writes technical specs or code

## Related Skills

- `requirements-interview` - Interactive PM interview
- `specification-generation` - Requirements to spec conversion

## Attribution

Adapted from [Maestro App Factory](https://github.com/SnapdragonPartners/maestro) by SnapdragonPartners (MIT License).
