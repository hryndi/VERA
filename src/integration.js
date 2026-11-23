import fs from 'node:fs';
import {safe,json,hash,write} from './storage.js';
import {providerFiles} from './adapters.js';
import {playbooks} from './playbooks.js';

function projectBrief(config) {
  const p=config.project;
  const bullets=items=>(items||[]).map(x=>'- '+x).join('\n')||'- Not specified';
  return '# '+p.name+' — VERA project brief\n\n'
    +'## Project goals\n'+bullets(p.goals)+'\n\n'
    +'## Architecture / context\n'+(p.context||'To be documented')+'\n\n'
    +'## Scope and boundaries\n'+(p.scope||'Preserve current behavior unless approved')+'\n\n'
    +'## Constraints\n'+bullets(config.policies.constraints)+'\n\n'
    +'## Acceptance standards\n'+bullets(p.acceptance)+'\n\n'
    +'## Verification\n'+bullets(config.verification.map(g=>g.id+': '+g.command.join(' ')))+'\n';
}
export function plan(root,config) {
  const outputs = {'vera.json':JSON.stringify(config,null,2)+'\n','.vera/playbooks.json':JSON.stringify(playbooks,null,2)+'\n','.vera/project.md':projectBrief(config),...providerFiles(config)};
  const manifestPath = safe(root,'.vera/manifest.json');
  const manifest = fs.existsSync(manifestPath)?json(manifestPath):{};
  return Object.entries(outputs).map(([file,content])=>{
    const target=safe(root,file);
    const previous=fs.existsSync(target)?fs.readFileSync(target,'utf8'):null;
    const conflict=previous !== null && previous !== content && hash(previous) !== manifest[file];
    return {file,content,previous,conflict,changed:previous!==content};
  });
}
export function apply(root,changes) {
  if (changes.some(c=>c.conflict)) throw Error('Managed file conflict. Preserve custom content and reconcile the preview before retrying.');
  // Validate every destination and prior value before any write.
  for (const c of changes) {
    const file=safe(root,c.file);
    const actual=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;
    if(actual!==c.previous) throw Error('Files changed after preview');
  }
  const manifestFile=safe(root,'.vera/manifest.json');
  const manifest=fs.existsSync(manifestFile)?json(manifestFile):{};
  for(const c of changes) {
    if(c.changed) write(safe(root,c.file),c.content);
    manifest[c.file]=hash(c.content);
    write(manifestFile,manifest);
  }
  const knowledge=safe(root,'.vera/knowledge.md');
  if(!fs.existsSync(knowledge)) write(knowledge,'# Project knowledge\n\n## Purpose\n\n## Conventions\n\n## Approved decisions\n\n## Limitations\n\n## Lessons\n');
}
export function removal(root,execute=false) {
  const manifestFile=safe(root,'.vera/manifest.json');
  const manifest=json(manifestFile);
  const results=[];
  for(const [file,digest] of Object.entries(manifest)) {
    const target=safe(root,file);
    const unchanged=fs.existsSync(target)&&hash(fs.readFileSync(target))===digest;
    results.push({file,action:unchanged?'remove':'preserve'});
    if(execute&&unchanged) fs.unlinkSync(target);
    if(execute) delete manifest[file];
  }
  if(execute) write(manifestFile,manifest);
  return results;
}
