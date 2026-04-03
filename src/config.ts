// ---------------------------------------------------------------------------
// Runtime asset configuration.
// Set once by <hf-app> via its `res-root` attribute before first render.
// ---------------------------------------------------------------------------

let _resRoot = '/';

export function setResRoot(root: string): void {
  // Normalise: ensure trailing slash
  _resRoot = root.endsWith('/') ? root : `${root}/`;
}

export function resRoot(): string {
  return _resRoot;
}
