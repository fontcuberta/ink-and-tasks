---
name: vue-reviewer
description: Reviews Vue 3 component quality, Composition API patterns, reactivity correctness, composable design, performance, state management, error handling, and style isolation. Use when creating new components, refactoring existing ones, before deployment, or when the user asks for a code review.
---

# Vue Code Reviewer — Ink & Tasks

Reviews Vue 3 component quality and Composition API patterns. Ensures the codebase stays clean and consistent as it grows.

## How to run a review

1. Glob all `.vue` files in the project
2. Read each file and evaluate against the checklist below
3. Read all composables (`src/composables/use*.js` or `use*.ts`)
4. Check cross-component patterns (prop drilling, state duplication)
5. Output a **Findings report** using the template at the end

---

## App context

- Framework: Vue 3 with `<script setup>` syntax
- Build: Vite with `@vitejs/plugin-vue`
- Routing: `vue-router` v4
- Backend: Supabase client (`@supabase/supabase-js`)
- Drag-and-drop: `vuedraggable` (wraps SortableJS)
- Calendar: `@fullcalendar/vue3`
- State: composables, no Pinia/Vuex (intentional — keep it simple)

---

## Review domains

### 1. Component structure

- [ ] Every component uses `<script setup>` (not Options API or bare `<script>`)
- [ ] SFC order: `<script setup>` -> `<template>` -> `<style scoped>`
- [ ] Props defined with `defineProps()` and typed (e.g., `defineProps<{ title: string }>()` or `defineProps({ title: { type: String, required: true } })`)
- [ ] Emits declared with `defineEmits()` and typed
- [ ] No component exceeds 200 lines — extract subcomponents or composables if larger
- [ ] File name matches component name in PascalCase (e.g., `KanbanCard.vue`)
- [ ] Template has a single root element (or uses `<template>` fragments intentionally)

### 2. Reactivity

- [ ] `ref()` used for primitives (`string`, `number`, `boolean`)
- [ ] `reactive()` used for objects/arrays only when the whole object is the reactive unit
- [ ] No direct mutation of props — emit an event or use a local copy
- [ ] Derived state uses `computed()`, not methods or inline expressions in template
- [ ] `watch()` has explicit dependencies, not deep-watching large objects unnecessarily
- [ ] `watchEffect()` used only when all reactive dependencies should be tracked automatically
- [ ] `toRefs()` or `toRef()` used when destructuring reactive objects to preserve reactivity
- [ ] No `.value` accessed inside `<template>` (Vue auto-unwraps refs in templates)

### 3. Composables

- [ ] Shared logic extracted into `use*` functions in `src/composables/`
- [ ] Supabase CRUD operations live in composables, not directly in components
- [ ] Each composable returns a clearly typed object: `{ data, loading, error, fetchFn }`
- [ ] Cleanup done in `onUnmounted()` (unsubscribe realtime, remove event listeners)
- [ ] Auth state in `useAuth()` composable (single source of truth)
- [ ] Board state in `useProjects()` composable (single source of truth for Kanban)
- [ ] Calendar state in `useCalendar()` composable
- [ ] Composables are stateless by default (create reactive state inside, don't import module-level globals)

### 4. Performance

- [ ] `v-for` always has a unique `:key` (use `id`, not `index`)
- [ ] Large lists use virtual scrolling if >50 items (optional for MVP)
- [ ] Expensive computations in `computed()`, not recalculated every render
- [ ] Images use `loading="lazy"` attribute
- [ ] Components that don't need reactivity use `v-once` where appropriate
- [ ] No unnecessary re-renders: check if parent state changes trigger child re-renders without reason
- [ ] `defineAsyncComponent()` used for heavy components not needed on first render (e.g., consent form)

### 5. State management

- [ ] Auth state lives in `useAuth()` — no duplication across components
- [ ] Kanban board state (projects, column order) centralized in one composable
- [ ] No prop drilling beyond 2 levels — use `provide`/`inject` or composables instead
- [ ] Route params used for view-level state (which view is active), not reactive variables
- [ ] Optimistic UI updates where safe (move card immediately, sync to DB in background)

### 6. Error handling

- [ ] Every `async` function has `try/catch`
- [ ] Every Supabase call checks the `error` return value
- [ ] Errors surface as user-visible feedback (toast, inline message)
- [ ] Loading states: `ref(false)` toggled to `true` during async ops, template shows spinner/skeleton
- [ ] Loading states are in composables, exposed to components (not duplicated per component)
- [ ] Network failures handled gracefully (retry button or automatic retry with backoff)

### 7. Style isolation

- [ ] Every component has `<style scoped>` (no unscoped styles leaking)
- [ ] Global styles live only in `src/style.css` (design tokens, reset, base)
- [ ] No inline `style` attributes in templates (use classes or CSS variables)
- [ ] Design tokens consumed via `var(--token-name)`, not hardcoded values
- [ ] No `!important` unless overriding a third-party library (FullCalendar, SortableJS)
- [ ] Component-specific colours defined as local CSS variables if they don't belong in the global token set

---

## Findings report template

```
## Vue Code Review — Ink & Tasks
Date: [date]
Files reviewed: [count] .vue files, [count] composables

### Summary
[1-2 sentence overview]

### Findings

Critical — [count] (reactivity bugs, missing error handling, data loss risk)
Suggestion — [count] (pattern violations, performance, style leaks)
Nice to have — [count] (naming, structure, minor refactors)

---

#### [Finding title]
Severity: Critical / Suggestion / Nice to have
Domain: Structure / Reactivity / Composables / Performance / State / Errors / Style
File: [path]
Line: [line number or range]
Observed: [what's wrong]
Expected: [the correct pattern]
Suggested fix: [code snippet]

---

### What's clean
- [positive finding]
- [positive finding]
```
