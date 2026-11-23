# VERA

**VERA — Verification-Driven Engineering & Reliable Agents**

A clean, reusable AI engineering harness for existing codebases. **No sample apps, placeholder projects, or example assets to delete.**

VERA asks about your software's goals and constraints, discovers existing verification commands, installs IDE-specific agent instructions, and creates actionable task handoffs. You keep using your existing project and tools.

> **v0.2 — harness-first release.** It generates Copilot/Junie instructions and prepares tasks for IDE agents. It does **not** silently run a coding agent, deploy code, or bypass human review.

## Clone → configure → work

Requires Node.js 22.12+ and Git.

### 1. Clone VERA once and install the CLI

```sh
git clone https://github.com/hryndi/VERA.git
cd VERA
npm install --global .
```

Install VERA **outside** your application repositories. You do not need to copy it into each project.

### 2. Initialize any existing project

```sh
cd /path/to/your-existing-project
vera init
vera doctor
```

The guided interview covers project goals, current architecture, allowed scope, constraints, acceptance standards, AI provider, and autonomy. VERA discovers and proposes build/test/lint commands. It previews changes before creating files.

### 3. Start your first AI development task

```sh
vera start "Implement the approved feature"
```

VERA creates a task contract at `.vera/ACTIVE_TASK.md` and a detailed handoff. Open Copilot or Junie in your IDE and tell it:

> Implement the task described in .vera/ACTIVE_TASK.md following VERA.

The agent reads the project contract, plans, and implements within the approved boundaries. You stay in control of acceptance and review.

### 4. Verify and complete

```sh
vera verify TASK_ID
vera review TASK_ID --approve
vera complete TASK_ID
```

Only run the approval command yourself after inspecting the changes. Completion reruns configured checks; FAIL or UNKNOWN is never treated as success.

## What gets installed?

VERA only adds the **small integration layer** to your existing project:

```text
existing-project/
├── (all original files untouched)
├── vera.json
├── .vera/
│   ├── project.md
│   ├── knowledge.md
│   ├── playbooks.json
│   ├── ACTIVE_TASK.md           # created by vera start
│   ├── handoffs/
│   ├── tasks/
│   └── evidence/
├── .github/
│   ├── copilot-instructions.md
│   ├── agents/vera.agent.md
│   └── skills/vera-workflow/SKILL.md
└── .junie/
    └── AGENTS.md
```

Copilot and Junie adapter files are generated **only when selected**. You can select either one, both, or neither. Existing customized files are guarded by conflict detection; VERA does not silently replace them.

No example application is installed in your project or stored in the VERA repository.

## Daily use

| Command | Purpose |
|---|---|
| `vera init` | Interview, discover project and configure VERA |
| `vera init --advanced` | Set allowed/protected paths, retry limits and gates |
| `vera init --dry-run` | Preview without writing |
| `vera doctor` | Validate config and check tools |
| `vera start "Task description"` | Generate persistent task and active IDE handoff |
| `vera context TASK_ID` | View the task contract and playbook |
| `vera verify TASK_ID` | Run existing build/test/lint checks |
| `vera status` | Inspect task state |
| `vera review TASK_ID --approve` | Record developer approval |
| `vera complete TASK_ID` | Reverify approved source and finish |
| `vera configure` | Reconfigure with onboarding interview |
| `vera upgrade --dry-run` | Preview adapter upgrades |
| `vera checkpoint TASK_ID` | Save a tracked Git patch for manual recovery |

`vera run` is an alias for `vera start`. Custom acceptance criteria for one task can be supplied using `--contract PATH_TO_JSON`.

**Windows:** if PowerShell execution policy blocks npm, use `npm.cmd install --global .`. Do not disable certificate verification to work around corporate package registry issues.

## Reliability and security

- Uses validated JSON configuration and repeatable project detection.
- Runs verification commands as argument arrays, with bounded timeouts.
- Produces PASS, FAIL, or UNKNOWN; no checks yields UNKNOWN.
- Protects selected files and detects edits after verification.
- Requires developer review and independently reruns checks before completion.
- Preserves customized files during integration and upgrades.

VERA's local process is not an OS sandbox. An agent with the same filesystem permissions can potentially tamper with local state. Use protected CI and real isolation for high-risk projects.

## Documentation

[Getting started](docs/getting-started.md) · [Architecture](docs/architecture.md) · [Configuration](docs/configuration.md) · [Security](docs/security.md) · [Troubleshooting](docs/troubleshooting.md) · [Implementation status](docs/implementation-report.md)

## Development

```sh
npm ci --ignore-scripts
npm test
npm pack --dry-run
```

Repository contents: VERA CLI, source modules, configuration schema, regression tests and documentation. **No demos or example apps.**
