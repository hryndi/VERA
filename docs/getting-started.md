# Getting started with VERA

This is a ready-to-configure tool, **not a starter app**. Clone it once and install its CLI.

```sh
git clone https://github.com/hryndi/VERA.git
cd VERA
npm install --global .
```

From **any existing application repository**, run:

```sh
cd /path/to/your-application
vera init
vera doctor
vera start "Implement a new feature"
```

### Onboarding interview

During `vera init`, VERA discovers available language and package scripts, then asks for project goals, architecture/context, boundaries, mandatory constraints, acceptance standards, which IDE agents to integrate (`copilot`, `junie`, `both`, or `none`), and autonomy level.

You can press Enter to accept a detected/default answer, type `back` to correct the last field, or type `save` to resume later. For file boundary and gate configuration, use `vera init --advanced`. Every generated file is previewed for approval before writing.

### Start work

`vera start "description"` prints a task ID and writes `.vera/ACTIVE_TASK.md` plus a detailed Markdown handoff. In Copilot, choose the repository's VERA agent or Agent mode and request: **Implement .vera/ACTIVE_TASK.md**. In Junie, ask it to follow the same file.

The IDE's agent implements the task; VERA does not automatically start an LLM API, invoke Copilot/Junie, or run unapproved code changes.

### Finish safely

```sh
vera context TASK_ID
vera verify TASK_ID
vera review TASK_ID --approve
vera complete TASK_ID
```

Approval is a human-only action. Completion re-executes the configured gates on the current revision. The task is not DONE when verification is FAIL or UNKNOWN.

You can inspect existing work using `vera status`, configure again with `vera configure`, preview integration upgrades with `vera upgrade --dry-run` and save a patch with `vera checkpoint TASK_ID`.

See [Configuration](configuration.md), [Architecture](architecture.md), [Security](security.md), and [Troubleshooting](troubleshooting.md).
