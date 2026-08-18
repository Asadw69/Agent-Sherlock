import { describe, it, expect } from 'vitest';
import { isValidCommitRef } from './git';

describe('isValidCommitRef', () => {
  it('accepts valid short and full hex commit hashes', () => {
    expect(isValidCommitRef('6b02157')).toBe(true);
    expect(isValidCommitRef('6b0215786ed41e11e33898f038b3454f0853592a'.slice(0, 40))).toBe(true);
    expect(isValidCommitRef('abcd')).toBe(true);
  });

  it('rejects shell metacharacters and command injection attempts', () => {
    expect(isValidCommitRef('HEAD; rm -rf /')).toBe(false);
    expect(isValidCommitRef('$(whoami)')).toBe(false);
    expect(isValidCommitRef('`id`')).toBe(false);
    expect(isValidCommitRef('--upload-pack=evil')).toBe(false);
    expect(isValidCommitRef('main && curl evil.com')).toBe(false);
  });

  it('rejects refs that are too short or too long', () => {
    expect(isValidCommitRef('abc')).toBe(false);
    expect(isValidCommitRef('a'.repeat(41))).toBe(false);
  });

  it('rejects non-hex characters', () => {
    expect(isValidCommitRef('zzzzzzz')).toBe(false);
  });

  it('rejects empty/non-string input', () => {
    expect(isValidCommitRef('')).toBe(false);
    // @ts-expect-error deliberately testing invalid input
    expect(isValidCommitRef(undefined)).toBe(false);
  });
});
