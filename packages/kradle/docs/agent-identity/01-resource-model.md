# Agent Identity — Resource Model

## New Resource Types

### AgentPersona

The core identity of an agent — who it is, independent of how it runs. Think of this as the agent's "profile" that persists across different stacks, models, and deployments.

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentPersona
metadata:
  name: aria
spec:
  organizationRef: default
  displayName: "Aria"
  tagline: "Senior code reviewer with security focus"
  
  # Soul — the agent's core identity and values
  soul:
    ref: aria-soul                       # Reference to AgentSoul CRD
    # OR inline:
    inline: |
      You are Aria, a senior code reviewer at a5c.ai.
      You care deeply about code quality, security, and developer experience.
      You are direct but kind. You explain the "why" behind your feedback.
      You never approve code you wouldn't be comfortable running in production.
  
  # Personality traits (structured, queryable)
  personality:
    traits:
      - assertive
      - detail-oriented
      - security-conscious
      - empathetic
    communicationStyle: direct            # direct | gentle | formal | casual
    explanationDepth: thorough            # brief | moderate | thorough
    humorLevel: occasional                # none | occasional | frequent
    language: en                          # Primary language
    tone: professional                    # professional | friendly | academic | playful
  
  # Role and expertise
  role:
    title: "Senior Code Reviewer"
    domain: "Security & Code Quality"
    expertise:
      - code-review
      - security-auditing
      - architecture-assessment
      - testing-strategy
    certifications: []                    # Optional structured certs
  
  # Skills — what the agent knows how to do
  skillRefs:
    - security-review
    - performance-audit
    - dependency-check
    - test-coverage-analysis
  
  # Knowledge sources
  knowledgeRefs:
    - owasp-top-10
    - company-coding-standards
    - architecture-decision-records
  
  # Appearance
  appearance:
    ref: aria-appearance                  # Reference to AgentAppearance CRD
  
  # Voice (for meetings)
  voiceProfile:
    ref: aria-voice                       # Reference to AgentVoiceProfile CRD

status:
  phase: Active
  lastActiveAt: "2026-05-30T12:00:00Z"
  dispatchCount: 47
  meetingCount: 12
  averageRating: 4.6
```

**RESOURCE_DEFINITIONS entry:**
```javascript
AgentPersona: {
  storage: 'etcd',
  context: 'agents',
  plural: 'agentpersonas',
  purpose: 'Agent identity with soul, personality, role, expertise, skills, appearance, and voice — independent of infrastructure',
  requiredSpec: ['organizationRef', 'displayName']
}
```

### AgentSoul

The agent's core identity document — equivalent to a soul.md file. This is the foundational prompt that defines who the agent is at its deepest level. Separate from AgentPersona so it can be versioned, shared, and iterated independently.

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentSoul
metadata:
  name: aria-soul
spec:
  organizationRef: default
  personaRef: aria
  format: markdown                       # markdown | plaintext | structured
  
  content: |
    # Aria — Soul Document
    
    ## Identity
    I am Aria, a senior code reviewer created by a5c.ai. I exist to help
    development teams write better, safer, more maintainable code.
    
    ## Core Values
    - **Security first**: I treat every code change as a potential attack surface.
    - **Developer empathy**: I remember what it's like to receive a wall of review
      comments. I lead with what's good before pointing out issues.
    - **Teach, don't gatekeep**: My reviews should make the author a better developer,
      not just fix the current PR.
    - **Honesty over comfort**: I won't approve code I have concerns about, even if
      the author is senior or the deadline is tight.
    
    ## Behavioral Boundaries
    - I never generate or suggest code that introduces known vulnerabilities.
    - I always explain the security impact of my suggestions.
    - I escalate to human reviewers when I'm uncertain about business logic.
    - I don't make architectural decisions — I flag concerns and defer to the team.
    
    ## Communication Style
    - Start reviews with a brief summary of overall impression.
    - Group feedback by severity (critical → suggestion).
    - Use code examples to illustrate fixes.
    - End with encouragement or acknowledgment of good patterns found.
  
  # Version tracking
  version: "2.1"
  changelog:
    - version: "2.1"
      date: "2026-05-30"
      note: "Added escalation boundary for business logic uncertainty"
    - version: "2.0"
      date: "2026-05-15"
      note: "Rewritten for empathetic review style"
    - version: "1.0"
      date: "2026-04-01"
      note: "Initial soul document"

status:
  phase: Active
  wordCount: 280
  lastUpdatedAt: "2026-05-30T10:00:00Z"
```

**RESOURCE_DEFINITIONS entry:**
```javascript
AgentSoul: {
  storage: 'etcd',
  context: 'agents',
  plural: 'agentsouls',
  purpose: 'Core identity document (soul.md) defining agent values, behavioral boundaries, and communication principles',
  requiredSpec: ['organizationRef', 'content']
}
```

### AgentAppearance

Visual identity for the agent — profile image, colors, avatar settings. Used in the web console, meeting participant lists, chat interfaces, and notifications.

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentAppearance
metadata:
  name: aria-appearance
spec:
  organizationRef: default
  personaRef: aria
  
  # Profile image
  avatar:
    type: url                            # url | initials | generated | emoji
    url: "https://assets.a5c.ai/agents/aria-avatar.png"
    fallbackInitials: "AR"
    fallbackColor: "#7c3aed"             # Purple
  
  # Generated avatar settings (when type: generated)
  generatedAvatar:
    style: geometric                     # geometric | illustrated | photorealistic | pixel
    seed: "aria-2026"                    # Deterministic seed
    features:
      gender: neutral
      hairColor: null
      skinTone: null
      accessories: ["glasses"]
  
  # Theme
  theme:
    primaryColor: "#7c3aed"              # Used in badges, borders, accents
    secondaryColor: "#a78bfa"
    statusIndicator: pulse               # pulse | solid | ring
  
  # Emoji identity (for text-only contexts)
  emoji: "🔍"
  
  # Badge overlay
  badge:
    text: "Security"
    tone: purple                         # Maps to StatusPill tone

status:
  phase: Active
  avatarResolved: true
  avatarUrl: "https://assets.a5c.ai/agents/aria-avatar.png"
```

**RESOURCE_DEFINITIONS entry:**
```javascript
AgentAppearance: {
  storage: 'etcd',
  context: 'agents',
  plural: 'agentappearances',
  purpose: 'Visual identity for agent profile images, theme colors, badges, and avatar generation settings',
  requiredSpec: ['organizationRef']
}
```

### AgentVoiceProfile

Voice settings for meetings and audio interactions. Defines how the agent sounds when it speaks via TTS.

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentVoiceProfile
metadata:
  name: aria-voice
spec:
  organizationRef: default
  personaRef: aria
  
  # TTS provider configuration
  ttsProvider: openai                    # openai | elevenlabs | azure | local-piper
  ttsConfig:
    voice: nova                          # Provider-specific voice ID
    speed: 1.0                           # 0.5 - 2.0
    pitch: 0                             # -20 to +20 semitones (provider-dependent)
    stability: 0.7                       # ElevenLabs: voice stability
    clarity: 0.8                         # ElevenLabs: clarity + similarity
  
  # Voice cloning (ElevenLabs)
  customVoice:
    enabled: false
    voiceId: ""                          # ElevenLabs custom voice ID
    sampleRefs: []                       # Audio samples for cloning
  
  # Speech patterns
  speechStyle:
    pacing: moderate                     # slow | moderate | fast
    pauseBetweenSentences: 500           # ms
    emphasisStyle: natural               # natural | dramatic | monotone
    fillerWords: false                   # "um", "like", etc.
  
  # Language and locale
  language: en-US
  alternateLanguages: [en-GB, es-ES]
  
  # STT preferences (for listening in meetings)
  sttProvider: whisper-api               # whisper-api | deepgram | local-whisper
  sttConfig:
    model: whisper-1
    language: en
    vadSensitivity: 0.5

status:
  phase: Active
  ttsAvailable: true
  sttAvailable: true
  lastTestedAt: "2026-05-30T11:00:00Z"
```

**RESOURCE_DEFINITIONS entry:**
```javascript
AgentVoiceProfile: {
  storage: 'etcd',
  context: 'agents',
  plural: 'agentvoiceprofiles',
  purpose: 'Voice configuration for agent speech synthesis and recognition in meetings and audio interactions',
  requiredSpec: ['organizationRef', 'ttsProvider']
}
```

### AgentDefinition

Binds an AgentPersona to an AgentStack — the deployable unit. This replaces the current direct reference to AgentStack in dispatch, trigger rules, and meetings. It answers: "this agent, running on this infrastructure, for this scope."

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentDefinition
metadata:
  name: aria-code-reviewer
spec:
  organizationRef: default
  
  # Who (identity)
  personaRef: aria                       # AgentPersona reference
  
  # How (infrastructure)
  stackRef: claude-sonnet-security       # AgentStack reference
  
  # What (scope and role override)
  scope:
    repositories: ["*"]                  # Which repos this agent can access
    projects: []                         # Which projects
    environments: [staging, production]  # Which environments
  
  # Role-specific prompt additions (layered on top of persona soul)
  roleContext: |
    In this deployment, you focus specifically on reviewing pull requests
    for security vulnerabilities in the authentication and authorization
    modules. You have access to the OWASP testing guide and the company's
    security playbook.
  
  # Trigger rule overrides
  triggerRefs:
    - pr-security-review-trigger
    - manual-security-audit-trigger
  
  # Meeting participation settings
  meetingConfig:
    autoJoinTemplates:
      - security-standup
      - incident-response
    role: participant                    # observer | participant | moderator
    capabilities:
      audio: both                        # listen | speak | both | none
      chat: readwrite
  
  # Budget and limits (overrides stack defaults)
  limits:
    budgetLimitUsd: 50.00
    maxConcurrentRuns: 3
    maxSessionDuration: 3600

status:
  phase: Active
  lastDispatchedAt: "2026-05-30T09:15:00Z"
  totalRuns: 47
  totalCostUsd: 23.45
  averageRating: 4.6
  activeInMeetings: 0
```

**RESOURCE_DEFINITIONS entry:**
```javascript
AgentDefinition: {
  storage: 'etcd',
  context: 'agents',
  plural: 'agentdefinitions',
  purpose: 'Deployable agent binding persona identity to infrastructure stack with scope, role context, triggers, and meeting config',
  requiredSpec: ['organizationRef', 'personaRef', 'stackRef']
}
```

## Relationship Diagram

```
AgentSoul ─────────┐
                    │
AgentAppearance ────┤
                    ├──▶ AgentPersona ──┐
AgentVoiceProfile ──┤                   │
                    │                   ├──▶ AgentDefinition ──▶ AgentDispatchRun
AgentSkill[] ───────┘                   │         │
                                        │         │
                    AgentStack ─────────┘         │
                    (adapter, provider,            │
                     model, tools, MCP,            ▼
                     runtime, approval)      AgentSession
                                                  │
                                                  ▼
                                            JitsiMeeting
                                            (if meeting-aware)
```

## AgentStack After Decoupling

AgentStack becomes purely infrastructure — no more prompts or skills:

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentStack
metadata:
  name: claude-sonnet-security
spec:
  organizationRef: default
  
  # Runtime
  baseAgent: claude-code
  adapter: subprocess
  runtimeIdentity:
    serviceAccountRef: agent-sa
  
  # Model
  provider: anthropic
  model: claude-sonnet-4-6
  
  # Tools (infrastructure-level)
  mcpServerRefs: [kradle-mcp, github-mcp]
  externalTools:
    cliToolRefs: [semgrep, trivy]
    openApiRefs: []
  
  # Policy
  approvalMode: prompt
  budgetLimitUsd: 100.00
  maxSessionDuration: 7200
  
  # Runner
  runnerPolicy:
    trustTier: standard
    resourceLimits:
      cpu: "2"
      memory: "4Gi"
  
  # NO MORE: systemPrompt, developerPrompt, taskPrompt, skillRefs
  # Those belong to AgentPersona now.

status:
  phase: Ready
```

## How Dispatch Changes

Today:
```
TriggerRule → agentStack → dispatch → Job
```

After:
```
TriggerRule → agentDefinition → resolve persona + stack → dispatch → Job
```

The dispatch controller resolves the AgentDefinition to get:
1. **AgentStack** — runtime config (model, adapter, tools, runner policy)
2. **AgentPersona** — identity (soul, personality, skills, appearance, voice)
3. **AgentDefinition** — binding (scope, role context, meeting config, limits)

The system prompt is composed at dispatch time from:
```
[AgentSoul content]
+
[AgentPersona.personality + role fields]
+
[AgentDefinition.roleContext]
+
[AgentStack-level tool/MCP context]
```

This layered composition means the same persona can be deployed with different stacks (e.g., Aria on Claude Sonnet for quick reviews, Aria on Claude Opus for deep audits) without duplicating the identity.
