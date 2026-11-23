import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export function safe(root, relative) {
  if (path.isAbsolute(relative) || path.win32.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) throw Error('Path escapes workspace');
  const target = path.resolve(root, relative);
  let current = root;
  for (const part of path.relative(root, target).split(path.sep)) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw Error('Symlink access refused: ' + relative);
  }
  return target;
}
export function write(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive:true});
  const temporary = file + '.' + crypto.randomUUID() + '.tmp';
  fs.writeFileSync(temporary, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', {mode:0o600});
  fs.renameSync(temporary, file);
}
export function locked(root, callback) {
  const file = safe(root, '.vera/lock');
  fs.mkdirSync(path.dirname(file), {recursive:true});
  let fd;
  try { fd = fs.openSync(file, 'wx'); }
  catch { throw Error('VERA is busy. Inspect .vera/lock before recovering an abandoned lock.'); }
  return Promise.resolve().then(callback).finally(() => {fs.closeSync(fd); fs.unlinkSync(file);});
}
export function files(root, directory = '', result = []) {
  for (const entry of fs.readdirSync(path.join(root, directory), {withFileTypes:true})) {
    if (['.git','node_modules','dist','.angular','.vera'].includes(entry.name)) continue;
    const relative = path.posix.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw Error('Source symlink requires independent verification: ' + relative);
    if (entry.isDirectory()) files(root, relative, result);
    else if (entry.isFile()) result.push(relative);
  }
  return result.sort();
}
export function revision(root) {
  return hash(files(root).map(file => file + ':' + hash(fs.readFileSync(safe(root,file)))).join('\n'));
}
