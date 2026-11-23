# VERA v0.2 implementation notes

VERA v0.2 is a clean, project-installable CLI harness. The repository intentionally contains **no example applications**. The release is designed for one-time cloning and installation, followed by configuring existing repositories in place.

## New workflow

- Existing project discovery and guided interview for goals, architecture, scope, constraints, acceptance standards, agent provider and autonomy.
- Provider-independent project brief at `.vera/project.md` and project knowledge at `.vera/knowledge.md`.
- Copilot project instructions, custom agent and reusable skill, plus Junie guidelines when selected.
- `vera start "task"` creates a tracked task record, active task pointer and detailed handoff for IDE agents.
- Default acceptance criteria flow from onboarding into new tasks.
- Existing verification and approval lifecycle uses PASS, FAIL and UNKNOWN, revision freshness and human review.
- Explicit file allowlist for packaged distribution; no demos or example projects.

## Verification

The prior core already contained 17 automated regression tests. v0.2 extends the suite for new adapters, task handoffs and clean package metadata. The workflow in `.github/workflows/ci.yml` runs Node's test runner and package inspection across Ubuntu, Windows and macOS with Node 22 and Node 24.

Run `npm ci --ignore-scripts && npm test && npm pack --dry-run` to verify any checkout. A zero-test result from a project-specific test script cannot be detected by a generic exit-code-only verifier.

## Scope and limitations

The CLI writes generated project configuration and assists with IDE handoff. It does **not** start native Copilot or Junie agents through an API, automatically schedule subagents, or enforce an OS sandbox.

Verification evidence and review records are local filesystem data. Use independently controlled CI, access boundaries and branch protection before treating them as security evidence. VERA does not automatically merge, deploy or run remote Git operations.
