# KonHomeLab Troubleshooting

This file records known failure modes and safe recovery steps.

## Blank Screen After Frontend Deploy

Likely causes:

- Runtime import failure
- Undefined React component
- Malformed JSX
- Stale frontend bundle
- Broken route or sidebar integration

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
- Deploy frontend.
- Open dashboard.
- Check browser console.
- Verify the changed feature manually.

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

Also inspect `.before-*` backup files when they exist, but prefer git commits as the source of truth.
