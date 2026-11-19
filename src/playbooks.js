import fs from 'node:fs';
import {safe,json} from './storage.js';
export const playbooks = Object.fromEntries([
  ['feature','Define behavior and acceptance criteria'],
  ['debugging','Reproduce the failure and isolate its cause'],
  ['refactoring','Record existing behavior and compatibility constraints'],
  ['review','Inspect changes, risks and regression coverage'],
  ['architecture','Compare alternatives and record an approved decision'],
  ['tests','Identify uncovered behavior and assert failure conditions'],
  ['regression','Find the first failing revision without resetting user work'],
  ['integration','Verify dependency order and complete all required checks']
].map(([name,focus])=>[name,{focus,steps:['UNDERSTAND','RESEARCH','PLAN','IMPLEMENT','VERIFY','REVIEW','COMPLETE']}]));
export const orchestrationContract = {
  version:1,
  handoff:['taskId','objective','scope','dependencies','acceptance','evidence'],
  capabilities:['schedule','isolatedWorkspace','cancel','collectEvidence']
};

export function projectPlaybooks(root) {
  const file = safe(root,'.vera/playbooks.json');
  const books = fs.existsSync(file) ? json(file) : playbooks;
  for (const book of Object.values(books)) {
    if (typeof book.focus !== 'string' || !Array.isArray(book.steps) || book.steps.some(step=>typeof step!=='string')) throw Error('Invalid project playbook');
  }
  return books;
}
