import {safe,write} from './storage.js';
import {projectPlaybooks} from './playbooks.js';

/** Persist an IDE-ready task specification without invoking an agent. */
export function writeHandoff(root,task) {
  const playbook=projectPlaybooks(root)[task.playbook];
  const bullet=items=>(items||[]).map(item=>'- '+item).join('\n');
  const file='.vera/handoffs/'+task.id+'.md';
  const prompt=[
    '# VERA task — '+task.objective,
    '',
    'Task ID: '+task.id,
    'State: '+task.state+' | Risk: '+task.risk,
    '',
    '## Objective',
    task.objective,
    '',
    '## Project context',
    ...(task.context.goals||[]).map(g=>'- '+g),
    '',
    '## Allowed scope',
    bullet(task.scope),
    '',
    '## Constraints',
    bullet(task.constraints),
    '',
    '## Acceptance criteria',
    ...(task.acceptance||[]).map(item=>'- [ ] '+item),
    '',
    '## Playbook: '+task.playbook,
    playbook.focus,
    ...playbook.steps.map((step,i)=>(i+1)+'. '+step),
    '',
    '## Instructions for the coding agent',
    'Inspect the existing application before any change. Plan minimally and stay within the allowed scope.',
    'Respect protected files, existing behavior, tests and project conventions.',
    'Implement in the developer-approved workspace or branch. Do not deploy or modify secrets.',
    'Run vera verify '+task.id+' and show the checks, changed files and remaining risks.',
    'Do not self-approve or claim task completion based on model confidence.',
    '',
    '## Developer-only commands',
    'Review: vera review '+task.id+' --approve',
    'Complete: vera complete '+task.id,
    ''
  ].join('\n');
  write(safe(root,file),prompt);
  write(safe(root,'.vera/ACTIVE_TASK.md'),
    '# Current VERA task\n\nOpen '+file+' and run vera context '+task.id+' before implementation.\n');
  return file;
}
