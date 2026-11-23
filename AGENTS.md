# Contributing to VERA

VERA is an installable engineering harness, not a starter application. Never add example applications, sample projects, or artifacts that users have to remove after cloning.

Read README.md and docs/security.md before changing policy, verification or state transitions.
Preserve PASS/FAIL/UNKNOWN, human-only approval, source revision checks and protected-file enforcement.
Keep the provider-neutral task engine independent of Copilot/Junie adapters.
Run npm ci --ignore-scripts, npm test and npm pack --dry-run for changes.
Never publish, deploy or alter remote branches without explicit authorization.
