import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {safe,write,json,hash,files} from './storage.js';
import {verify} from './verification.js';
import {projectPlaybooks} from './playbooks.js';
const taskPath=(root,id)=>{
  if(!/^[a-f0-9-]{36}$/.test(id)) throw Error('Invalid task ID');
  return safe(root,'.vera/tasks/'+id+'.json');
};
export const readTask=(root,id)=>json(taskPath(root,id));
export function saveTask(root,task){write(taskPath(root,task.id),task);}
export function snapshot(root){return Object.fromEntries(files(root).map(p=>[p,hash(fs.readFileSync(safe(root,p)))]));}
export function createTask(root,config,objective,options={}) {
  if(!objective?.trim()) throw Error('Task objective is required');
  const book=options.playbook||'feature';
  if(!projectPlaybooks(root)[book]) throw Error('Unknown playbook');
  if(options.dependencies && (!Array.isArray(options.dependencies)||options.dependencies.some(id=>readTask(root,id).state!=='DONE'))) throw Error('Dependencies must be completed before starting');
  if(options.acceptance && (!Array.isArray(options.acceptance)||!options.acceptance.length||options.acceptance.some(value=>typeof value!=='string'))) throw Error('Acceptance criteria must be nonempty strings');
  if(options.risk && !['low','medium','high'].includes(options.risk)) throw Error('Invalid risk classification');
  const task={id:crypto.randomUUID(),objective,state:'DRAFT',context:config.project,scope:config.policies.allowed,
    constraints:config.policies.constraints,dependencies:options.dependencies||[],risk:options.risk||'medium',
    acceptance:options.acceptance||config.project.acceptance||['All configured checks pass and human review approves'],
    approvalRequirements:['Human review','Explicit approval of high-risk operations'],
    recovery:{maxAttempts:config.workflow.maxRepairAttempts,attempts:0},completion:['Current checks PASS','Policy unchanged','Review approved'],
    policy:hash(JSON.stringify(config)),baseline:snapshot(root),playbook:book,history:[],review:null};
  saveTask(root,task);return task;
}
const transitions={DRAFT:['READY'],READY:['IMPLEMENTING'],IMPLEMENTING:['VERIFYING'],VERIFYING:['REPAIRING','REVIEWING','BLOCKED'],REPAIRING:['IMPLEMENTING'],REVIEWING:['DONE','IMPLEMENTING'],BLOCKED:['IMPLEMENTING'],DONE:[]};
export function transition(task,next){
  if(!transitions[task.state]?.includes(next)) throw Error('Invalid transition '+task.state+' → '+next);
  task.history.push({from:task.state,to:next,at:new Date().toISOString()});task.state=next;
}
function assertPolicy(root,config,task){
  if(hash(JSON.stringify(config))!==task.policy) throw Error('Task policy changed. Human reconciliation and a new task contract are required.');
  const current=snapshot(root);
  const changed=[...new Set([...Object.keys(task.baseline),...Object.keys(current)])].filter(p=>current[p]!==task.baseline[p]);
  const within=(file,prefix)=>prefix==='.'||file===prefix||file.startsWith(prefix.replace(/\/$/,'')+'/');
  for(const file of changed){
    if(!task.scope.some(p=>within(file,p))||config.policies.protected.some(p=>within(file,p))) throw Error('Policy violation: '+file);
  }
}
export async function verifyTask(root,config,id){
  const task=readTask(root,id);
  if(!['IMPLEMENTING','REPAIRING','REVIEWING','BLOCKED'].includes(task.state)) throw Error('Task must be implementing before verification');
  assertPolicy(root,config,task);
  if(task.state==='BLOCKED'&&task.recovery.attempts>task.recovery.maxAttempts) throw Error('Repair limit exceeded. Escalate for a new reviewed contract.');
  task.state='VERIFYING';task.review=null;
  task.evidence=await verify(root,config);
  if(task.evidence.status==='PASS') transition(task,'REVIEWING');
  else{
    task.recovery.attempts++;
    transition(task,task.recovery.attempts>task.recovery.maxAttempts?'BLOCKED':'REPAIRING');
  }
  saveTask(root,task);return task;
}
export async function complete(root,config,id){
  const task=readTask(root,id);
  if(task.state!=='REVIEWING'||!task.review) throw Error('Human review approval is required');
  assertPolicy(root,config,task);
  for(const dependency of task.dependencies) if(readTask(root,dependency).state!=='DONE') throw Error('Incomplete dependency '+dependency);
  const evidence=await verify(root,config);
  if(evidence.status!=='PASS'||evidence.revision!==task.review.revision) throw Error('Completion blocked by failed, unknown or changed evidence');
  task.evidence=evidence;transition(task,'DONE');saveTask(root,task);return task;
}
export function checkpoint(root,id){
  const task=readTask(root,id);
  const result=spawnSync('git',['diff','--binary','HEAD'],{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024});
  if(result.status!==0) throw Error('Git checkpoint requires an existing commit');
  // Store a recovery reference without moving HEAD, index or working files.
  const head=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
  write(safe(root,'.vera/checkpoints/'+id+'.json'),{head,patch:result.stdout,files:task.baseline});
  return {head,recovery:'Inspect the patch in .vera/checkpoints before applying it manually. Untracked file contents require a separate backup.'};
}
