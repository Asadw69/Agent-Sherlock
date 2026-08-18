import path from 'path';
import { promises as fs } from 'fs';
import { prisma } from '@/lib/prisma';

export interface LogFileRef {
  filename: string;
  filePath: string;
}

export interface InvestigationContext {
  incidentId: string;
  logFiles: LogFileRef[];
  repoPath: string | null;
  hasGit: boolean;
}

/**
 * Loads everything the investigation tools need to know about an incident's
 * uploaded files: which log files exist, and where the extracted repository
 * (if any) lives on disk. Reuses the Session 2 UploadedFile records rather
 * than duplicating file storage.
 */
export async function loadInvestigationContext(incidentId: string): Promise<InvestigationContext> {
  const files = await prisma.uploadedFile.findMany({ where: { incidentId } });

  const logFiles: LogFileRef[] = files
    .filter((f) => f.fileType === 'log')
    .map((f) => ({ filename: f.originalName, filePath: f.filePath }));

  const repoRecord = files.find((f) => f.fileType === 'repository');
  let repoPath: string | null = repoRecord ? repoRecord.filePath : null;
  let hasGit = false;

  if (repoPath) {
    try {
      const stat = await fs.stat(repoPath);
      if (!stat.isDirectory()) repoPath = null;
    } catch {
      repoPath = null;
    }
  }

  if (repoPath) {
    try {
      const gitStat = await fs.stat(path.join(repoPath, '.git'));
      hasGit = gitStat.isDirectory();
    } catch {
      hasGit = false;
    }
  }

  return { incidentId, logFiles, repoPath, hasGit };
}
