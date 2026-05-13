# KonHomeLab Troubleshooting

This file records known failure modes and safe recovery steps.

## Blank Screen After Frontend Deploy

Likely causes:

- Runtime import failure
- Undefined React component
- Malformed JSX
- Stale frontend bundle
- Broken route/sidebar integration
- Browser localStorage edge case in client-only UI state

Immediate actions:

1. Open the browser console.
2. Look for `ReferenceError`, import failures, or syntax errors.
3. Roll back the last frontend change if runtime errors appear.
4. Rebuild and redeploy frontend.

## Runtime Import Failures

Known examples:

- `SettingsForms is not defined`
- `ServiceLinkManager is not defined`

Safe response:

- Do not keep stacking fixes.
- Revert the failing integration.
- Return to the last working commit.
- Reintroduce one component at a time only after validating imports and runtime behavior.

## JSX Quote Or Attribute Corruption

Past issue:

- JSX generated through shell heredocs caused malformed syntax, missing quotes, and broken JSX attributes.

Rule:

- Do not generate JSX through shell heredocs.
- Prefer normal file edits and review diffs before building.

## Build Passes But Runtime Fails

Important lesson:

- `docker compose build frontend` can pass even when the browser fails at runtime.

Required validation:

- Build frontend.
- Deploy frontend if code changed.
- Open dashboard.
- Check browser console.
- Verify the changed feature manually.

## Client-Side Layout State

Current localStorage-backed UI:

- Pinned Services
- Collapsed/expanded sections
- Dashboard view mode
- Operator notes/local annotations
- Trend history samples
- Error Boundary event metadata
- Diagnostics runtime state

If layout state behaves strangely:

1. Test in a private/incognito window.
2. Clear the relevant browser site data if needed.
3. Verify the dashboard still works with empty localStorage.

## Operator Notes

Operator notes are local-only browser annotations. They are not stored on the backend and are not shared across devices.

If notes do not appear or do not persist:

1. Confirm browser site data/localStorage is enabled.
2. Test in a fresh browser profile or private window.
3. Verify the dashboard still renders without notes.
4. Do not store secrets in notes.

## Trend Context

Trend labels are derived from short client-side history. They are hints, not a historical database.

If trend labels look wrong:

1. Refresh once and wait for the next polling cycle.
2. Clear browser site data to reset local trend history.
3. Verify Alert Center, Recent Activity, Health Overview, and Diagnostics still render.

## Diagnostics Panel

Use Diagnostics to inspect safe runtime state:

- backend/API health
- localStorage availability
- selected view mode
- collapsed section count
- pinned services count
- trend history size
- Error Boundary events

If Diagnostics itself fails, check the Error Boundary fallback and browser console first.

## Command Palette

Shortcut:

- Windows/Linux: `Ctrl+K`
- macOS: `Cmd+K`

If it does not open:

- Confirm the page has focus.
- Use the visible `Command Palette` button.
- Check for browser console errors.

## Stale Bundle Or Container Confusion

Symptoms:

- UI does not reflect recent changes.
- Old bug still appears after a build.

Checks:

```bash
docker compose ps
docker compose build frontend
docker compose up -d frontend
```

If needed, confirm the frontend container was recreated and the browser is not showing a cached stale page.

## Safe Rollback

Use git history first:

```bash
git log --oneline -10
git status --short
```

Prefer git commits as the source of truth. Do not keep tracked `.backup` or `.before-*` files as rollback strategy.

Known safe rollback command pattern after a bad frontend runtime deploy:

```bash
git log --oneline -10
git reset --hard <last-known-good-commit>
docker compose up -d --build frontend
```

Only use `git reset --hard` when intentionally rolling back dashboard code.
