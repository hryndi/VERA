import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {discover} from '../src/discovery.js';
import {recommend,validateConfig,merge} from '../src/config.js';
import {plan,apply,removal} from '../src/integration.js';
import {verify} from '../src/verification.js';
import {safe,write,locked} from '../src/storage.js';
import {createTask,transition,verifyTask,complete,saveTask} from '../src/tasks.js';
const cli=path.resolve('bin/vera.js');
function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'vera-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  write(path.join(root,'package.json'),{name:'fixture',scripts:{test:'node --test'},devDependencies:{typescript:'*'}});
  return root;
}
const gate=(code)=>({id:'test',command:[process.execPath,'-e',code],cwd:'.',timeout:2000});
test('discovery and schema reject invalid values',t=>{
  const root=fixture(t);const d=discover(root);
  assert.ok(d.stack.includes('typescript'));assert.equal(d.gates[0].command[2],'test');
  assert.throws(()=>validateConfig({...recommend(d),version:9}));
  assert.throws(()=>merge({},JSON.parse('{"__proto__":{}}')));
});
test('initialization is idempotent and preserves customized files',t=>{
  const root=fixture(t),config=recommend(discover(root));
  apply(root,plan(root,config));assert.ok(plan(root,config).every(c=>!c.changed));
  fs.appendFileSync(path.join(root,'.github/copilot-instructions.md'),'Custom');
  assert.throws(()=>apply(root,plan(root,config)),/conflict/);
  assert.equal(removal(root,true).find(r=>r.file.includes('copilot')).action,'preserve');
});
test('paths reject traversal, Windows traversal and symlinks',t=>{
  const root=fixture(t);
  assert.throws(()=>safe(root,'../outside'));
  assert.throws(()=>safe(root,'..\\outside'));
  fs.symlinkSync(os.tmpdir(),path.join(root,'link'),process.platform==='win32'?'junction':'dir');
  assert.throws(()=>safe(root,'link/x'));
});
test('runner classifies pass, failure, missing executable and empty gates',async t=>{
  const root=fixture(t),config=recommend(discover(root));
  for(const [g,status] of [[gate(''), 'PASS'],[gate('process.exit(2)'),'FAIL'],[{...gate(''),command:['vera-unavailable-123']},'UNKNOWN']]){
    assert.equal((await verify(root,{...config,verification:[g]})).status,status);
  }
  assert.equal((await verify(root,{...config,verification:[]})).status,'UNKNOWN');
});
test('task completion requires current evidence and human review',async t=>{
  const root=fixture(t),config={...recommend(discover(root)),verification:[gate('')]};
  const task=createTask(root,config,'Add behavior');
  assert.throws(()=>transition(task,'DONE'));
  transition(task,'READY');transition(task,'IMPLEMENTING');saveTask(root,task);
  let checked=await verifyTask(root,config,task.id);
  await assert.rejects(complete(root,config,task.id),/approval/);
  checked.review={revision:checked.evidence.revision};saveTask(root,checked);
  write(path.join(root,'source.js'),'new source');
  await assert.rejects(complete(root,config,task.id),/changed evidence/);
  checked=await verifyTask(root,config,task.id);
  checked.review={revision:checked.evidence.revision};saveTask(root,checked);
  assert.equal((await complete(root,config,task.id)).state,'DONE');
});
test('bounded repairs and policy changes block progression',async t=>{
  const root=fixture(t),config={...recommend(discover(root)),verification:[gate('process.exit(1)')],workflow:{maxRepairAttempts:0}};
  const task=createTask(root,config,'Repair');transition(task,'READY');transition(task,'IMPLEMENTING');saveTask(root,task);
  assert.equal((await verifyTask(root,config,task.id)).state,'BLOCKED');
  await assert.rejects(verifyTask(root,config,task.id),/limit/);
  await assert.rejects(verifyTask(root,{...config,verification:[]},task.id),/policy changed/);
});
test('lock prevents concurrent mutation and releases after failure',async t=>{
  const root=fixture(t);
  await locked(root,async()=>assert.throws(()=>locked(root,()=>{}),/busy/));
  await assert.rejects(locked(root,()=>{throw Error('failure');}));
  await locked(root,()=>{});
});
test('CLI initializes, diagnoses, verifies and removes a real temporary project',t=>{
  const root=fixture(t);
  write(path.join(root,'behavior.test.js'),"import {test} from 'node:test'; import assert from 'node:assert/strict'; test('addition',()=>assert.equal(1+1,2));");
  for(const args of [['init','--yes'],['doctor'],['verify'],['init','--yes'],['upgrade','--yes'],['remove','--yes']]){
    const result=spawnSync(process.execPath,[cli,...args,'--root',root],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr+result.stdout);
  }
  assert.ok(fs.existsSync(path.join(root,'package.json')));
  assert.ok(!fs.existsSync(path.join(root,'vera.json')));
});
test('runner times out and rejects source changes during execution',async t=>{
  const root=fixture(t),config=recommend(discover(root));
  assert.equal((await verify(root,{...config,verification:[{...gate('setTimeout(()=>{},10000)'),timeout:100}]})).status,'UNKNOWN');
  const changed=gate("require('node:fs').writeFileSync('changed.txt','changed')");
  assert.equal((await verify(root,{...config,verification:[changed]})).status,'UNKNOWN');
});
test('protected tests cannot be weakened during a task',async t=>{
  const root=fixture(t),config={...recommend(discover(root)),verification:[gate('')]};
  const task=createTask(root,config,'Feature');transition(task,'READY');transition(task,'IMPLEMENTING');saveTask(root,task);
  write(path.join(root,'package.json'),{scripts:{test:'echo pass'}});
  await assert.rejects(verifyTask(root,config,task.id),/Policy violation/);
});
test('Junie adapter uses documented instruction path',t=>{
  const root=fixture(t),config=recommend(discover(root));config.agent.provider='junie';
  apply(root,plan(root,config));
  assert.match(fs.readFileSync(path.join(root,'.junie/AGENTS.md'),'utf8'),/vera verify/);
});
test('configuration edits preview conflicts and need explicit reconciliation',t=>{
  const root=fixture(t),config=recommend(discover(root));apply(root,plan(root,config));
  config.project.context='custom context';
  write(path.join(root,'vera.json'),config);
  const updated={...config,agent:{...config.agent,provider:'junie'}};
  assert.ok(plan(root,updated).find(c=>c.file==='vera.json').conflict);
});
test('interview saves and resumes approved answers',async t=>{
  const root=fixture(t);
  const {spawn}=await import('node:child_process');
  async function conversation(responses){
    const child=spawn(process.execPath,[cli,'init','--root',root],{stdio:['pipe','pipe','pipe']});
    let output='',errors='',index=0;
    child.stdout.on('data',chunk=>{
      output+=chunk;
      if(index<responses.length&&output.includes(responses[index][0])){
        const [,answer]=responses[index++];
        output='';
        child.stdin.write(answer+'\n');
      }
    });
    child.stderr.on('data',chunk=>errors+=chunk);
    const timeout=setTimeout(()=>child.kill(),5000);
    const code=await new Promise(resolve=>child.on('close',resolve));
    clearTimeout(timeout);
    assert.equal(code,0,errors);assert.equal(index,responses.length);
  }
  await conversation([['Project goals','Maintain compatibility'],['Project context','save']]);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'.vera-interview.json'))).config.project.goals[0],'Maintain compatibility');
  await conversation([['Project context','Existing service'],['Project scope and boundaries','Only agreed modules'],['Non-negotiable constraints','No breaking changes'],['Acceptance standards','Build passes, Tests pass'],['Agent (','junie'],['Autonomy (','conservative'],['Apply these changes?','yes']]);
  const config=JSON.parse(fs.readFileSync(path.join(root,'vera.json')));
  assert.equal(config.agent.provider,'junie');
  assert.equal(config.project.goals[0],'Maintain compatibility');
  assert.ok(!fs.existsSync(path.join(root,'.vera-interview.json')));
});
test('Windows package manager resolution uses node without shell interpolation',async t=>{
  const root=fixture(t);
  const {executable}=await import('../src/commands.js');
  write(path.join(root,'node_modules/npm/bin/npm-cli.js'),'');
  const command=executable(['npm','run','test'],'win32',root);
  assert.equal(command[0],process.execPath);
  assert.deepEqual(command.slice(2),['run','test']);
  assert.throws(()=>executable(['pnpm','test'],'win32',root),/Cannot resolve/);
});
test('project playbooks override bundled workflow context',async t=>{
  const root=fixture(t);
  const {projectPlaybooks}=await import('../src/playbooks.js');
  write(path.join(root,'.vera/playbooks.json'),{custom:{focus:'Review API compatibility',steps:['RESEARCH','VERIFY']}});
  assert.equal(projectPlaybooks(root).custom.focus,'Review API compatibility');
  const task=createTask(root,recommend(discover(root)),'Review',{playbook:'custom'});
  assert.equal(task.playbook,'custom');
});

test('copilot and junie can be installed together without examples',t=>{
  const root=fixture(t),config=recommend(discover(root));
  config.agent.provider='both';
  apply(root,plan(root,config));
  for(const file of [
    '.github/copilot-instructions.md','.github/agents/vera.agent.md',
    '.github/skills/vera-workflow/SKILL.md','.junie/AGENTS.md','.vera/project.md'
  ]) assert.ok(fs.existsSync(path.join(root,file)),file);
  assert.match(fs.readFileSync(path.join(root,'.github/agents/vera.agent.md'),'utf8'),/name: vera/);
  assert.match(fs.readFileSync(path.join(root,'.vera/project.md'),'utf8'),/Acceptance standards/);
  assert.ok(!fs.existsSync(path.join(root,'examples')));
});
test('start creates an active IDE task with project-specific acceptance criteria',t=>{
  const root=fixture(t),config=recommend(discover(root));
  config.project.acceptance=['Preserve behavior','Build and tests pass'];
  apply(root,plan(root,config));
  const cmd=spawnSync(process.execPath,[cli,'start','Implement the proposed feature','--root',root],{encoding:'utf8'});
  assert.equal(cmd.status,0,cmd.stdout+cmd.stderr);
  const files=fs.readdirSync(path.join(root,'.vera/tasks')).filter(name=>name.endsWith('.json'));
  assert.equal(files.length,1);
  const task=JSON.parse(fs.readFileSync(path.join(root,'.vera/tasks',files[0]),'utf8'));
  assert.deepEqual(task.acceptance,config.project.acceptance);
  assert.match(fs.readFileSync(path.join(root,'.vera/ACTIVE_TASK.md'),'utf8'),/handoffs/);
  assert.match(fs.readFileSync(path.join(root,'.vera/handoffs',task.id+'.md'),'utf8'),/Implement the proposed feature/);
});
test('v2 distribution manifest excludes application examples',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.resolve('package.json'),'utf8'));
  assert.equal(pkg.version,'0.2.0');
  assert.ok(!pkg.files.some(p=>p.includes('example')));
});
