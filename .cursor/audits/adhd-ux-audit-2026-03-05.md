# ADHD UX Evaluation — Ink & Tasks
**Date:** 2026-03-05

## Summary
Strong ADHD-friendly foundation: 3-item navigation, dark calming palette, sensible defaults, drag-and-drop Kanban, and dopamine rewards. Biggest gaps: **time blindness** (no "how long has this card been here?" cues) and **sensory control** (sounds coupled to system reduced-motion instead of independent toggle).

## Friction Scores

| Flow | Target | Actual | Status |
|------|--------|--------|--------|
| Quick-add project | 2 | 3 | Pass (within tolerance) |
| Move card | 1 | 1 | Pass |
| Book session | 3 | 3 | Pass |
| Open details | 1 | 1 | Pass |
| Start consent | 2 | 2 | Pass |
| Sign out | 1 | 1 | Pass |

## Findings
**Critical — 3 | Suggestion — 6 | Nice to have — 4**

### Critical
1. **No time-since badges on Kanban cards** — ADHD users can't see how long cards have been stagnant
2. **Sound effects cannot be independently toggled** — coupled to prefers-reduced-motion
3. **Done column cards not visually de-emphasized** — completed projects compete equally for attention

### Suggestions
4. Empty states use text instructions instead of direct CTA buttons
5. No overdue/urgency visual treatment on Kanban cards
6. Calendar has no "Next up" highlight
7. Several text sizes fall below 14px
8. No urgency treatment for events approaching in <24h
9. View transitions may reset scroll position

### Nice to have
10. No natural break-point suggestions after productive bursts
11. No proportional reward scaling (full pipeline vs. simple move)
12. No keyboard shortcuts for power users
13. No daily session summary

## What's working well
- 3-item top-level navigation (Board, Calendar, Consent)
- Drag-and-drop + Arrow key card movement
- Dark, warm colour palette — calming for late-night sessions
- Confetti + ascending chime on Done — brand-appropriate dopamine hit
- Streak counter with positive-only messaging
- ProgressRing on column headers for at-a-glance workload
- QuickAdd defaults to Inbox with only client name required
- Reference photo as card thumbnail — highly visual
- Auto-fill behaviours reduce repetitive typing
- FAB buttons make primary action impossible to miss
