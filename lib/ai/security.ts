import path from 'path';
import { promises as fs } from 'fs';

/**
 * Resolves a user/AI-supplied relative path against a base directory and
 * guarantees the result cannot escape that base directory (no path
 * traversal, no absolute path override, no symlink escape via '..').
 *
 * Returns null if the path is unsafe.
 */
export function resolveSafePath(baseDir: string, relativePath: string): string | null {
  if (!relativePath || typeof relativePath !== 'string') return null;
  if (relativePath.includes('\0')) return null;

  // Reject absolute paths outright - everything must be relative to baseDir
  const normalizedRelative = relativePath.replace(/^[/\\]+/, '');

  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, normalizedRelative);

  const relation = path.relative(resolvedBase, resolvedTarget);

  // If relation starts with '..' or is absolute, target escapes baseDir
  if (relation.startsWith('..') || path.isAbsolute(relation)) {
    return null;
  }

  return resolvedTarget;
}

/**
 * Confirms a resolved path actually exists and is a file (not a directory,
 * not a symlink pointing outside the sandbox).
 */
export async function isSafeExistingFile(resolvedPath: string, baseDir: string): Promise<boolean> {
  try {
    const resolvedBase = path.resolve(baseDir);
    // Resolve symlinks to their real path and re-verify containment
    const real = await fs.realpath(resolvedPath);
    const realBase = await fs.realpath(resolvedBase).catch(() => resolvedBase);
    const relation = path.relative(realBase, real);
    if (relation.startsWith('..') || path.isAbsolute(relation)) return false;

    const stat = await fs.stat(resolvedPath);
    return stat.isFile();
  } catch {
    return false;
  }
}

export function clampRange(start: number, end: number, maxLines: number, totalLines?: number) {
  let s = Number.isFinite(start) && start > 0 ? Math.floor(start) : 1;
  let e = Number.isFinite(end) && end >= s ? Math.floor(end) : s + maxLines - 1;

  if (totalLines) {
    s = Math.min(s, totalLines);
    e = Math.min(e, totalLines);
  }

  if (e - s + 1 > maxLines) {
    e = s + maxLines - 1;
  }

  return { start: s, end: e };
}
