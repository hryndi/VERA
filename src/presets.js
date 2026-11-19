// Presets annotate discovered tooling. Commands always come from repository manifests.
export const presets = {
  angular:{stack:'angular',strategy:'Compile templates, check TypeScript, then add component and browser tests.'},
  node:{stack:'typescript',strategy:'Type-check, test public APIs and exercise service boundaries.'},
  javascript:{stack:'javascript',strategy:'Run existing tests and lint scripts. Add regression coverage for changed behavior.'},
  generic:{stack:null,strategy:'Provide explicit command arrays and acceptance criteria.'}
};
export function selectPreset(discovery){
  return Object.entries(presets).find(([,preset])=>discovery.stack.includes(preset.stack))?.[0]||'generic';
}
export function registerPreset(name,preset){
  if(!/^[a-z][a-z0-9-]*$/.test(name)||presets[name]||typeof preset.strategy!=='string') throw Error('Invalid or duplicate preset');
  presets[name]=Object.freeze({...preset});
}
