# Vue Code Review — Ink & Tasks
**Date:** 2026-03-05 | **Files reviewed:** 12 .vue files, 7 composables

## Summary
Well-structured codebase: every component uses `<script setup>`, Supabase logic centralized in composables, reactivity correct, style isolation consistent. Main risks: **silent loading deadlocks** when Supabase calls fail, **unchecked error paths** in image management, and a **runtime error** from `window.print()` in template.

## Findings
**Critical — 6 | Suggestion — 10 | Nice to have — 4**

### Critical
1. **`loading` stays `true` forever on error** — useProjects, useCalendar, useConsent never reset loading on error path
2. **`window.print()` runtime error** — inaccessible in Vue template render proxy
3. **ProjectModal image operations — zero error handling** — deleteImage/setPrimary don't check errors
4. **useAuth `signOut()` — no error handling** — user can be left sessionless
5. **AuthModal `initialTab` never synced on re-open** — stale tab shown
6. **useAuth `onAuthStateChange` listener never unsubscribed** — resource leak

### Suggestions
7. Direct Supabase calls in components — image CRUD not in composable
8. `getImageUrl()` duplicated across components
9. Event-type color mapping duplicated in two files
10. ConsentView exceeds 200 lines (571 lines)
11. ProjectModal exceeds 200 lines (544 lines)
12. KanbanBoard exceeds 200 lines (402 lines)
13. Inline `style` attributes in templates
14. `primaryImage()` called twice per card render
15. App.vue `handleSignOut()` has no try/catch
16. ProjectModal `uploadImage` — DB insert not error-checked

### Nice to have
17. Props loosely typed — missing `required` and validators
18. `v-for :key` uses index for acknowledgements
19. Signature image missing `loading="lazy"`
20. Hardcoded hex colors should use CSS custom properties

## What's clean
- Consistent `<script setup>` + SFC order across all components
- Singleton composables as intentional alternative to Pinia
- Reactivity correct: ref/reactive/computed used properly
- `<style scoped>` on every component, `:deep()` used correctly
- Design tokens used consistently via var(--color-*) and var(--font-*)
- Accessibility above average: aria-label, focus traps, keyboard nav
- Images consistently use loading="lazy"
- ProgressRing is a textbook presentational component
