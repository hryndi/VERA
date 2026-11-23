import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {files, json} from './storage.js';
export function discover(root) {
  const inventory = files(root);
  const manifests = inventory.filter(file => path.basename(file) === 'package.json');
  const gates = [];
  const stack = new Set();
  for (const file of manifests) {
    const pkg = json(path.join(root,file));
    const cwd = path.dirname(file);
    const dependencies = {...pkg.dependencies, ...pkg.devDependencies};
    stack.add('javascript');
    if (dependencies.typescript) stack.add('typescript');
    if (dependencies['@angular/core']) stack.add('angular');
    const manager = inventory.includes(path.posix.join(cwd,'pnpm-lock.yaml')) ? 'pnpm' : inventory.includes(path.posix.join(cwd,'yarn.lock')) ? 'yarn' : 'npm';
    for (const name of ['build','typecheck','lint','test']) {
      if (pkg.scripts?.[name]) gates.push({id:(cwd === '.' ? '' : cwd.replaceAll('/','-')+'-')+name, command:[manager,'run',name], cwd, timeout:120000});
    }
  }
  return {
    name:path.basename(root), stack:[...stack], manifests, gates,
    instructions:inventory.filter(file => /AGENTS.md|copilot-instructions.md|guidelines.md$/.test(file)),
    ci:inventory.filter(file => file.startsWith('.github/workflows/')),
    documentation:inventory.filter(file => /readme/i.test(file)),
    git:spawnSync('git',['rev-parse','--is-inside-work-tree'],{cwd:root,encoding:'utf8'}).status === 0,
    verificationFiles:inventory.filter(file => /(^|\/)(package.json|.*lock.*|.*\.test\.[^/]+|.*\.spec\.[^/]+|.*config.*)$/.test(file) || file.startsWith('.github/workflows/') || file.startsWith('tests/')),
    platform:process.platform,
    assumptions:gates.length ? ['Discovered scripts require developer review before execution.'] : ['No verification commands discovered. Configure commands before completing tasks.']
  };
}
