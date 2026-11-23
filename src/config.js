import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import Ajv from 'ajv';
import {json, safe} from './storage.js';
export const schema = {
  type:'object', additionalProperties:false, required:['version','project','agent','workflow','verification','policies'],
  properties:{
    version:{const:1},
    project:{type:'object',additionalProperties:false,required:['name','goals','context'],properties:{name:{type:'string',minLength:1},goals:{type:'array',items:{type:'string'}},context:{type:'string'}}},
    agent:{type:'object',additionalProperties:false,required:['provider','autonomy'],properties:{provider:{enum:['copilot','junie','none']},autonomy:{enum:['conservative','balanced','advanced']}}},
    workflow:{type:'object',additionalProperties:false,required:['maxRepairAttempts'],properties:{maxRepairAttempts:{type:'integer',minimum:0,maximum:10}}},
    verification:{type:'array',items:{type:'object',additionalProperties:false,required:['id','command','cwd','timeout'],properties:{id:{type:'string',pattern:'^[a-zA-Z0-9_-]+$'},command:{type:'array',minItems:1,items:{type:'string',minLength:1}},cwd:{type:'string'},timeout:{type:'integer',minimum:100,maximum:3600000}}}},
    policies:{type:'object',additionalProperties:false,required:['allowed','protected','constraints'],properties:{allowed:{type:'array',minItems:1,items:{type:'string'}},protected:{type:'array',items:{type:'string'}},constraints:{type:'array',items:{type:'string'}}}}
  }
};
const validate = new Ajv({allErrors:true}).compile(schema);
export function validateConfig(config) {
  if (!validate(config)) throw Error('Invalid configuration: '+JSON.stringify(validate.errors));
  if (new Set(config.verification.map(g => g.id)).size !== config.verification.length) throw Error('Duplicate gate IDs');
  return config;
}
export function merge(base, patch) {
  const result = {...base};
  for (const [key,value] of Object.entries(patch)) {
    if (['__proto__','constructor','prototype'].includes(key)) throw Error('Unsafe configuration key');
    result[key] = value && typeof value === 'object' && !Array.isArray(value) ? merge(base[key] ?? {},value) : value;
  }
  return result;
}
export function load(root, workspace) {
  const global = path.join(process.env.VERA_CONFIG_HOME || path.join(os.homedir(),'.config','vera'),'config.json');
  let config = fs.existsSync(global) ? json(global) : {};
  config = merge(config,json(safe(root,'vera.json')));
  if (workspace) config = merge(config,json(safe(root,path.join(workspace,'vera.override.json'))));
  return validateConfig(config);
}
export function recommend(discovery) {
  return validateConfig({version:1,project:{name:discovery.name,goals:['Reliable development'],context:''},
    agent:{provider:discovery.instructions.some(p=>p.includes('junie'))?'junie':'copilot',autonomy:'balanced'},
    workflow:{maxRepairAttempts:2},verification:discovery.gates,
    policies:{allowed:['.'],protected:['.git','.env','vera.json','.vera',...discovery.verificationFiles],constraints:['Preserve existing functionality','Request approval for destructive operations, dependencies and deployment']}});
}
