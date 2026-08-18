import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { buildZip } from './file-handling.test-utils';

let tmpRoot: string;

beforeAll(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agentsherlock-test-'));
  process.env.UPLOAD_DIR = tmpRoot;
});

afterAll(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true }).catch(() => {});
});

describe('validateLogFile / validateZipFile', () => {
  it('accepts allowed log extensions within the size limit', async () => {
    const { validateLogFile } = await import('./file-handling');
    expect(validateLogFile('database.log', 1024).valid).toBe(true);
    expect(validateLogFile('events.json', 1024).valid).toBe(true);
  });

  it('rejects disallowed extensions', async () => {
    const { validateLogFile } = await import('./file-handling');
    expect(validateLogFile('malware.exe', 1024).valid).toBe(false);
    expect(validateLogFile('script.sh', 1024).valid).toBe(false);
  });

  it('rejects files over the size limit', async () => {
    const { validateLogFile } = await import('./file-handling');
    expect(validateLogFile('huge.log', 10 * 1024 * 1024 * 1024).valid).toBe(false);
  });

  it('rejects filenames containing path traversal or separators', async () => {
    const { validateLogFile } = await import('./file-handling');
    expect(validateLogFile('../../etc/passwd', 1024).valid).toBe(false);
    expect(validateLogFile('a/b.log', 1024).valid).toBe(false);
    expect(validateLogFile('a\\b.log', 1024).valid).toBe(false);
  });

  it('only accepts .zip for repository uploads', async () => {
    const { validateZipFile } = await import('./file-handling');
    expect(validateZipFile('repo.zip', 1024).valid).toBe(true);
    expect(validateZipFile('repo.tar.gz', 1024).valid).toBe(false);
  });
});

describe('extractZipFile security', () => {
  it('does not let a path-traversal entry escape the extraction directory', async () => {
    const { extractZipFile } = await import('./file-handling');

    const zipPath = path.join(tmpRoot, 'traversal.zip');
    const zip = buildZip([
      { name: 'inner/safe.txt', content: 'safe content' },
      { name: '../../evil-escape.txt', content: 'PWNED' },
    ]);
    await fs.writeFile(zipPath, zip);

    const result = await extractZipFile(zipPath, 'incident-traversal-test');

    // The traversal entry must never be written outside the extraction dir.
    const escaped = await fs
      .readFile(path.join(tmpRoot, 'evil-escape.txt'), 'utf-8')
      .then(() => true)
      .catch(() => false);
    expect(escaped).toBe(false);

    // The safe entry should still be extracted normally.
    const safeContent = await fs.readFile(path.join(result.extractPath, 'inner', 'safe.txt'), 'utf-8');
    expect(safeContent).toBe('safe content');
  });

  it('skips ignored directories like node_modules and .next', async () => {
    const { extractZipFile } = await import('./file-handling');

    const zipPath = path.join(tmpRoot, 'ignored-dirs.zip');
    const zip = buildZip([
      { name: 'src/index.ts', content: 'export {}' },
      { name: 'node_modules/some-pkg/index.js', content: 'module.exports = {}' },
      { name: '.next/cache/x.bin', content: 'binary-ish' },
    ]);
    await fs.writeFile(zipPath, zip);

    const result = await extractZipFile(zipPath, 'incident-ignored-dirs-test');

    const nodeModulesExists = await fs
      .access(path.join(result.extractPath, 'node_modules'))
      .then(() => true)
      .catch(() => false);
    expect(nodeModulesExists).toBe(false);

    const srcExists = await fs
      .access(path.join(result.extractPath, 'src', 'index.ts'))
      .then(() => true)
      .catch(() => false);
    expect(srcExists).toBe(true);
  });

  it('preserves .git so the investigation agent can read history', async () => {
    const { extractZipFile } = await import('./file-handling');

    const zipPath = path.join(tmpRoot, 'with-git.zip');
    const zip = buildZip([{ name: '.git/HEAD', content: 'ref: refs/heads/main' }]);
    await fs.writeFile(zipPath, zip);

    const result = await extractZipFile(zipPath, 'incident-git-test');

    const gitHeadExists = await fs
      .access(path.join(result.extractPath, '.git', 'HEAD'))
      .then(() => true)
      .catch(() => false);
    expect(gitHeadExists).toBe(true);
  });

  it('aborts extraction once the declared size exceeds the configured total limit', async () => {
    process.env.MAX_TOTAL_SIZE = '10'; // bytes - deliberately tiny for this test
    vi.resetModules(); // MAX_TOTAL_SIZE is read at module-load time
    const { extractZipFile } = await import('./file-handling');

    const zipPath = path.join(tmpRoot, 'zip-bomb-ish.zip');
    const zip = buildZip([{ name: 'big.txt', content: 'x'.repeat(1000) }]);
    await fs.writeFile(zipPath, zip);

    await expect(extractZipFile(zipPath, 'incident-size-limit-test')).rejects.toThrow(/size/i);

    delete process.env.MAX_TOTAL_SIZE;
    vi.resetModules();
  });
});
