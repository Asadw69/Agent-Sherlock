import path from 'path';
import { promises as fs } from 'fs';
import { resolveSafePath, isSafeExistingFile, clampRange } from './security';
import { InvestigationContext } from './context';
import { getGitLog, getGitDiff, getGitShow, findRecentChanges, isValidCommitRef } from './git';

const MAX_LOG_MATCHES = 20;
const MAX_LOG_CONTEXT_LINES = 2;
const MAX_LOG_SECTION_LINES = 150;
const MAX_SOURCE_LINES = 200;
const MAX_REPO_FILES = 400;
const MAX_CODE_MATCHES = 25;
const MAX_CODE_FILE_SCAN = 2000; // don't scan more than N files for search_code
const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot',
  '.pdf', '.zip', '.gz', '.tar', '.exe', '.dll', '.so', '.dylib', '.bin',
  '.mp4', '.mp3', '.wav', '.class', '.jar',
]);
const IGNORED_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'coverage', '.git', '.venv', '__pycache__', 'venv', '.cache']);

// ---------- Anthropic tool schema definitions ----------

export const TOOL_DEFINITIONS = [
  {
    name: 'search_logs',
    description:
      "Search the incident's uploaded log files for a keyword or phrase (e.g. an error type, service name, or status code). Returns bounded, relevant matches with file/line context - not the whole file.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword or phrase to search for (case-insensitive).' },
        file: { type: 'string', description: 'Optional: restrict the search to one uploaded log filename.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_log_section',
    description:
      'Read a bounded range of lines from a specific uploaded log file, for when search_logs found something interesting and you need surrounding context.',
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Log filename (as returned by search_logs).' },
        start_line: { type: 'number' },
        end_line: { type: 'number' },
      },
      required: ['file', 'start_line', 'end_line'],
    },
  },
  {
    name: 'list_repository_files',
    description:
      "Return a bounded file listing of the incident's uploaded source repository, so you can understand its structure before searching or reading files.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'search_code',
    description:
      'Search file contents in the uploaded repository for a keyword or code pattern (e.g. a function name, config key, or error string). Ignores node_modules/build/dist/etc. Returns bounded matches with file/line context.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword or substring to search for in source files.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_source_file',
    description:
      'Read a bounded range of lines from a specific file in the uploaded repository. Path must be relative to the repository root.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to the repository root.' },
        start_line: { type: 'number' },
        end_line: { type: 'number' },
      },
      required: ['path'],
    },
  },
  {
    name: 'get_git_log',
    description: 'List recent commits in the uploaded repository (hash, author, timestamp, message). Bounded to the most recent commits.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_git_diff',
    description: 'Get the diff introduced by a specific commit (changed files + patch, bounded size). Use a commit hash from get_git_log or find_recent_changes.',
    input_schema: {
      type: 'object',
      properties: { commit: { type: 'string', description: 'Commit hash.' } },
      required: ['commit'],
    },
  },
  {
    name: 'get_git_show',
    description: 'Show full metadata and patch for a specific commit (message, author, changed files, diff).',
    input_schema: {
      type: 'object',
      properties: { commit: { type: 'string', description: 'Commit hash.' } },
      required: ['commit'],
    },
  },
  {
    name: 'find_recent_changes',
    description:
      "Find commits around the incident's deployment timestamp, to correlate the deployment with specific code changes. Falls back to the most recent commits if no deployment timestamp is known.",
    input_schema: { type: 'object', properties: {} },
  },
] as const;

export type ToolName = (typeof TOOL_DEFINITIONS)[number]['name'];

// ---------- helpers ----------

async function readAllLines(filePath: string): Promise<string[] | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.split(/\r?\n/);
  } catch {
    return null;
  }
}

async function walkRepo(root: string, maxFiles: number): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string) {
    if (results.length >= maxFiles) return;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (results.length >= maxFiles) return;
      if (IGNORED_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        results.push(path.relative(root, full));
      }
    }
  }

  await walk(root);
  return results;
}

// ---------- tool implementations ----------

async function searchLogs(ctx: InvestigationContext, query: string, file?: string) {
  if (!query || !query.trim()) return { error: 'query is required', matches: [] };
  if (ctx.logFiles.length === 0) return { error: null, matches: [], note: 'No log files were uploaded for this incident.' };

  const targets = file ? ctx.logFiles.filter((f) => f.filename === file) : ctx.logFiles;
  if (file && targets.length === 0) {
    return { error: `Unknown log file "${file}". Available: ${ctx.logFiles.map((f) => f.filename).join(', ')}`, matches: [] };
  }

  const needle = query.toLowerCase();
  const matches: Array<{ file: string; line: number; text: string; context: string[] }> = [];

  for (const f of targets) {
    const lines = await readAllLines(f.filePath);
    if (!lines) continue;
    for (let i = 0; i < lines.length && matches.length < MAX_LOG_MATCHES; i++) {
      if (lines[i].toLowerCase().includes(needle)) {
        const start = Math.max(0, i - MAX_LOG_CONTEXT_LINES);
        const end = Math.min(lines.length - 1, i + MAX_LOG_CONTEXT_LINES);
        matches.push({
          file: f.filename,
          line: i + 1,
          text: lines[i],
          context: lines.slice(start, end + 1),
        });
      }
    }
    if (matches.length >= MAX_LOG_MATCHES) break;
  }

  return {
    error: null,
    matches,
    truncated: matches.length >= MAX_LOG_MATCHES,
    note: matches.length === 0 ? 'No matches found. Try a different or shorter query.' : undefined,
  };
}

async function readLogSection(ctx: InvestigationContext, file: string, startLine: number, endLine: number) {
  const target = ctx.logFiles.find((f) => f.filename === file);
  if (!target) {
    return { error: `Unknown log file "${file}". Available: ${ctx.logFiles.map((f) => f.filename).join(', ')}`, lines: [] };
  }

  const lines = await readAllLines(target.filePath);
  if (!lines) return { error: 'Failed to read log file', lines: [] };

  const { start, end } = clampRange(startLine, endLine, MAX_LOG_SECTION_LINES, lines.length);
  const slice = lines.slice(start - 1, end).map((text, idx) => ({ line: start + idx, text }));

  return { error: null, file, start, end, lines: slice, truncated: end - start + 1 >= MAX_LOG_SECTION_LINES };
}

async function listRepositoryFiles(ctx: InvestigationContext) {
  if (!ctx.repoPath) return { error: null, files: [], note: 'No repository was uploaded for this incident.' };
  const files = await walkRepo(ctx.repoPath, MAX_REPO_FILES);
  return { error: null, files, truncated: files.length >= MAX_REPO_FILES, root: path.basename(ctx.repoPath) };
}

async function searchCode(ctx: InvestigationContext, query: string) {
  if (!query || !query.trim()) return { error: 'query is required', matches: [] };
  if (!ctx.repoPath) return { error: null, matches: [], note: 'No repository was uploaded for this incident.' };

  const files = await walkRepo(ctx.repoPath, MAX_CODE_FILE_SCAN);
  const needle = query.toLowerCase();
  const matches: Array<{ file: string; line: number; text: string }> = [];

  for (const rel of files) {
    if (matches.length >= MAX_CODE_MATCHES) break;
    const ext = path.extname(rel).toLowerCase();
    if (BINARY_EXT.has(ext)) continue;

    const abs = path.join(ctx.repoPath, rel);
    let stat;
    try {
      stat = await fs.stat(abs);
    } catch {
      continue;
    }
    if (stat.size > 2 * 1024 * 1024) continue; // skip files >2MB

    const lines = await readAllLines(abs);
    if (!lines) continue;
    for (let i = 0; i < lines.length && matches.length < MAX_CODE_MATCHES; i++) {
      if (lines[i].toLowerCase().includes(needle)) {
        matches.push({ file: rel, line: i + 1, text: lines[i].trim().slice(0, 300) });
      }
    }
  }

  return {
    error: null,
    matches,
    truncated: matches.length >= MAX_CODE_MATCHES,
    filesScanned: files.length,
    note: matches.length === 0 ? 'No matches found. Try a different query or use list_repository_files to browse.' : undefined,
  };
}

async function readSourceFile(ctx: InvestigationContext, relPath: string, startLine?: number, endLine?: number) {
  if (!ctx.repoPath) return { error: 'No repository was uploaded for this incident.', lines: [] };

  const resolved = resolveSafePath(ctx.repoPath, relPath);
  if (!resolved) return { error: 'Invalid or unsafe path.', lines: [] };
  if (!(await isSafeExistingFile(resolved, ctx.repoPath))) {
    return { error: `File not found in repository: ${relPath}`, lines: [] };
  }

  const lines = await readAllLines(resolved);
  if (!lines) return { error: 'Failed to read file (may be binary).', lines: [] };

  const { start, end } = clampRange(startLine ?? 1, endLine ?? (startLine ?? 1) + MAX_SOURCE_LINES - 1, MAX_SOURCE_LINES, lines.length);
  const slice = lines.slice(start - 1, end).map((text, idx) => ({ line: start + idx, text }));

  return { error: null, path: relPath, start, end, totalLines: lines.length, lines: slice, truncated: end - start + 1 >= MAX_SOURCE_LINES };
}

// ---------- dispatcher ----------

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: InvestigationContext,
  deploymentTimestamp: Date | null
): Promise<unknown> {
  switch (name) {
    case 'search_logs':
      return searchLogs(ctx, String(input.query ?? ''), input.file ? String(input.file) : undefined);
    case 'read_log_section':
      return readLogSection(ctx, String(input.file ?? ''), Number(input.start_line), Number(input.end_line));
    case 'list_repository_files':
      return listRepositoryFiles(ctx);
    case 'search_code':
      return searchCode(ctx, String(input.query ?? ''));
    case 'read_source_file':
      return readSourceFile(
        ctx,
        String(input.path ?? ''),
        input.start_line !== undefined ? Number(input.start_line) : undefined,
        input.end_line !== undefined ? Number(input.end_line) : undefined
      );
    case 'get_git_log': {
      if (!ctx.repoPath || !ctx.hasGit) return { error: null, commits: [], note: 'No git history available for this repository.' };
      return getGitLog(ctx.repoPath);
    }
    case 'get_git_diff': {
      if (!ctx.repoPath || !ctx.hasGit) return { error: 'No git history available for this repository.', diff: null };
      const commit = String(input.commit ?? '');
      if (!isValidCommitRef(commit)) return { error: 'Invalid commit reference.', diff: null };
      return getGitDiff(ctx.repoPath, commit);
    }
    case 'get_git_show': {
      if (!ctx.repoPath || !ctx.hasGit) return { error: 'No git history available for this repository.', content: null };
      const commit = String(input.commit ?? '');
      if (!isValidCommitRef(commit)) return { error: 'Invalid commit reference.', content: null };
      return getGitShow(ctx.repoPath, commit);
    }
    case 'find_recent_changes': {
      if (!ctx.repoPath || !ctx.hasGit) return { error: null, commits: [], note: 'No git history available for this repository.' };
      return findRecentChanges(ctx.repoPath, deploymentTimestamp);
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
