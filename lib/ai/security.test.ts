import { describe, it, expect } from 'vitest';
import path from 'path';
import { resolveSafePath, clampRange } from './security';

describe('resolveSafePath', () => {
  const base = '/uploads/incident-123/repo';

  it('resolves a normal relative path inside the base dir', () => {
    const result = resolveSafePath(base, 'src/index.ts');
    expect(result).toBe(path.resolve(base, 'src/index.ts'));
  });

  it('rejects simple parent traversal', () => {
    expect(resolveSafePath(base, '../secret.txt')).toBeNull();
  });

  it('rejects deeply nested traversal', () => {
    expect(resolveSafePath(base, 'src/../../../etc/passwd')).toBeNull();
  });

  it('treats a leading-slash path as relative to the base dir rather than an absolute escape', () => {
    // resolveSafePath strips leading separators and resolves what remains
    // against base, so "/etc/passwd" becomes "<base>/etc/passwd" - it is
    // contained, not rejected. The important guarantee is containment.
    const result = resolveSafePath(base, '/etc/passwd');
    expect(result).not.toBeNull();
    expect(result!.startsWith(path.resolve(base))).toBe(true);
  });

  it('rejects paths containing null bytes', () => {
    expect(resolveSafePath(base, 'src/index.ts\0.png')).toBeNull();
  });

  it('rejects empty or non-string input', () => {
    expect(resolveSafePath(base, '')).toBeNull();
    // @ts-expect-error deliberately testing invalid input
    expect(resolveSafePath(base, undefined)).toBeNull();
  });

  it('allows "." (the base dir itself)', () => {
    expect(resolveSafePath(base, '.')).toBe(path.resolve(base));
  });
});

describe('clampRange', () => {
  it('clamps end to start + maxLines - 1', () => {
    const { start, end } = clampRange(1, 1000, 200);
    expect(start).toBe(1);
    expect(end).toBe(200);
  });

  it('clamps to totalLines when provided', () => {
    const { start, end } = clampRange(1, 500, 200, 50);
    expect(end).toBe(50);
    expect(start).toBe(1);
  });

  it('falls back to sane defaults for invalid input', () => {
    const { start, end } = clampRange(NaN, NaN, 100);
    expect(start).toBe(1);
    expect(end).toBe(100);
  });
});
