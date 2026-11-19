import fs from 'node:fs';
import path from 'node:path';
export function executable(command,platform=process.platform,searchPath=process.env.PATH||''){
  if(platform!=='win32'||!['npm','pnpm','yarn'].includes(command[0])) return command;
  const name=command[0];
  const candidates=name==='npm'?['node_modules/npm/bin/npm-cli.js']:name==='pnpm'?['node_modules/pnpm/bin/pnpm.cjs']:['node_modules/yarn/bin/yarn.js'];
  for(const directory of searchPath.split(';')){
    for(const candidate of candidates){
      const file=path.join(directory,candidate);
      if(fs.existsSync(file)) return [process.execPath,file,...command.slice(1)];
    }
  }
  throw Error('Cannot resolve '+name+' JavaScript entry point. Configure node with the absolute package-manager entry point.');
}
