# Themes -- Configuration

The Themes plugin manages four dimensions of your project's identity: sounds, design system, conversational style, and decorative assets. This guide covers reconfiguring any of them.

**Key files**:
- `.a5c/theme/theme.yaml` -- the source of truth for the active theme
- `.a5c/theme/design-system/system.md` -- complete design system specification
- `.claude/settings.json` -- Claude Code hook entries for sound playback
- `CLAUDE.md` -- theme section with conversational style and design system summary

The `.a5c/theme` symlink points to `.a5c/themes/<active-theme>/`. All paths below are relative to the project root unless noted otherwise.

---

## 0. Toggle Integrations

Each theme dimension is independently toggleable. Edit `integrations` in `.a5c/theme/theme.yaml`:

```yaml
integrations:
  conversationalPersonality: true   # Speech patterns in CLAUDE.md
  soundHooks: true                  # Audio on Claude Code events
  designSystem: true                # Design tokens in CLAUDE.md
  decorativeAssets: true            # Icons, dividers, backgrounds
  babysitterHooks: false            # Audio on babysitter events
```

After changing a toggle:
- **Enabling** -- follow the corresponding install.md step to set up that integration (download sounds, generate assets, add CLAUDE.md section, etc.)
- **Disabling** -- remove the corresponding artifacts:
  - `conversationalPersonality`: remove the `### Conversational Style` subsection from CLAUDE.md's theme block
  - `soundHooks`: remove sound hook entries from `.claude/settings.json`
  - `designSystem`: remove the `### Design System` subsection from CLAUDE.md's theme block
  - `decorativeAssets`: remove the `### Theme Assets` subsection from CLAUDE.md's theme block (optionally delete asset files)
  - `babysitterHooks`: remove entries from `.a5c/hooks.json`

---

## 1. Switch Theme

Switch to a different theme entirely. A theme can be anything -- a specific movie, game, art style, mood, era, character, or concept. Each theme has up to four dimensions: sounds, design system (with optional UI framework), conversational personality, and decorative assets.

### If the target theme already exists

If you've previously installed another theme and its directory exists under `.a5c/themes/`:

```bash
# Update symlink to point to existing theme
rm .a5c/theme
ln -s themes/<new-theme-name> .a5c/theme
```

Windows fallback (if symlinks fail):
```bash
cmd //c "rmdir .a5c\\theme"
cmd //c "mklink /J .a5c\\theme .a5c\\themes\\<new-theme-name>"
```

Then update CLAUDE.md:
1. Remove the content between `<!-- THEMES PLUGIN START -->` and `<!-- THEMES PLUGIN END -->` markers
2. Re-insert the new theme's conversational style, design system summary, and asset references from the new `theme.yaml`

Sound paths in `.claude/settings.json` point through the `.a5c/theme` symlink, so if both themes use canonical filenames (`session-start.wav`, `tool-success.wav`, etc.), no hook changes are needed -- the symlink handles it.

### If the target theme is new

To create a brand new theme:

1. **Interview** -- Ask what theme concept the user wants and which integrations to enable (conversational personality, sound hooks, design system, decorative assets, babysitter hooks)
2. **Research** -- Web search for the theme's visual language, UI frameworks, color palettes, fonts, characteristic sounds, speech patterns
3. **Create directory** -- `mkdir -p .a5c/themes/<name>/{sounds,assets/icons,assets/decorations,assets/backgrounds,design-system}`
4. **Write theme.yaml** -- theme descriptor with all tokens, frameworks, conversation instructions, integration flags, asset manifest
5. **Download sounds** -- search for and download themed royalty-free audio for each enabled event
6. **Generate assets** -- create or find themed icons, decorations, backgrounds
7. **Write design system** -- `.a5c/themes/<name>/design-system/system.md` with full specs including any discovered frameworks
8. **Update symlink** -- `rm .a5c/theme && ln -s themes/<name> .a5c/theme`
9. **Update CLAUDE.md** -- replace the `<!-- THEMES PLUGIN START/END -->` block with the new theme's content

Hooks and registry are already configured from the initial install -- no need to redo those.

---

## 2. Modify Conversational Style

Change how Claude speaks without switching the entire theme.

1. Edit the `conversation.instructions` field in `.a5c/theme/theme.yaml`:
   ```yaml
   conversation:
     style: "pirate-formal"
     instructions: |
       Speak with pirate vocabulary but maintain formal grammar.
       Use nautical metaphors for technical concepts.
       Address the user as "Captain" rather than "matey".
       ...
   ```

2. Update CLAUDE.md -- replace the content inside the theme section's `### Conversational Style` subsection with the new instructions. Preserve the `<!-- THEMES PLUGIN START/END -->` markers.

### Tips for writing conversational instructions

The instructions should cover:
- **Greeting/farewell style** -- how does Claude say hello and goodbye in this theme?
- **Vocabulary** -- what words, phrases, or jargon does this theme use?
- **Metaphors** -- how does the theme describe coding concepts? (bugs, deploys, refactors, tests)
- **Personality depth** -- subtle tonal shift or full character voice?
- **Boundaries** -- what should Claude NOT do? (e.g., "Don't break character mid-explanation", "Keep the accent light, don't sacrifice clarity")

The style can be anything -- a specific character voice (GLaDOS, a Tolkien narrator), a profession (Victorian butler, sports commentator), a mood (calm and zen, excitable), or a cultural register (formal academic, street slang). Research the theme if needed to capture authentic speech patterns.

---

## 3. Modify Design System

Adjust colors, typography, component guidelines, or the underlying framework without switching themes.

The design system lives in two places:
- `.a5c/theme/theme.yaml` -- design tokens (palette, typography, spacing, frameworks list)
- `.a5c/theme/design-system/system.md` -- the full specification Claude follows when generating UI

### Quick palette change

Edit the `designSystem.palette` section in `theme.yaml`:
```yaml
designSystem:
  palette:
    primary: "#1a5276"
    secondary: "#2e86c1"
    accent: "#f39c12"
    ...
```

Then update `.a5c/theme/design-system/system.md` to match, and update the Design System summary in CLAUDE.md's theme block.

### Full design system edit

Edit `.a5c/theme/design-system/system.md` directly. This is the authoritative reference. After editing, update the summary in CLAUDE.md's theme section to reflect key changes.

### Change design system depth

If you want to go from "light" to "standard" or "full":

1. Update `designSystem.depth` in `theme.yaml`
2. Expand `.a5c/theme/design-system/system.md` with additional sections:
   - **light -> standard**: Add component library, layout patterns, spacing system
   - **standard -> full**: Add animation guidelines, responsive patterns, accessibility notes, design tokens
3. At **standard** or **full** depth, research and discover themed UI frameworks (see below)

### Discover and integrate themed UI frameworks

The most powerful way to upgrade a design system is to find an existing UI framework, component library, or CSS theme that already embodies your theme's aesthetic. This gives you production-quality components, animations, sounds, and typography instead of hand-rolling everything from color tokens.

#### How to research

1. **Web search** for the theme + "UI framework", "CSS theme", "component library", "design system", "icon pack", "font", "animation library"
2. **Explore** npm, GitHub, CodePen, Dribbble, and Behance for themed UI kits
3. **Check** if the theme has an established visual language (official style guides, fan-made design systems, brand guidelines)
4. **Look for** themed sound libraries or ambient audio packs that could supplement or replace individual sound downloads
5. **Evaluate** what the framework provides vs what needs to be custom-built

#### Discovery examples

**Sci-Fi** -- discover [Arwes](https://arwes.dev/), a futuristic sci-fi UI framework:
- Rich animated components (frames, text, buttons, cards) with built-in sci-fi transitions
- Integrated sound library via Arwes Bleeps (typing, deploying, alerts, notifications) -- can replace or augment the sound hooks entirely
- Custom sci-fi fonts (Titillium Web, Source Code Pro) and glow/pulse effects
- Neon color system with configurable palettes
- Install: `npm install @arwes/react @arwes/animated @arwes/bleeps`
- CLAUDE.md would instruct: "Use Arwes components for all reports, dashboards, and product pages. Use `<Animator>` for entry transitions, `<FrameSVGNefrex>` for panel frames, `<Text>` for animated text reveals. Use Arwes Bleeps for interaction sounds. All content should feel like a starship terminal interface -- immersive, not just color-themed."

**Retro/8-bit gaming** -- discover [NES.css](https://nostalgic-css.github.io/NES.css/):
- Pixel-art styled components (containers, buttons, inputs, progress bars, tables)
- Built-in 8-bit icons (heart, star, coin, trophy, like/dislike)
- Press Start 2P font for pixel-perfect text
- CDN: `<link href="https://unpkg.com/nes.css/css/nes.min.css" rel="stylesheet">`
- CLAUDE.md would say: "Use NES.css classes for all UI elements. Reports should look like NES game screens. Use `nes-container` with `is-rounded`/`is-dark` for panels, `nes-btn is-success` for actions, `nes-progress` for status bars, `nes-icon` for themed indicators."

**Cyberpunk** -- discover [Augmented UI](https://augmented-ui.com/) + glitch libraries:
- CSS-only augmented/clipped panel shapes (angled corners, notches, insets) via HTML attributes
- Combine with neon color palettes and glitch animation libraries
- Monospace fonts like JetBrains Mono or Fira Code with ligatures
- Install: `npm install augmented-ui`
- CLAUDE.md would say: "Use `augmented-ui` attributes on containers for cyberpunk panel shapes. Apply neon glow via box-shadow with cyan/magenta. Use CSS `@keyframes` glitch animations on error states. Scanline overlays on backgrounds."

**Japanese ink / Ukiyo-e** -- build from traditional asset resources:
- Search for royalty-free Ukiyo-e wave patterns, cloud motifs, and brush stroke SVGs
- Google Fonts: Noto Serif JP, Zen Antique, Shippori Mincho
- Muted indigo/vermilion/cream palette extracted from classic woodblock prints
- [Rough.js](https://roughjs.com/) for hand-drawn SVG elements that feel organic
- CLAUDE.md would say: "Use vertical rhythm inspired by Japanese typography. Cards have subtle ink wash backgrounds. Dividers use wave or cloud brush stroke SVGs. Animations should be gentle and flowing, like ink spreading on paper."

**Tolkien / Middle-earth** -- discover Tengwar fonts + medieval CSS patterns:
- Tengwar Annatar or similar Elvish fonts for decorative headers
- Cinzel, MedievalSharp, or IM Fell English for readable text
- Illuminated manuscript drop caps (CSS `::first-letter` with gold/ornate styling)
- Parchment textures, vine border SVGs, wax seal icons
- CLAUDE.md would say: "Use illuminated drop caps on report sections. Headers in Cinzel with subtle gold text-shadow. Panels have parchment background textures. Decorative borders use vine/knotwork SVG patterns."

**Lo-fi / cozy** -- discover aesthetic resources and sketch libraries:
- Pastel palettes from [Happy Hues](https://www.happyhues.co) or [coolors.co](https://coolors.co)
- Rounded friendly fonts: Nunito, Quicksand, Comic Neue
- Subtle CSS grain/noise overlays for analog warmth
- [Rough Notation](https://roughnotation.com/) for hand-drawn highlights and underlines
- CLAUDE.md would say: "All UI should feel warm and hand-crafted. Rounded corners (12px+), soft shadows, pastel colors. Apply subtle CSS noise overlays on backgrounds. Use Rough Notation for annotations."

#### Recording discoveries in theme.yaml

Add each discovered framework to the `designSystem.frameworks` array:
```yaml
designSystem:
  frameworks:
    - name: "Arwes"
      url: "https://arwes.dev/"
      install: "npm install @arwes/react @arwes/animated @arwes/bleeps"
      provides: "Sci-fi animated components, sound library (Bleeps), glow effects, neon palette"
    - name: "Titillium Web"
      url: "https://fonts.google.com/specimen/Titillium+Web"
      install: "@import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&display=swap')"
      provides: "Sci-fi heading and body font"
```

#### Updating CLAUDE.md for immersive UI

After discovering frameworks, update the `### Design System` section in CLAUDE.md to instruct Claude to build **immersive, themed experiences** -- not just apply colors to generic components. The instructions should tell Claude:

- Which framework(s) to import and how
- How to use the framework's components, classes, or attributes
- What the UI should *feel like* experientially (not just what colors to use)
- When to use framework animations, transitions, and sound features
- How to style reports, dashboards, product pages, and documentation immersively
- What ambient effects are appropriate (particles, grain, glow, scan lines, etc.)

Example CLAUDE.md design system instruction (sci-fi with Arwes):
```
When building UI for this project, create immersive sci-fi interfaces using the Arwes framework.
Reports should feel like starship terminal readouts. Dashboards should pulse with animated frames.
Use Arwes Bleeps for interaction sounds. All text should render with the Arwes text animation.
Product pages should immerse the user in the theme -- not just use sci-fi colors, but feel like
an actual futuristic interface. Refer to .a5c/theme/design-system/system.md for full specs.
```

---

## 4. Manage Sound Events

Sound hooks are Claude Code hooks configured in `.claude/settings.json` that play audio files from `.a5c/theme/sounds/` via the play script at `.claude/sound-hooks/scripts/play.sh`.

### Available events

| Event | What It Does | Default |
|---|---|---|
| `SessionStart` | Plays when a new Claude Code session begins | enabled |
| `Stop` | Plays when Claude finishes responding | enabled |
| `PostToolUse` | Plays after every successful tool call | enabled (per-tool) |
| `PostToolUseFailure` | Plays when a tool call fails | enabled |
| `Notification` | Plays on Claude Code notifications (rate limit, permission) | enabled |
| `UserPromptSubmit` | Plays when user sends a message | disabled |

### Toggle events on/off

Update two places:

1. In `theme.yaml`, set the event's `enabled` field:
   ```yaml
   soundConfig:
     events:
       PostToolUse: { enabled: false }
   ```

2. In `.claude/settings.json`, add or remove the corresponding hook entry. Each hook entry looks like:
   ```json
   {
     "matcher": "",
     "hooks": [{
       "type": "command",
       "command": "bash .claude/sound-hooks/scripts/play.sh .a5c/theme/sounds/<sound-file>.wav"
     }]
   }
   ```

### Enable/disable per-tool sounds

Per-tool differentiation gives different sounds per tool group -- so you can *hear* what Claude is doing (reading, editing, searching, etc.) without looking at the screen.

**Enable per-tool**: Replace the single `PostToolUse` entry with individual matchers per tool group:

```json
"PostToolUse": [
  { "matcher": "^Read$",                "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .a5c/theme/sounds/tool-read.wav" }] },
  { "matcher": "^(Edit|Write)$",        "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .a5c/theme/sounds/tool-edit.wav" }] },
  { "matcher": "^Bash$",                "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .a5c/theme/sounds/tool-bash.wav" }] },
  { "matcher": "^(Grep|Glob)$",         "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .a5c/theme/sounds/tool-search.wav" }] },
  { "matcher": "^Agent$",               "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .a5c/theme/sounds/tool-agent.wav" }] },
  { "matcher": "^(WebSearch|WebFetch)$", "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .a5c/theme/sounds/tool-web.wav" }] },
  { "matcher": "^(?!Read$|Edit$|Write$|Bash$|Grep$|Glob$|Agent$|WebSearch$|WebFetch$)", "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .a5c/theme/sounds/tool-success.wav" }] }
]
```

**Disable per-tool**: Replace all per-tool entries with a single `".*"` matcher:
```json
"PostToolUse": [
  { "matcher": ".*", "hooks": [{ "type": "command", "command": "bash .claude/sound-hooks/scripts/play.sh .a5c/theme/sounds/tool-success.wav" }] }
]
```

Update `theme.yaml` accordingly:
```yaml
soundConfig:
  events:
    PostToolUse: { enabled: true, perTool: true }   # or false
```

### Matcher double-firing gotcha

Claude Code fires hooks for **every** matcher that matches. If you have both `"^Read$"` and `".*"`, both fire on a Read call -- two sounds play simultaneously. The fallback entry must use a negative lookahead excluding all explicitly-mapped tools:
```
^(?!Read$|Edit$|Write$|Bash$|Grep$|Glob$|Agent$|WebSearch$|WebFetch$)
```
Update this whenever you add or remove per-tool entries.

---

## 5. Replace Individual Sounds

Sound files live in `.a5c/theme/sounds/` with canonical names:
```
session-start.wav    stop.wav           tool-success.wav
tool-failure.wav     notification.wav   user-prompt.wav
tool-read.wav        tool-edit.wav      tool-bash.wav
tool-search.wav      tool-agent.wav     tool-web.wav
```

To replace a sound:

1. Find or download a new royalty-free sound. Good sources ranked by agent-friendliness:
   - **[SoundBible](https://soundbible.com/)** -- direct curl download, agent-friendly
   - **[Orange Free Sounds](https://orangefreesounds.com/)** -- direct download URLs, CC BY-NC 4.0
   - **[Mixkit](https://mixkit.co/free-sound-effects/)** -- high quality, royalty-free (may need Playwright for download)
   - **[Pixabay Sound Effects](https://pixabay.com/sound-effects/)** -- CC0 (may need Playwright)
   - **[Freesound.org](https://freesound.org/)** -- huge library (requires login)
2. Save to `.a5c/theme/sounds/<canonical-name>.wav`, replacing the existing file
3. If you kept the same filename, no config changes needed
4. If using a different filename, update `theme.yaml` asset entries and the hook `command` in `.claude/settings.json`
5. Keep sounds short (under 5 seconds) -- long clips overlap with subsequent events

---

## 6. Change Sound Theme Without Changing Other Dimensions

Want different sounds without changing the rest of the theme?

1. Download new sounds to the current theme's `sounds/` directory, replacing existing files
2. Update `theme.yaml` sound asset entries if filenames changed
3. No need to touch CLAUDE.md, design system, or decorative assets

---

## 7. Manage Decorative Assets

### Add new assets

Place files in the appropriate subdirectory:
- Icons: `.a5c/theme/assets/icons/`
- Decorations: `.a5c/theme/assets/decorations/`
- Backgrounds: `.a5c/theme/assets/backgrounds/`

Update the `assets` section in `theme.yaml` to list new files.

### Replace assets

Drop replacements in the same directory with the same filename. No config changes needed.

### Reference assets in output

When generating styled output, Claude should reference assets via the `.a5c/theme/` symlink path:
```html
<img src=".a5c/theme/assets/icons/success.svg" alt="Success">
<hr style="background-image: url('.a5c/theme/assets/decorations/divider.svg')">
```

---

## 8. Manage Multiple Themes

The `.a5c/themes/` directory can hold multiple themes. Only one is active (pointed to by `.a5c/theme`).

### List available themes

```bash
ls .a5c/themes/
```

### Preview a theme

```bash
cat .a5c/themes/<name>/theme.yaml
```

### Delete a theme

```bash
# Make sure it's not the active theme first
readlink .a5c/theme
# If it points to the theme you want to delete, switch first
rm -rf .a5c/themes/<name>
```

---

## 9. Temporarily Disable Theme Effects

### Disable sounds only

Remove all theme sound hook entries from `.claude/settings.json`. Re-add them to re-enable (see install.md Step 10).

### Disable conversational style only

Remove or comment out the conversational style section between the theme markers in CLAUDE.md. The markers remain for easy re-insertion.

### Disable everything

Remove the entire `<!-- THEMES PLUGIN START -->` to `<!-- THEMES PLUGIN END -->` block from CLAUDE.md and remove sound hooks from `.claude/settings.json`. The theme files remain in `.a5c/themes/` for re-activation later.

---

## 10. Export/Import Themes

### Export a theme for sharing

```bash
cd .a5c/themes
tar czf <name>-theme.tar.gz <name>/
```

### Import a shared theme

```bash
cd .a5c/themes
tar xzf <name>-theme.tar.gz
# Then switch to it (from project root)
cd ../..
rm .a5c/theme 2>/dev/null
ln -s themes/<name> .a5c/theme
```

---

## Configuration Reference

### theme.yaml structure

| Section | Purpose |
|---|---|
| `name`, `version`, `description` | Theme identity |
| `integrations.*` | Which dimensions are active (all optional booleans) |
| `conversation.style` | Brief style label |
| `conversation.instructions` | Full conversational instructions for CLAUDE.md |
| `designSystem.depth` | light / standard / full |
| `designSystem.frameworks` | Discovered UI frameworks, libraries, and resources |
| `designSystem.palette` | Color tokens |
| `designSystem.typography` | Font families and scale |
| `designSystem.borders` | Border aesthetic |
| `designSystem.spacing` | Spacing scale |
| `designSystem.animations` | Animation style |
| `designSystem.notes` | Additional guidelines |
| `assets.sounds` | Sound file paths (relative to theme root) |
| `assets.icons` | Icon file paths |
| `assets.decorations` | Decoration file paths |
| `assets.backgrounds` | Background file paths |
| `assets.designSystemFile` | Path to full design system doc |
| `soundConfig.events` | Which events are enabled and per-tool setting |
