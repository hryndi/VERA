/** IDE adapters are configuration generators, not autonomous execution APIs. */
export const adapters = {
  copilot: {file: '.github/copilot-instructions.md', source: 'https://code.visualstudio.com/docs/agent-customization/custom-instructions'},
  junie: {file: '.junie/AGENTS.md', source: 'https://junie.jetbrains.com/docs/guidelines-and-memory.html'}
};

export function instructions(config) {
  return [
    '# VERA engineering workflow',
    '',
    'This is an existing software project. Preserve its architecture and functionality.',
    'Read vera.json, .vera/project.md, .vera/knowledge.md, and .vera/ACTIVE_TASK.md when present.',
    'Read task details with vera context TASK_ID before modifying source code.',
    'Workflow: UNDERSTAND → PLAN → IMPLEMENT → VERIFY → HUMAN REVIEW → COMPLETE.',
    'Operate only within the task scope, respect protected files and acceptance criteria.',
    'Do not access secrets, modify dependencies, rewrite tests, deploy, or perform destructive operations without explicit developer approval.',
    'Use vera verify TASK_ID to collect actual evidence. A PASS requires real checks; FAIL and UNKNOWN are not DONE.',
    'The developer performs vera review TASK_ID --approve. Never self-approve or claim verification based on model confidence.',
    'After review, vera complete TASK_ID independently reruns configured checks.',
    'Report changed files, tests performed, remaining risks and unknowns.',
    '',
    'Configured provider: '+config.agent.provider,
    'Autonomy level: '+config.agent.autonomy,
    ''
  ].join('\n');
}

export function providerFiles(config) {
  const result = {};
  if (['copilot','both'].includes(config.agent.provider)) {
    result[adapters.copilot.file] = instructions(config);
    result['.github/agents/vera.agent.md'] = [
      '---',
      'name: vera',
      'description: Develop scoped VERA tasks safely with project context and deterministic verification.',
      '---',
      '',
      'Follow .github/copilot-instructions.md and the current project contract in .vera/project.md.',
      'Read .vera/ACTIVE_TASK.md and the referenced task handoff.',
      'Plan, implement within scope and run vera verify TASK_ID.',
      'Show the results and code diff to the human reviewer. Do not issue approval commands.',
      ''
    ].join('\n');
    result['.github/skills/vera-workflow/SKILL.md'] = [
      '---',
      'name: vera-workflow',
      'description: Follow when initiating, implementing, verifying or reviewing a task with VERA.',
      '---',
      '',
      '1. Read vera.json, .vera/project.md, .vera/knowledge.md and .vera/ACTIVE_TASK.md.',
      '2. Execute vera context TASK_ID to retrieve requirements, boundaries and acceptance criteria.',
      '3. Inspect existing code, propose minimal changes and follow the task playbook.',
      '4. Implement within approved scope without changing protected policies or tests.',
      '5. Run vera verify TASK_ID and record real PASS/FAIL/UNKNOWN results.',
      '6. Hand off to the developer for review. Never self-approve or claim DONE prematurely.',
      ''
    ].join('\n');
  }
  if (['junie','both'].includes(config.agent.provider)) {
    result[adapters.junie.file] = instructions(config);
  }
  return result;
}
