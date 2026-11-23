import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {spawnSync} from 'node:child_process';
import {selectPreset,presets} from './presets.js';
import {discover} from './discovery.js';
import {load,recommend,merge,validateConfig} from './config.js';
import {json,safe,locked} from './storage.js';
import {plan,apply,removal} from './integration.js';
import {interview,approve} from './onboarding.js';
import {verify} from './verification.js';
import {createTask,readTask,saveTask,transition,verifyTask,complete,checkpoint} from './tasks.js';
import {projectPlaybooks} from './playbooks.js';
import {writeHandoff} from './handoff.js';
const output=value=>console.log(JSON.stringify(value,null,2));
export async function main(args){
  const {positionals,values}=parseArgs({args,allowPositionals:true,options:{
    root:{type:'string'},yes:{type:'boolean'},'dry-run':{type:'boolean'},advanced:{type:'boolean'},
    config:{type:'string'},workspace:{type:'string'},approve:{type:'boolean'},help:{type:'boolean'},playbook:{type:'string'},'accept-conflicts':{type:'boolean'},contract:{type:'string'}
  }});
  const [command,id,...rest]=positionals;
  const root=fs.realpathSync(values.root||process.cwd());
  if(!command||values.help){
    console.log('VERA 0.2.0\nCommands: init, configure, doctor, status, verify [task-id], start <objective>, run <objective>, context <id>, review <id> --approve, complete <id>, checkpoint <id>, upgrade, remove\nOptions: --root PATH --yes --dry-run --advanced --config JSON --workspace PATH --playbook NAME\nrun prepares a manual agent handoff. review records a human approval. No native agent API is invoked.');
    return;
  }
  if(['init','configure','upgrade'].includes(command)){
    const discovery=discover(root);output({...discovery,preset:selectPreset(discovery),strategy:presets[selectPreset(discovery)].strategy});
    let config=fs.existsSync(safe(root,'vera.json'))?load(root):recommend(discovery);
    if(values.config) config=validateConfig(merge(config,json(path.resolve(values.config))));
    if(!values.yes&&!values['dry-run']&&command!=='upgrade'){
      config=await interview(root,config,values.advanced);
      if(!config){console.log('Interview saved. Run init again to resume.');return;}
    }
    const changes=plan(root,config);
    output({config,changes:changes.map(c=>({file:c.file,changed:c.changed,conflict:c.conflict,before:c.previous,after:c.content}))});
    if(values['dry-run']) return;
    if(!values.yes&&!await approve()) return;
    if(values['accept-conflicts']) {
      if(!values.yes) throw Error('--accept-conflicts requires --yes after reviewing the preview');
      for(const change of changes) change.conflict=false;
    }
    await locked(root,()=>apply(root,changes));
    const progress=safe(root,'.vera-interview.json');
    if(fs.existsSync(progress)) fs.unlinkSync(progress);
    validateConfig(load(root));
    console.log('Configuration installed and validated. Run vera doctor, then vera run "Your objective". Verification checks have not run.');
    return;
  }
  const config=load(root,values.workspace);
  if(command==='doctor'){
    const tools=[...new Set(config.verification.map(g=>g.command[0]))].map(tool=>{
      const result=spawnSync(process.platform==='win32'?'where':'which',[tool],{encoding:'utf8'});
      return {tool,available:result.status===0};
    });
    output({config:'VALID',tools,gates:config.verification.length,limitations:['Agent handoff requires IDE interaction','Use protected CI for independent enforcement']});
    if(!config.verification.length||tools.some(t=>!t.available)) process.exitCode=1;
    return;
  }
  if(command==='status'){
    const directory=safe(root,'.vera/tasks');
    output({config,tasks:fs.existsSync(directory)?fs.readdirSync(directory).filter(p=>p.endsWith('.json')).map(p=>json(safe(root,'.vera/tasks/'+p))):[]});return;
  }
  if(command==='context'){
    const task=readTask(root,id);
    output({objective:task.objective,context:task.context,scope:task.scope,constraints:task.constraints,acceptance:task.acceptance,state:task.state,playbook:projectPlaybooks(root)[task.playbook]});return;
  }
  await locked(root,async()=>{
    if(command==='remove'){output(removal(root,Boolean(values.yes&&!values['dry-run'])));return;}
    if(command==='run'||command==='start'){
      const task=createTask(root,config,[id,...rest].filter(Boolean).join(' '),{...(values.contract?json(path.resolve(values.contract)):{}),playbook:values.playbook});
      transition(task,'READY');transition(task,'IMPLEMENTING');saveTask(root,task);
      const handoff=writeHandoff(root,task);
      output({id:task.id,state:task.state,objective:task.objective,acceptance:task.acceptance,handoff});
      console.log('Ready: ask your IDE agent to implement .vera/ACTIVE_TASK.md.');return;
    }
    if(command==='verify'){
      const result=id?await verifyTask(root,config,id):await verify(root,config);
      output(result);
      if((result.evidence||result).status!=='PASS') process.exitCode=1;
      return;
    }
    if(command==='review'){
      if(!values.approve) throw Error('Human approval requires --approve');
      const task=readTask(root,id);
      if(task.state!=='REVIEWING'||task.evidence?.status!=='PASS') throw Error('Passing verification is required before review');
      task.review={at:new Date().toISOString(),revision:task.evidence.revision};saveTask(root,task);output(task.review);return;
    }
    if(command==='complete'){output(await complete(root,config,id));return;}
    if(command==='checkpoint'){output(checkpoint(root,id));return;}
    throw Error('Unknown command. Use vera --help.');
  });
}
