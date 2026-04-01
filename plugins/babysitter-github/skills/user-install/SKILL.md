---
name: user-install
description: Install the user-level Babysitter GitHub Copilot CLI setup.
---

# user-install

Load and use the installed `babysit` skill.

Resolve the request in `user-install` mode:

- treat everything after `$user-install` as the user-setup request
- focus on user profile, user-level install, and personal defaults
- do not create a separate command surface here; this skill only forwards into
  `babysit`
