---
name: ui-consistency-review
description: Audit the Angular UI from a customer perspective - copy, naming, badges, dialogs, toasts, empty states. Use when the user asks for a UI review, consistency check, or before shipping UI-heavy work.
---

# UI Consistency Review

Standards: `learnersight-netzero-gateway-ui/docs/frontend.md` (load it first).
Review only user-visible text/behavior, not code quality.

## Sweep (grep the templates + ts for these)

- `mat-label`, `placeholder=`, `matTooltip`, `mat-hint`, `header:`, `label:`,
  `emptyTitle`, `notify.`, `confirm({`, `<h2`/`<h3`, dialog titles.

## Check-list (each violation = one finding)

1. **No developer jargon**: config, async, dispatch, payload, enum names. Raw values
   like `WP_Text`/`SuperAdmin` must go through `channelName` pipe / role label.
2. **No em dashes** anywhere in UI copy (commas, parentheses, periods instead).
3. **Badges**: status-like values use `app-status-badge` (Active/Inactive, Yes/No) —
   never ad-hoc `mat-chip`; chips reserved for lists (channels).
4. **Toggles not checkboxes**; toggles live in form dialogs, badges in tables.
5. **Dialogs only** (no drawers): view 880px + Close; form 480px + Cancel/Save;
   async-content dialogs need `autoFocus: 'dialog'`.
6. **Casing**: Title Case for labels/menu/buttons/column headers; sentence case for
   hints, toasts, empty states.
7. **Toasts**: errors say what to do next ("Activate another configuration first…"),
   never blame internals ("Rejected by the gateway").
8. **Empty states**: friendly title + actionable hint; "yet" softens ("No messages yet").
9. **Deletes** warn "This cannot be undone."
10. **Phones**: examples digits-only with country code (8801700000001), never `+88`.
11. **Menu names match page titles match route titles** (ROUTE_TITLES in main-layout).

## Output format

Table per page: Current text | Suggested text | Reason (one sentence). Only report
findings; if asked to fix, apply then run `npx ng build`.
