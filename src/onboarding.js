import fs from 'node:fs';
import {createInterface} from 'node:readline/promises';
import {discover} from './discovery.js';
import {recommend,validateConfig} from './config.js';
import {safe,json,write} from './storage.js';
export async function interview(root,initial,advanced=false){
  const progress=safe(root,'.vera-interview.json');
  let config=fs.existsSync(progress)?json(progress).config:initial||recommend(discover(root));
  const rl=createInterface({input:process.stdin,output:process.stdout});
  const questions=[
    ['Project goals (comma separated)',()=>config.project.goals.join(', '),v=>config.project.goals=v.split(',').map(x=>x.trim())],
    ['Project context and constraints',()=>config.project.context,v=>config.project.context=v],
    ['Agent (copilot, junie, none)',()=>config.agent.provider,v=>config.agent.provider=v],
    ['Autonomy (conservative, balanced, advanced)',()=>config.agent.autonomy,v=>config.agent.autonomy=v]
  ];
  if(advanced) questions.push(
    ['Allowed paths (comma separated)',()=>config.policies.allowed.join(','),v=>config.policies.allowed=v.split(',').map(s=>s.trim())],
    ['Protected paths (comma separated)',()=>config.policies.protected.join(','),v=>config.policies.protected=v.split(',').map(s=>s.trim())],
    ['Repair attempts (0–10)',()=>String(config.workflow.maxRepairAttempts),v=>config.workflow.maxRepairAttempts=Number(v)],
    ['Verification gates as JSON',()=>JSON.stringify(config.verification),v=>config.verification=JSON.parse(v)]
  );
  let index=fs.existsSync(progress)?json(progress).index:0;
  try{
    while(index<questions.length){
      const [label,current,set]=questions[index];
      const answer=await rl.question(label+' ['+current()+'] (back/save): ');
      if(answer==='save'){write(progress,{config,index});return null;}
      if(answer==='back'){index=Math.max(0,index-1);continue;}
      if(answer.trim()) {const previous=structuredClone(config);try{set(answer);validateConfig(config);}catch(error){config=previous;console.error(error.message);continue;}}
      index++;
    }
  }finally{rl.close();}
  return validateConfig(config);
}
export async function approve(){
  const rl=createInterface({input:process.stdin,output:process.stdout});
  try{return /^y(es)?$/i.test(await rl.question('Apply these changes? [y/N] '));}
  finally{rl.close();}
}
