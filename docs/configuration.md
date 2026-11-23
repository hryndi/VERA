# Configuration

Configuration uses JSON and JSON Schema version 1. See [the schema](../schemas/vera.schema.json). Unknown keys, invalid providers, unsupported versions and duplicate gate IDs are errors. There is no older released format to migrate. Future schema versions must supply an explicit migration.

Precedence is global defaults, repository configuration, then an explicitly selected workspace override. Objects merge recursively and arrays replace. Global defaults live in `~/.config/vera/config.json` or `$VERA_CONFIG_HOME/config.json`. Repository configuration is `vera.json`. Package overrides use `vera.override.json` and require `--workspace relative/path`.

```json
{
  "version": 1,
  "project": {"name": "service", "goals": ["Reliable delivery"], "context": "Preserve public APIs"},
  "agent": {"provider": "copilot", "autonomy": "balanced"},
  "workflow": {"maxRepairAttempts": 2},
  "verification": [
    {"id": "tests", "command": ["npm", "run", "test"], "cwd": ".", "timeout": 120000}
  ],
  "policies": {
    "allowed": ["."],
    "protected": [".git", ".env", "vera.json", ".vera", "package.json", "tests"],
    "constraints": ["Human approval for dependency changes and deployments"]
  }
}
```

Commands are executable-and-argument arrays. Shell expansion and pipes are unavailable. Package scripts can themselves invoke shells, so review their contents before approving initialization. A gate passes when its configured command exits zero. Choose test runner options that fail on zero tests. VERA cannot infer test counts from every arbitrary command.

Discovered scripts always take precedence over preset suggestions. The preset API in `src/presets.js` allows additional deterministic recommendations without dynamic plugin loading. No commands are invented for missing tools.

Autonomy settings are instructions for the provider. All presets retain explicit human approval requirements for destructive operations and deployment. VERA's local runner does not provide an OS sandbox.

A task can receive dependencies, acceptance criteria and risk with `run --contract contract.json`. Dependencies must already be DONE. Protect verification files explicitly when a custom command reads additional scripts or fixtures. New quality gates require a reviewed task contract.

Knowledge lives in `.vera/knowledge.md`, task working context in `.vera/tasks`, and temporary evidence in `.vera/evidence`. Store proposed policy or knowledge changes separately for human review. Keep stable knowledge in version control using your project's ignore rules. Evidence retention is capped at 50 records. Subprocess stdout and stderr are discarded to avoid retaining secrets. Environment variables supplied to subprocesses are restricted to basic execution settings. Commands requiring credentials need an external, reviewed execution wrapper.

Never enter secrets in goals, task objectives, acceptance criteria or knowledge. These text fields are persisted verbatim.
