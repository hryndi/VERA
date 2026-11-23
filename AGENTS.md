# Working on VERA

Read README.md and docs/security.md before changing policy or execution behavior.
Run npm ci --ignore-scripts and npm test. Preserve UNKNOWN for unavailable or inconclusive checks.
Keep the portable core independent of provider APIs. Verify adapter formats against official provider sources.
Use the existing checkout. Add focused failure tests for lifecycle, safety or persistence changes.
Never weaken gates to make a failing task pass. Do not publish packages or perform remote Git mutations without authorization.
