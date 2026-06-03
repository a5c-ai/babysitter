https://kradle-staging.a5c.ai/api/orgs/default/policy-reports shows: Kyverno CRDs are not installed or are not readable by the Kradle service account - helm should install everything needed.

❯ refactor the C:\Users\tmusk\IdeaProjects\babysitter\packages\kradle\web to 3 packages , kradle\sdk, kradle\web and kradle\cli (web and cli
  should depend on sdk), the sdk is the client sdk. the cli should have a command to run itself as an mcp server.