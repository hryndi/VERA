# Implementation report

Validated on Linux with Node 24.22.1 on 19 November 2026.

Implemented a reusable ES module CLI with schema-validated JSON configuration, deterministic package discovery, quick and advanced onboarding, explicit previews, interview save/resume, managed-file manifests, conflict handling, configuration patches, upgrade and removal.

The core includes eight declarative playbooks, persisted task contracts, dependency checks, source fingerprints, protected-file checks, bounded repairs, human review records and independent completion reruns. Verification produces PASS, FAIL or UNKNOWN, enforces timeouts and retains bounded metadata without subprocess output.

The initial implementation uses JavaScript to ship directly on Node without a build step. TypeScript public contracts remain on the roadmap. Discovery prioritizes JavaScript and TypeScript package manifests. Other languages use manually configured commands.

## Executed checks

- All 17 tests passed with zero failures or skips. The unit and integration suite exercises discovery, schema rejection, idempotency, customization preservation, traversal and symlinks, missing executables, failures, timeouts, changed-source detection, protected checks, retry limits, locks, task completion, adapter generation, configuration conflicts and saved interview recovery.
- A temporary project ran init, doctor, verify, repeated init, upgrade and remove.
- The Angular 20 example passed a real production build and strict TypeScript checking through VERA.
- The generic example passed its two behavior tests and completed a persisted task through verification, simulated human review and completion.
- Tarball inspection detected unintended example artifacts. An explicit package allowlist corrected that packaging defect. A fresh installation of the corrected tarball successfully ran vera --help.

## Provider evidence

Microsoft's current VS Code documentation identifies the Copilot repository instruction path. The documentation was inspected from the official Git repository at commit 10b0eb6cf539a15c779cc51d2b4d9aeedede149e. The web documentation route was initially unavailable from this environment. [Official source](https://github.com/microsoft/vscode-docs/blob/main/docs/agent-customization/custom-instructions.md)

JetBrains' official guidelines repository identifies .junie/AGENTS.md and AGENTS.md as supported paths. This corrected the initially assumed legacy path. [Official source](https://github.com/JetBrains/junie-guidelines)

## Limitations

This is a working initial foundation with release-hardening work outstanding. IDE instruction loading and actual Copilot or Junie sessions have not been exercised. Provider adapters generate documented instruction files and manual handoffs. No native orchestration API is claimed.

Windows and macOS CI jobs are provided but have not run here. Windows package-manager entry-point resolution is tested through a platform parameter. Windows descendant-process termination needs further hardening.

Local approvals and evidence depend on trusted callers and local filesystem integrity. Independent enforcement against a malicious same-user agent requires protected CI or OS isolation. Generic gates classify command exit status and cannot detect a test runner that exits zero after running no tests.

Checkpointing provides a tracked patch and HEAD for manual recovery. Automatic rollback, untracked-content backup, structured knowledge proposal workflows and multi-agent scheduling remain future work. Project-level playbook JSON supports local workflow customization.

No package publication, remote Git mutation or production deployment was performed.
