---
name: a11y-tester
description: Performs a focused WCAG 2.2 AA accessibility audit of the Ink & Tasks app. Covers keyboard navigation, ARIA attributes, color contrast, motion, forms, and screen reader announcements. Use when building new views, before deployment, or when the user asks about accessibility.
---

# Accessibility Tester — Ink & Tasks

Focused accessibility audit against WCAG 2.2 Level AA. Goes deeper than the general UX reviewer on a11y-specific issues.

## How to run an audit

1. **Static analysis**: read all `.vue` templates, global CSS, and `index.html` for missing attributes
2. **Browser testing**: use a browser-use subagent to Tab through every interactive flow
3. Evaluate against every checklist item below, citing the WCAG criterion
4. Output a **Findings report** using the template at the end

---

## App context

- Stack: Vue 3 SFCs, CSS custom properties, Phosphor Icons
- Design: dark theme (near-black background, gold/cream text, muted secondary)
- Interactive patterns: Kanban drag-and-drop, calendar click/drag, signature canvas, modals, toasts
- Key colour pairs to verify: gold (#c9a84c) on bg (#0f0d0b), cream (#e8dcc8) on surface (#1c1814), muted (#8a7d6b) on surface

---

## Audit domains

### 1. Keyboard navigation (WCAG 2.1.1, 2.1.2, 2.4.3, 2.4.7)

- [ ] Every interactive element reachable via Tab in logical DOM order
- [ ] Visible focus indicator on all focusable elements (outline or box-shadow, not just color change)
- [ ] Focus indicator has 3:1 contrast against adjacent colours (2.4.11)
- [ ] No keyboard traps — Tab always moves forward, Shift+Tab always moves backward
- [ ] Modal focus trap: Tab cycles within modal only; Escape closes it
- [ ] Kanban cards: keyboard alternative to drag-and-drop (e.g., arrow keys or a "Move to..." menu)
- [ ] Calendar events: keyboard-creatable (not drag-only)
- [ ] Skip-to-content link present for keyboard users (or single landmark structure)

### 2. ARIA roles and attributes (WCAG 4.1.2)

- [ ] Kanban columns have `role="list"` or `role="group"` with `aria-label` (e.g., "Inbox column, 3 projects")
- [ ] Kanban cards have `role="listitem"` or `role="article"`
- [ ] Drag-and-drop: `aria-grabbed` (or `aria-roledescription="draggable"`) on cards, `aria-dropeffect` on columns
- [ ] Live region announces card moves: `aria-live="polite"` region updates with "[Client] moved to [Column]"
- [ ] Calendar: events have `role="button"` or are focusable with descriptive `aria-label` (e.g., "Tattoo session with Maria, 2pm to 4pm")
- [ ] Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the title
- [ ] Toasts: container has `aria-live="polite"` and `role="status"`
- [ ] Auth error: `role="alert"` so screen readers announce immediately
- [ ] Icon-only buttons: `aria-label` present (close, delete, complete, drag handle)
- [ ] Signature canvas: `role="img"` with `aria-label` describing purpose, plus a text alternative option

### 3. Color and contrast (WCAG 1.4.3, 1.4.11, 1.4.1)

Check these specific pairs against 4.5:1 (text) and 3:1 (UI components):

- [ ] Body text: cream (#e8dcc8) on bg (#0f0d0b) — expected ~14:1
- [ ] Muted text: muted (#8a7d6b) on surface (#1c1814) — verify >= 4.5:1
- [ ] Gold accent: gold (#c9a84c) on bg (#0f0d0b) — verify >= 4.5:1
- [ ] Button text: bg (#0f0d0b) on gold (#c9a84c) — verify >= 4.5:1
- [ ] Error text: danger-text (#d97070) on surface — verify >= 4.5:1
- [ ] Badge text on badge background: all three priority variants
- [ ] Placeholder text: muted at 0.7 opacity on surface-2 — likely fails, flag it
- [ ] Focus indicator: gold glow against surface — verify 3:1 for non-text UI (1.4.11)
- [ ] Information not conveyed by colour alone (1.4.1): badges have text labels, not just colour; calendar events have type labels, not just colour

### 4. Motion and animation (WCAG 2.3.1, 2.3.3)

- [ ] `@media (prefers-reduced-motion: reduce)` disables: card slide-in, modal fade, toast slide, confetti, drag animations
- [ ] No content flashes more than 3 times per second
- [ ] Sound effects (gamification) are off by default or have an explicit opt-in toggle
- [ ] Auto-dismissing toasts pause on hover (or have a close button) so users have time to read

### 5. Forms and inputs (WCAG 1.3.1, 1.3.5, 3.3.1, 3.3.2)

- [ ] Every `<input>`, `<select>`, `<textarea>` has a `<label>` with matching `for`/`id`
- [ ] Required fields indicated visually AND via `aria-required="true"` or `required` attribute
- [ ] Error messages linked to their input via `aria-describedby`
- [ ] Autocomplete attributes on relevant inputs (`name`, `email`, `tel`, `bday`)
- [ ] Consent form checkboxes: each has a label, grouped in a `<fieldset>` with `<legend>`
- [ ] Signature canvas: clear instructions, a "Clear" button, and a non-canvas fallback (e.g., typed name)

### 6. Screen reader announcements

- [ ] Page/view changes announced (Vue Router title updates or `aria-live` region)
- [ ] Kanban card move: announced via live region
- [ ] Calendar event created/deleted: announced
- [ ] Consent form submitted: success announced
- [ ] Auth state change: sign-in/sign-out announced via toast (already in `aria-live` container)
- [ ] Loading states: `aria-busy="true"` on the loading container

---

## Findings report template

```
## Accessibility Audit — Ink & Tasks
Date: [date]
Standard: WCAG 2.2 Level AA
Environment: [local / Netlify URL]

### Summary
[1-2 sentence overview: pass/fail count]

### Findings

Critical — [count] (blocks access for assistive technology users)
Suggestion — [count] (degrades experience, not a hard blocker)
Nice to have — [count] (best practice, enhances a11y beyond AA)

---

#### [Finding title]
Severity: Critical / Suggestion / Nice to have
WCAG Criterion: [e.g., 1.4.3 Contrast (Minimum)]
View: Board / Calendar / Consent / Auth / Global
Element: [selector or description]
Observed: [what's wrong]
Expected: [what WCAG requires]
Suggested fix: [HTML/CSS/JS change]

---

### Passing checks
- [criterion]: [what's correct]
- [criterion]: [what's correct]
```
