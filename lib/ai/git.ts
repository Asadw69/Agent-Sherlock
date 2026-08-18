import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const COMMIT_HASH_RE = /^[0-9a-fA-F]{4,40}$/;
const MAX_LOG_COMMITS = 30;
const MAX_DIFF_CHARS = 6000;
const GIT_TIMEOUT_MS = 8000;

export function isValidCommitRef(ref: string): boolean {
  return typeof ref === 'string' && COMMIT_HASH_RE.test(ref.trim());
}

async function runGit(repoPath: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('git', args, {
      cwd: repoPath,
      timeout: GIT_TIMEOUT_MS,
      maxBuffer: 5 * 1024 * 1024,
    });
    return { stdout, stderr };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return { stdout: err.stdout || '', stderr: err.stderr || err.message || 'git command failed' };
  }
}

export interface GitLogEntry {
  hash: string;
  author: string;
  timestamp: string;
  message: string;
}

const LOG_FORMAT = '%H%x1f%an%x1f%aI%x1f%s%x1e';

function parseLog(stdout: string): GitLogEntry[] {
  return stdout
    .split('\x1e')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [hash, author, timestamp, message] = line.split('\x1f');
      return { hash, author, timestamp, message };
    });
}

/**
 * get_git_log() - bounded recent commit history for the repository.
 */
export async function getGitLog(repoPath: string, limit = MAX_LOG_COMMITS) {
  const boundedLimit = Math.min(Math.max(limit, 1), MAX_LOG_COMMITS);
  const { stdout, stderr } = await runGit(repoPath, [
    'log',
    `-n`,
    String(boundedLimit),
    `--pretty=format:${LOG_FORMAT}`,
  ]);

  if (!stdout && stderr) {
    return { commits: [] as GitLogEntry[], error: stderr, truncated: false };
  }

  const commits = parseLog(stdout);
  return { commits, error: null, truncated: commits.length >= boundedLimit };
}

/**
 * find_recent_changes() - commits near the deployment timestamp (or the
 * most recent commits if no deployment timestamp is known). This is the
 * primary correlation tool: deployment time -> nearby commits -> changed files.
 */
export async function findRecentChanges(repoPath: string, deploymentTimestamp?: Date | null) {
  if (deploymentTimestamp) {
    const since = new Date(deploymentTimestamp.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const until = new Date(deploymentTimestamp.getTime() + 60 * 60 * 1000).toISOString();
    const { stdout, stderr } = await runGit(repoPath, [
      'log',
      `--since=${since}`,
      `--until=${until}`,
      `--pretty=format:${LOG_FORMAT}`,
      '-n',
      String(MAX_LOG_COMMITS),
    ]);
    if (!stdout && stderr) return { commits: [] as GitLogEntry[], error: stderr, window: { since, until } };
    return { commits: parseLog(stdout), error: null, window: { since, until } };
  }

  // No deployment timestamp available - fall back to the most recent commits
  const fallback = await getGitLog(repoPath, 10);
  return { commits: fallback.commits, error: fallback.error, window: null };
}

/**
 * get_git_show(commit) - metadata + patch for a single commit.
 */
export async function getGitShow(repoPath: string, commit: string) {
  if (!isValidCommitRef(commit)) {
    return { error: 'Invalid commit reference format', content: null, truncated: false };
  }

  const { stdout, stderr } = await runGit(repoPath, [
    'show',
    commit,
    '--pretty=fuller',
    '--stat=200',
    '-p',
  ]);

  if (!stdout && stderr) {
    return { error: stderr, content: null, truncated: false };
  }

  const truncated = stdout.length > MAX_DIFF_CHARS;
  return {
    error: null,
    content: truncated ? stdout.slice(0, MAX_DIFF_CHARS) : stdout,
    truncated,
  };
}

/**
 * get_git_diff(commit) - diff introduced by a single commit (commit^..commit).
 * Bounded to avoid dumping enormous diffs into the model's context.
 */
export async function getGitDiff(repoPath: string, commit: string) {
  if (!isValidCommitRef(commit)) {
    return { error: 'Invalid commit reference format', stat: null, diff: null, truncated: false };
  }

  const statResult = await runGit(repoPath, ['show', commit, '--stat=200', '--pretty=format:']);
  const diffResult = await runGit(repoPath, [
    'diff',
    `${commit}~1`,
    commit,
    '--unified=3',
  ]);

  if (diffResult.stderr && !diffResult.stdout) {
    // Likely the commit has no parent (first commit) - fall back to full show
    const showAll = await runGit(repoPath, ['show', commit, '--unified=3', '--pretty=format:']);
    const truncated = showAll.stdout.length > MAX_DIFF_CHARS;
    return {
      error: showAll.stderr && !showAll.stdout ? showAll.stderr : null,
      stat: statResult.stdout.trim() || null,
      diff: truncated ? showAll.stdout.slice(0, MAX_DIFF_CHARS) : showAll.stdout,
      truncated,
    };
  }

  const truncated = diffResult.stdout.length > MAX_DIFF_CHARS;
  return {
    error: null,
    stat: statResult.stdout.trim() || null,
    diff: truncated ? diffResult.stdout.slice(0, MAX_DIFF_CHARS) : diffResult.stdout,
    truncated,
  };
}
