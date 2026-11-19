# Getting started

The CLI can run directly with `node /path/to/VERA/bin/vera.js`, through a local package installation, or through a global installation of the packed tarball. Target applications receive configuration and instructions. They need no runtime dependency on VERA.

## Examples

From the VERA checkout, run the dependency-free example.

```sh
node bin/vera.js init --root examples/generic --yes
node bin/vera.js doctor --root examples/generic
node bin/vera.js verify --root examples/generic
node bin/vera.js run "Document sum behavior" --root examples/generic
```

Use the printed ID with `context`, `verify`, `review --approve` and `complete`. The context command returns a compact contract and playbook for the selected task.

The Angular example uses Angular 20 and TypeScript 5.9.

```sh
npm ci --prefix examples/angular --ignore-scripts
node bin/vera.js init --root examples/angular --yes
node bin/vera.js verify --root examples/angular
```

Its gates compile a real standalone component and run strict TypeScript checking. Browser rendering and accessibility require additional project-specific tests.

## Commands

| Command | Behavior |
| --- | --- |
| init | Discover, interview, preview, approve and validate integration |
| configure | Reopen the interview or apply a JSON patch with --config |
| doctor | Validate configuration and find required executables |
| status | Display effective configuration and persisted tasks |
| run OBJECTIVE | Create a contract and prepare a manual IDE handoff |
| context ID | Retrieve compact task context |
| verify [ID] | Execute gates and persist results |
| review ID --approve | Record a human approval of the passing revision |
| complete ID | Repeat verification and enforce completion conditions |
| checkpoint ID | Save HEAD and a binary diff for manual recovery |
| upgrade | Regenerate managed files with conflict checks |
| remove --yes | Remove unmodified managed files, preserving customized files and task history |

Use `--root` to select a project. Use `--dry-run` for integration previews. Removal without `--yes` previews its actions. Configuration and upgrades show old and proposed contents. After resolving conflicts manually, rerun. Explicit `--accept-conflicts --yes` authorizes replacement of the previewed conflicts.

Initialization is idempotent. An existing instruction file with different content is a conflict and requires reconciliation. Keep a copy of custom text before approving replacement.

The interview stores progress only when requested with `save`. Resume by running init again with the same quick or advanced mode.
