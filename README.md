# VERA

**Verification-Driven Engineering & Reliable Agents** — a reusable engineering harness for existing repositories. VERA discovers project scripts, interviews the developer, writes portable project policy and coding-agent instructions, creates task contracts, runs reproducible checks, and records verification evidence.

> **Status: v0.1 foundation.** Copilot and Junie integrations generate instructions and task handoffs; VERA does **not** autonomously invoke those IDE agents yet. Verification, task records, and review controls are implemented locally, but protected CI and human review are needed for strong trust boundaries.

Requires **Node.js 22.12+** and Git.

## Quick start — use VERA in any existing repository

Install the CLI once from this GitHub repository (there is no npm registry release yet):

```sh
npm install --global git+https://github.com/hryndi/VERA.git
vera --help
```

Then, in your **existing** application (not inside the VERA checkout):

```sh
cd path/to/your-existing-project
vera init
vera doctor
vera run "Implement my next feature"
```

`vera init` detects the project and asks about goals, constraints, provider and autonomy. It **previews the proposed files before writing**. After `vera run`, open Copilot or Junie in your IDE and supply the task context printed by `vera context TASK_ID`. VERA does not change application code during initialization.

**Windows PowerShell:** use the same commands; if PowerShell blocks npm's launcher, call `npm.cmd` instead. Git and Node must be on PATH. In corporate networks, configure npm's trusted registry and certificates normally; do not disable TLS verification.

**Prefer a preview first?** Run `vera init --dry-run`. Need additional questions about boundaries and verification? Run `vera init --advanced`.

## Clone-and-install alternative

If you prefer to inspect VERA before installing, clone it once to a tools directory:

```sh
git clone https://github.com/hryndi/VERA.git
cd VERA
npm ci --ignore-scripts
npm test
npm install --global .
```

Then go back to **any** application repository and run `vera init`. You don't need to copy VERA's source tree into each project.

A global installation can also be replaced by running `node /path/to/VERA/bin/vera.js` from a target project. A registry publication has **not** been performed.

## Typical development loop

```sh
vera run "Add keyboard-accessible theme switch"   # returns TASK_ID
vera context TASK_ID                                # read / give context to the coding agent
# Implement and review code changes in your IDE
vera verify TASK_ID                                 # configured build/test/lint checks
vera review TASK_ID --approve                       # human approval only
vera complete TASK_ID                               # reruns checks and validates approval
```

Keep the returned task ID; replace `TASK_ID` literally in the example commands. A task cannot be completed on agent confidence alone. VERA's verification status can be PASS, FAIL, or UNKNOWN. Missing checks are **not** treated as passing.

The CLI never merges PRs, deploys, accesses secrets, or installs dependencies into the target project automatically.

## Configuration & maintenance

```sh
vera status              # inspect effective config and tasks
vera configure           # re-open onboarding and amend config
vera doctor              # validate gates and tools
vera upgrade --dry-run    # preview managed-file updates
vera checkpoint TASK_ID  # store tracked Git patch for manual recovery
```

The project gets `vera.json`, project knowledge and task records in `.vera/`, and a Copilot or Junie instruction file. Existing customized files are protected by conflict checks. VERA does **not** overwrite them silently.

## Documentation

[Getting started](docs/getting-started.md) · [Configuration](docs/configuration.md) · [Architecture](docs/architecture.md) · [Security](docs/security.md) · [Implementation evidence and limitations](docs/implementation-report.md) · [Troubleshooting](docs/troubleshooting.md)

## Contributing and testing this repo

```sh
npm ci --ignore-scripts
npm test
npm pack --dry-run
```

See the [security model](docs/security.md) before enabling broad agent autonomy. Running local scripts is not equivalent to an isolated sandbox.
