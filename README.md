# VERA

Verification-Driven Engineering & Reliable Agents is a portable CLI for structured coding tasks, project onboarding and repeatable quality gates.

Requires Node.js 22.12 or newer. This repository is an initial implementation. See [implementation evidence](docs/implementation-report.md) for tested capabilities and limitations.

## Install from this checkout

```sh
npm ci --ignore-scripts
npm test
npm pack
npm install --global ./vera-engineering-0.1.0.tgz
```

The npm package name is reserved here as metadata. Registry publication has not been performed.

## Add VERA to a project

```sh
cd your-project
vera init --dry-run
vera init
vera doctor
vera run "Implement the approved feature"
```

Quick setup discovers package scripts and asks for project goals, context, provider and autonomy. Advanced setup adds path boundaries, retry limits and gate editing. Enter `back` to revisit an answer or `save` to save the interview for later. Initialization shows complete proposed file contents before approval.

```sh
vera init --advanced
vera init --config /path/to/overrides.json --yes
vera verify TASK_ID
vera review TASK_ID --approve
vera complete TASK_ID
```

The coding agent performs implementation in the IDE. Review approval is a human action. Completion reruns configured commands against current source and requires the reviewed revision.

[Getting started](docs/getting-started.md) · [Configuration](docs/configuration.md) · [Architecture](docs/architecture.md) · [Security](docs/security.md) · [Troubleshooting](docs/troubleshooting.md)
