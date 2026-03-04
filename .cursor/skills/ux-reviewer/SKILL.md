---
name: ux-reviewer
description: Reviews the Ink & Tasks tattoo artist management app for UX quality across accessibility, interaction flows, visual consistency, UX copy, and live browser behaviour. Use when the user asks for a UX review, UX audit, UX check, wants to validate good practices, or asks what can be improved from a user experience perspective.
---

# UX Reviewer — Ink & Tasks v2

Performs a structured UX audit of the Ink & Tasks tattoo artist management app. Covers 5 domains and outputs prioritised findings.

## How to run a review

1. Open a browser-use subagent to test the live app (local or Netlify)
2. Walk through the **Test scenarios** below
3. Evaluate each **Review domain** against the checklist
4. Output a **Findings report** using the template at the end

---

## App context

- Stack: Vue 3 (Composition API) + Vite, Supabase (PostgreSQL + Auth + Storage), Netlify
- Design system: dark Art Nouveau "Ink & Paper" theme with CSS custom properties
- Key views: Kanban Board, Calendar, Consent Forms
- Key flows: add project -> move through pipeline -> book appointment -> sign consent -> done
- Auth: anonymous sign-in -> create account -> sign in -> sign out
- Live URL: https://inkandtasks.netlify.app
- Local: http://localhost:5173 (or nearest available port)

---

## Test scenarios

Run these in the browser-use subagent:

### Kanban Board

1. **Empty board** — load the app, confirm empty state appears with clear call-to-action
2. **Quick-add project** — use the floating "+" button, enter client name + reference photo; confirm card appears in Inbox column
3. **Full project creation** — open detail form, fill all fields (name, email, phone, description, placement, size, style, budget); confirm card renders with reference image and style badge
4. **Drag and drop** — drag a card from Inbox to Awaiting Deposit; confirm status updates and card moves
5. **Move through pipeline** — advance a card through all 5 columns to Done & Healing
6. **Image upload** — upload a reference image via drag-and-drop and via file picker; confirm thumbnail renders on card
7. **Project detail modal** — click a card; confirm all fields display correctly; edit a field and save
8. **Color-coded badges** — create projects with different styles; verify correct badge colours

### Calendar

9. **Empty calendar** — navigate to Calendar view; confirm it loads with current date highlighted
10. **Create tattoo session** — click/drag to create an event, set type to Tattoo Session; confirm it appears in gold
11. **Create drawing block** — create a Drawing Block event; confirm it appears in blue-green
12. **Link to project** — create a tattoo session linked to a Kanban project; confirm client name shows on event
13. **Time-boxing** — create drawing-only and tattoo-only blocks on different days
14. **Day/week/month views** — switch between views; confirm events persist across all three

### Consent Forms

15. **New consent form** — navigate to Consent view; start a new form
16. **Fill form** — complete all fields (client name, DOB, allergies, medical conditions, acknowledgements)
17. **Draw signature** — use the signature pad canvas; confirm stroke appears
18. **Link to project** — select a project; confirm client name auto-fills
19. **Save and view** — submit the form; confirm it appears in the consent list; open it and verify all data

### Auth (unchanged from v1)

20. **Auth bar** — if anonymous session loads, verify "Save your tasks" bar appears
21. **Open auth modal** — click "Sign in" in the header; verify modal opens on Sign in tab
22. **Switch tabs** — click "Create account" tab and toggle link; verify form clears between tabs
23. **Sign in** — enter valid credentials; confirm modal closes, toast appears, header shows email + sign out
24. **Sign out** — click sign out; confirm toast appears, auth bar reappears
25. **Close modal** — press Escape, click outside, click X; all should close

### Cross-cutting

26. **Responsive** — resize to 375px wide; verify all three views hold layout
27. **Toast notifications** — trigger success and error states; verify toasts appear and auto-dismiss
28. **Gamification** — move a card to Done; verify confetti or celebration animation

---

## Review domains

### 1. Accessibility

- [ ] All interactive elements reachable by Tab key in logical order
- [ ] Buttons have descriptive `aria-label` or visible text
- [ ] Form inputs have associated `<label>` elements
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Modal has `role="dialog"`, `aria-modal="true"`, and traps focus
- [ ] Error messages announced to screen readers (`role="alert"` or `aria-live`)
- [ ] Decorative SVGs/images have `aria-hidden="true"`
- [ ] Drag-and-drop cards have keyboard alternative and ARIA drag attributes
- [ ] Calendar events are keyboard-navigable
- [ ] Signature canvas has a keyboard/text alternative for accessibility

### 2. Interaction flows

- [ ] Quick-add: two taps max to create a project (name + photo)
- [ ] Drag-and-drop: smooth, no visual glitch, updates persist to database
- [ ] Project detail: opens on card click, all fields editable, saves on blur or explicit save
- [ ] Calendar: click/drag to create events, type picker appears, saves correctly
- [ ] Consent form: all fields validate, signature captures touch input, form submits and stores
- [ ] Image upload: drag-and-drop and file picker both work, preview shows immediately
- [ ] Auth modal: opens on correct tab, clears between tabs, closes on success
- [ ] Loading states: visible spinner or skeleton during async operations
- [ ] Error states: user-visible feedback on every failure (no silent errors)
- [ ] Double-action guard: rapid clicks don't create duplicate records

### 3. Visual consistency

- [ ] All text uses the three defined fonts (Cinzel Decorative / Cormorant Garamond / DM Sans)
- [ ] All colours are CSS custom properties (no hardcoded hex outside `:root`)
- [ ] Kanban columns have distinct visual identity while maintaining cohesion
- [ ] Style badges use correct colour variants (Traditional=red, Fineline=black, etc.)
- [ ] Cards in Done column are visually de-emphasized
- [ ] Calendar event types use distinct, consistent colours (gold, blue-green, muted)
- [ ] Toasts use correct colour per type (success=green, error=red, info=gold)
- [ ] Navigation clearly indicates the current view
- [ ] Responsive: on mobile (<480px) layout adapts, no horizontal overflow

### 4. UX copy

- [ ] Empty states: on-brand, not generic (per view: board, calendar, consent)
- [ ] Column headers: clear pipeline stage names
- [ ] Button labels: clear verb + noun ("Add Project", "Book Session", "Sign Form")
- [ ] Error messages: friendly, actionable, not raw database errors
- [ ] Toast copy: concise, reassuring, consistent brand tone
- [ ] Form labels: descriptive, with helpful placeholders
- [ ] Confirmation messages: acknowledge user action, explain next step

### 5. Live browser testing (browser-use)

Use the browser-use subagent to:

- Screenshot the Kanban board with cards in multiple columns
- Screenshot the Calendar in week view with mixed event types
- Screenshot a consent form mid-completion with signature
- Screenshot the app at 1280px and 375px widths
- Screenshot the auth modal open state
- Capture any console errors or network failures

---

## Findings report template

```
## UX Audit — Ink & Tasks v2
Date: [date]
Environment: [local / Netlify URL]

### Summary
[1-2 sentence overview]

### Findings

Critical — [count] issues (broken flows, inaccessible, confusing)
Suggestion — [count] issues (friction, inconsistency, unclear copy)
Nice to have — [count] issues (polish, delight, minor improvements)

---

#### [Finding title]
Severity: Critical / Suggestion / Nice to have
Domain: Accessibility / Interaction / Visual / Copy / Browser
View: Board / Calendar / Consent / Auth / Global
Steps to reproduce: [or "N/A — visual issue"]
Observed: [what happens]
Expected: [what should happen]
Suggested fix: [concrete code or copy change]

---

### What's working well
- [positive finding]
- [positive finding]
```
