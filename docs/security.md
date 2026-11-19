# Security model

Treat project scripts, repository text and command output as untrusted until reviewed. Initialization approval authorizes writing configuration. Executing `verify` authorizes running the configured commands with the current user's OS permissions.

The runner uses argument arrays with shell mode disabled, bounded timeouts and a minimal environment. POSIX timeouts kill the command process group. Source paths reject traversal and symlink access. Cooperating CLI mutations use a lock. These controls provide useful safeguards but cannot constrain arbitrary subprocess filesystem or network access.

An agent with the same OS account can rewrite VERA state, replace the executable, call the review command or forge local evidence. Protect policy files, verification code and evidence using separate OS identities, containers, CI branch protections and independent review. For release approval, run the trusted VERA version and reviewed configuration in an independently controlled CI job. Hashes are freshness and accidental modification checks, not cryptographic proof of authorship.

Default discovery protects existing package manifests, tests and configuration files in a task. Explicitly add custom verification dependencies to protected paths. Changing tests requires a separately reviewed contract. Do not allow an agent to approve its own weakening of quality requirements.

Source fingerprints exclude node_modules, dist, .angular, .git and .vera. Do not place authoritative application source in those directories. Symlinked source requires independent verification.

Checkpointing stores a Git HEAD and tracked binary patch. Recovery requires inspecting and manually applying that patch. Untracked contents and credentials need a separate appropriate backup. VERA never automatically resets Git or performs remote Git actions.

Free-text records can contain sensitive information if supplied by a caller. Avoid credentials in persisted text. Tool output is discarded. This release provides no automatic credential detector or secret store.
