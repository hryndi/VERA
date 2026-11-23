import {spawn} from 'node:child_process';
import {revision,safe,write} from './storage.js';
import fs from 'node:fs';
import {executable} from './commands.js';
function execute(root,gate) {
  return new Promise(resolve=>{
    let cwd;
    try {cwd=safe(root,gate.cwd);} catch(error) {resolve({id:gate.id,status:'UNKNOWN',reason:error.message});return;}
    const started=Date.now();
    let child;
    try {const command=executable(gate.command);child=spawn(command[0],command.slice(1),{cwd,shell:false,stdio:'ignore',env:{PATH:process.env.PATH,SystemRoot:process.env.SystemRoot,HOME:process.env.HOME,CI:'true'},detached:process.platform!=='win32'});}
    catch(error){resolve({id:gate.id,status:'UNKNOWN',reason:error.message});return;}
    let timedOut=false;
    const timer=setTimeout(()=>{
      timedOut=true;
      if(process.platform==='win32') child.kill();
      else {try{process.kill(-child.pid,'SIGKILL');}catch{}}
    },gate.timeout);
    child.on('error',error=>{clearTimeout(timer);resolve({id:gate.id,status:'UNKNOWN',reason:error.code});});
    child.on('close',(code,signal)=>{
      clearTimeout(timer);
      resolve({id:gate.id,status:timedOut?'UNKNOWN':code===0?'PASS':'FAIL',exitCode:code,signal,durationMs:Date.now()-started,reason:timedOut?'timeout':undefined});
    });
  });
}
export async function verify(root,config) {
  const before=revision(root);
  const results=[];
  for(const gate of config.verification) results.push(await execute(root,gate));
  const after=revision(root);
  const evidence={at:new Date().toISOString(),revision:after,stable:before===after,results,
    status:before!==after||!results.length?'UNKNOWN':results.some(r=>r.status==='FAIL')?'FAIL':results.every(r=>r.status==='PASS')?'PASS':'UNKNOWN'};
  const directory=safe(root,'.vera/evidence');
  fs.mkdirSync(directory,{recursive:true});
  write(safe(root,'.vera/evidence/'+Date.now()+'.json'),evidence);
  const logs=fs.readdirSync(directory).sort();
  for(const file of logs.slice(0,-50)) fs.unlinkSync(safe(root,'.vera/evidence/'+file));
  return evidence;
}
