---
name: ux-reviewer
description: Reviews the Ink & Tasks app for UX quality across accessibility, interaction flows, visual consistency, UX copy, and live browser behaviour. Use when the user asks for a UX review, UX audit, UX check, wants to validate good practices, or asks what can be improved from a user experience perspective.
---

# UX Reviewer — Ink & Tasks

Performs a structured UX audit of the Ink & Tasks todo app. Covers 5 domains and outputs prioritised findings.

## How to run a review

1. Open a browser-use subagent to test the live app (local or Netlify)
2. Walk through the **Test scenarios** below
3. Evaluate each **Review domain** against the checklist
4. Output a **Findings report** using the template at the end

---

## App context

- Stack: Vite (vanilla JS), Supabase, Netlify
- Design system: dark Art Nouveau "Ink & Paper" theme
- Key flows: add task → complete → delete | anonymous sign-in → create account → sign in → sign out
- Live URL: https://inkandtasks.netlify.app
- Local: http://localhost:5173 (or nearest available port)

---

## Test scenarios

Run these in the browser-use subagent:

1. **Empty state** — load the app, confirm empty state illustration and copy appear
2. **Add task** — fill in text only, submit; then fill all fields (text + due date + priority + notes), submit
3. **Complete task** — click the checkbox on a task; verify visual change
4. **Delete task** — click the trash icon; verify removal
5. **Overdue task** — add a task with a past due date; verify overdue badge appears
6. **Auth bar** — if anonymous session loads, verify "Save your tasks" bar appears
7. **Open auth modal** — click "Sign in" in the header; verify modal opens on Sign in tab
8. **Switch tabs** — click "Create account" tab and toggle link; verify form clears between tabs
9. **Sign in error** — submit invalid credentials; verify friendly error message
10. **Close modal** — press Escape, click outside, click X; all should close
11. **Responsive** — resize to 375px wide; verify layout holds
12. **Toast** — trigger a sign-out; verify toast appears and auto-dismisses

---

## Review domains

### 1. Accessibility

- [ ] All interactive elements are reachable by Tab key in logical order
- [ ] Buttons have descriptive `aria-label` or visible text (not icon-only without label)
- [ ] Form inputs have associated `<label>` elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI components) — gold on dark bg
- [ ] Modal has `role="dialog"` and `aria-modal="true"` (already set — verify it traps focus)
- [ ] Error messages are announced to screen readers (`aria-live` or `role="alert"`)
- [ ] Empty state is not announced as an error
- [ ] Images/SVGs that are decorative have `aria-hidden="true"`

### 2. Interaction flows

- [ ] Add form: submitting empty text does not add a task; input receives focus
- [ ] Add form: resets after successful submission
- [ ] Add form: submit button disables during async call to prevent double-submit
- [ ] Task complete: immediate visual feedback (no lag)
- [ ] Task delete: no confirmation dialog (fast) — acceptable for low-stakes action
- [ ] Auth modal: opens on correct tab depending on entry point (header → Sign in, auth bar → Create account)
- [ ] Auth modal: switching tabs clears both fields and error message
- [ ] Auth modal: "Please wait…" state on submit button during async call
- [ ] Auth modal: closes automatically on successful sign-in (via onAuthStateChange)
- [ ] Sign-out: returns to anonymous session, auth bar reappears, tasks clear
- [ ] Toast: appears for key events (sign-in, sign-out, sign-up confirmation)
- [ ] Toast: auto-dismisses; does not block interaction while visible
- [ ] Overdue badge: only appears on incomplete tasks

### 3. Visual consistency

- [ ] All text uses the three defined fonts (Cinzel Decorative / Cormorant Garamond / DM Sans)
- [ ] All colours are CSS custom properties (no hardcoded hex values outside `:root`)
- [ ] Task cards have consistent left gold border
- [ ] Priority badges use correct colour variants (high=red, medium=gold, low=green)
- [ ] Completed tasks are visually distinct (strikethrough + reduced opacity)
- [ ] Auth modal border-top is gold accent
- [ ] Toasts use correct colour variant per type (success=green, error=red, info=gold)
- [ ] Header ornaments are decorative and do not compete with the title at any viewport
- [ ] Responsive: on mobile (<480px) ornaments hide, form stacks correctly, toasts go full-width

### 4. UX copy

- [ ] Empty state: *"Your canvas is empty."* — on-brand, not generic "No items"
- [ ] Add button: "Add Task" — clear verb + noun
- [ ] Complete aria-label: *"Mark complete"* / *"Mark incomplete"* — contextual
- [ ] Delete aria-label: *"Delete task"* — clear
- [ ] Auth bar: *"Your tasks are temporary — save them to your account"* — explains consequence
- [ ] Auth modal subtitle changes per tab (sign-up vs sign-in context)
- [ ] Toggle link updates contextually: *"Already have an account? Sign in"* / *"Don't have an account? Create one"*
- [ ] Error messages: friendly and actionable (not raw Supabase errors)
- [ ] Toast copy: concise, reassuring tone consistent with brand
- [ ] Priority badge labels: lowercase (high / medium / low) — consistent with badge design

### 5. Live browser testing (browser-use)

Use the browser-use subagent to:

- Screenshot the app at 1280px and 375px widths
- Screenshot the auth modal open state
- Screenshot a populated task list with mixed priorities and one overdue task
- Screenshot the toast in its visible state
- Capture any console errors or network failures

---

## Findings report template

```
## UX Audit — Ink & Tasks
Date: [date]
Environment: [local / Netlify URL]

### Summary
[1–2 sentence overview]

### Findings

🔴 Critical — [count] issues (broken flows, inaccessible, confusing)
🟡 Suggestion — [count] issues (friction, inconsistency, unclear copy)
🟢 Nice to have — [count] issues (polish, delight, minor improvements)

---

#### [Finding title]
Severity: 🔴 / 🟡 / 🟢
Domain: Accessibility / Interaction / Visual / Copy / Browser
Steps to reproduce: [or "N/A — visual issue"]
Observed: [what happens]
Expected: [what should happen]
Suggested fix: [concrete code or copy change]

---

### What's working well
- [positive finding]
- [positive finding]
```

---

## Quick checks (run without browser)

Read the source files and check:

- `index.html` — all `<input>` have `id` + matching `<label for="">` and `autocomplete`
- `index.html` — all icon-only buttons have `aria-label`
- `src/style.css` — no hardcoded colours outside `:root`
- `src/main.js` — all error paths surface a user-visible message (no silent failures)
- `src/main.js` — `escapeHtml()` is called on all user-generated content before innerHTML
