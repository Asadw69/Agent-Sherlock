import { promises as fs, createReadStream, createWriteStream } from 'fs';
import path from 'path';
import unzipper, { type Entry as UnzipperEntry } from 'unzipper';

// Configuration
const ALLOWED_LOG_EXTENSIONS = ['.log', '.txt', '.json', '.csv'];
const ALLOWED_ARCHIVE_EXTENSIONS = ['.zip'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '104857600'); // 100MB
const MAX_TOTAL_SIZE = parseInt(process.env.MAX_TOTAL_SIZE || '524288000'); // 500MB
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Directories to ignore when extracting repositories
// Note: .git is intentionally NOT ignored here - the AI investigation agent's
// git tools (get_git_log, get_git_diff, etc.) need real git history to work.
const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  '.venv',
  '__pycache__',
  'venv',
  '.cache',
  'tmp',
  'temp',
]);

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface ExtractedZipInfo {
  extractPath: string;
  fileCount: number;
  totalSize: number;
}

/**
 * Validates a log file
 */
export function validateLogFile(
  filename: string,
  fileSize: number
): FileValidationResult {
  // Check extension
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_LOG_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid log file extension. Allowed: ${ALLOWED_LOG_EXTENSIONS.join(', ')}`,
    };
  }

  // Check size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check filename safety
  if (!isSafeFilename(filename)) {
    return {
      valid: false,
      error: 'Invalid filename',
    };
  }

  return { valid: true };
}

/**
 * Validates a ZIP file
 */
export function validateZipFile(
  filename: string,
  fileSize: number
): FileValidationResult {
  // Check extension
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_ARCHIVE_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid archive file extension. Allowed: ${ALLOWED_ARCHIVE_EXTENSIONS.join(', ')}`,
    };
  }

  // Check size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check filename safety
  if (!isSafeFilename(filename)) {
    return {
      valid: false,
      error: 'Invalid filename',
    };
  }

  return { valid: true };
}

/**
 * Checks if a filename is safe (no path traversal, etc)
 */
function isSafeFilename(filename: string): boolean {
  // No path separators
  if (filename.includes('/') || filename.includes('\\')) {
    return false;
  }

  // No parent directory traversal
  if (filename.includes('..')) {
    return false;
  }

  // No null bytes
  if (filename.includes('\0')) {
    return false;
  }

  return true;
}

/**
 * Ensures the upload directory exists
 */
export async function ensureUploadDir(): Promise<void> {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw new Error('Failed to create upload directory');
  }
}

/**
 * Saves an uploaded file to disk
 */
export async function saveUploadedFile(
  buffer: Buffer,
  filename: string,
  incidentId: string,
  // Kept for call-site clarity (log vs. repository uploads are handled
  // differently by the caller before/after this call) even though the
  // storage path itself doesn't currently branch on it.
  _fileType: 'log' | 'repository'
): Promise<string> {
  try {
    await ensureUploadDir();

    // Create incident-specific directory
    const incidentDir = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, incidentId);
    await fs.mkdir(incidentDir, { recursive: true });

    // Sanitize filename
    const sanitized = path.basename(filename);
    const filePath = path.join(incidentDir, sanitized);

    // Write file
    await fs.writeFile(filePath, buffer);

    return filePath;
  } catch (error) {
    console.error('Failed to save file:', error);
    throw new Error('Failed to save file');
  }
}

/**
 * Extracts a ZIP file safely.
 *
 * IMPORTANT: this does NOT use unzipper's `Extract()` helper. Two real bugs
 * were found and fixed here in Session 4:
 *   1. `import Extract from 'unzipper'` bound to the whole `unzipper`
 *      module object (`{ Parse, Extract, Open, ... }`), not a callable
 *      function - calling it as `Extract({ path })` threw
 *      `TypeError: Extract is not a function` at runtime. Every ZIP
 *      upload was actually crashing before this fix.
 *   2. Even with that fixed, `unzipper.Extract()` writes every entry to
 *      disk on its own, independent of any 'entry' listener you attach.
 *      The old code's path-traversal/ignored-dir checks in the 'entry'
 *      handler only decided whether to log/count an entry - they never
 *      actually stopped Extract() from writing it. Traversal and
 *      "ignored directory" protection were therefore not effective.
 *
 * This version uses `unzipper.Parse()` and manually pipes only entries
 * that pass path-traversal, ignored-directory, and size-limit checks to a
 * verified-safe destination path - nothing else touches disk.
 */
export async function extractZipFile(
  zipFilePath: string,
  incidentId: string
): Promise<ExtractedZipInfo> {
  await ensureUploadDir();

  const extractPath = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, incidentId, 'repository');
  const resolvedRoot = path.resolve(extractPath);
  await fs.mkdir(extractPath, { recursive: true });

  let fileCount = 0;
  let totalSize = 0;

  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(zipFilePath).pipe(unzipper.Parse());
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      stream.destroy();
      reject(error);
    };

    stream.on('entry', (entry: UnzipperEntry) => {
      if (settled) {
        entry.autodrain();
        return;
      }

      // Reject anything that looks like path traversal in the raw entry name
      const entryPath = path.normalize(entry.path);
      if (entryPath.startsWith('..') || path.isAbsolute(entryPath)) {
        entry.autodrain();
        return;
      }

      // Re-verify by resolving against the extraction root - catches
      // traversal patterns normalize() alone might not (e.g. encoded
      // separators, unusual normalization edge cases).
      const target = path.resolve(resolvedRoot, entryPath);
      const relation = path.relative(resolvedRoot, target);
      if (relation.startsWith('..') || path.isAbsolute(relation)) {
        entry.autodrain();
        return;
      }

      // Skip ignored directories anywhere in the path
      const parts = entryPath.split(path.sep);
      if (parts.some((part) => IGNORED_DIRS.has(part))) {
        entry.autodrain();
        return;
      }

      if (entry.type === 'Directory') {
        entry.autodrain();
        return;
      }

      // Guard against zip bombs: track uncompressed size as we go and
      // abort the whole extraction if it exceeds the configured limit,
      // rather than only checking after the fact.
      const declaredSize = entry.vars?.uncompressedSize ?? 0;
      if (totalSize + declaredSize > MAX_TOTAL_SIZE) {
        entry.autodrain();
        fail(new Error('Extracted content exceeds the maximum allowed size'));
        return;
      }
      totalSize += declaredSize;
      fileCount++;

      fs.mkdir(path.dirname(target), { recursive: true })
        .then(() => {
          const writeStream = createWriteStream(target);
          entry.pipe(writeStream);
          writeStream.on('error', fail);
        })
        .catch(fail);
    });

    stream.on('error', (error) => fail(new Error(`Failed to extract ZIP: ${error.message}`)));
    stream.on('close', () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    });
  });

  return { extractPath, fileCount, totalSize };
}

/**
 * Gets stored file from incident
 */
export async function getIncidentFile(
  incidentId: string,
  filename: string
): Promise<Buffer | null> {
  try {
    const allowedDir = path.resolve(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, incidentId));
    const target = path.resolve(allowedDir, filename);

    // Prevent path traversal: the resolved target must stay inside the
    // incident's own directory. Using path.relative() instead of
    // startsWith() avoids false positives/negatives from sibling
    // directories that merely share a name prefix.
    const relation = path.relative(allowedDir, target);
    if (relation.startsWith('..') || path.isAbsolute(relation)) {
      return null;
    }

    return await fs.readFile(target);
  } catch (error) {
    console.error('Failed to read file:', error);
    return null;
  }
}

/**
 * Deletes an incident's files
 */
export async function deleteIncidentFiles(incidentId: string): Promise<void> {
  try {
    const incidentDir = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, incidentId);
    await fs.rm(incidentDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Failed to delete incident files:', error);
    // Don't throw - just log
  }
}

