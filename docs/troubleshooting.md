# Troubleshooting

A missing executable yields UNKNOWN. Install the project's pinned tool and confirm it is available on PATH. Doctor checks executable availability, while verify checks actual command behavior.

A zero-gate project remains UNKNOWN. Add explicit commands with `configure --advanced` or a reviewed JSON patch.

A failed gate produces FAIL and increments task repair attempts. Resolve the failure within the approved scope and verify again. An exhausted recovery policy requires escalation and a newly reviewed contract.

A source change during verification produces UNKNOWN. Separate generated outputs from application source, inspect unexpected edits and rerun. Changed source after review requires fresh verification and review.

A managed-file conflict displays prior and proposed contents. Preserve custom content, reconcile it and preview again. Explicit replacement requires `--accept-conflicts --yes`.

An abandoned `.vera/lock` blocks mutations. Confirm no VERA process is active before removing that lock manually. A partially completed installation can be previewed and rerun. Files whose content matches the proposal are idempotent.

Copilot uses `.github/copilot-instructions.md`, `.github/agents/vera.agent.md` and `.github/skills/vera-workflow/SKILL.md`. Junie uses `.junie/AGENTS.md`. Choose `both` to use both adapters. Enable repository instructions in the IDE and inspect its loaded instruction context. VERA does not invoke IDE APIs or guarantee that a model follows instructions.

If `vera` is not found, run `npm install --global .` in your cloned VERA repository, or invoke `node /path/to/VERA/bin/vera.js`. Windows execution of npm, pnpm and yarn may require invoking the package manager's JavaScript entry point through node when only command shims are installed. Native Windows and macOS execution needs CI confirmation.
