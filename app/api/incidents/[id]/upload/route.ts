import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  validateLogFile,
  validateZipFile,
  saveUploadedFile,
  extractZipFile,
} from '@/lib/file-handling';

const MAX_TOTAL_SIZE = parseInt(process.env.MAX_TOTAL_SIZE || '524288000'); // 500MB
const MAX_FILES_PER_REQUEST = 25;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid incident id' }, { status: 400 });
    }

    // Verify incident exists
    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Too many files in one request (max ${MAX_FILES_PER_REQUEST})` },
        { status: 400 }
      );
    }

    const uploadedFiles = [];
    const errors = [];
    let totalSize = 0;

    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const fileSize = buffer.byteLength;

        totalSize += fileSize;
        if (totalSize > MAX_TOTAL_SIZE) {
          errors.push({
            file: file.name,
            error: `Total upload size exceeds ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit`,
          });
          break;
        }

        // Determine file type
        const isZip = file.name.toLowerCase().endsWith('.zip');

        // Validate based on type
        if (isZip) {
          const validation = validateZipFile(file.name, fileSize);
          if (!validation.valid) {
            errors.push({ file: file.name, error: validation.error });
            continue;
          }

          // Save ZIP file
          const zipPath = await saveUploadedFile(
            Buffer.from(buffer),
            file.name,
            id,
            'repository'
          );

          // Extract ZIP (path traversal / ignored-dir filtering handled inside)
          const extractInfo = await extractZipFile(zipPath, id);

          // Create file record
          const uploadedFile = await prisma.uploadedFile.create({
            data: {
              incidentId: id,
              filename: `repository-${Date.now()}`,
              originalName: file.name,
              filePath: extractInfo.extractPath,
              fileType: 'repository',
              mimeType: 'application/zip',
              size: fileSize,
            },
          });

          uploadedFiles.push({
            ...uploadedFile,
            extractedFiles: extractInfo.fileCount,
          });
        } else {
          const validation = validateLogFile(file.name, fileSize);
          if (!validation.valid) {
            errors.push({ file: file.name, error: validation.error });
            continue;
          }

          // Save log file
          const logPath = await saveUploadedFile(
            Buffer.from(buffer),
            file.name,
            id,
            'log'
          );

          // Create file record
          const uploadedFile = await prisma.uploadedFile.create({
            data: {
              incidentId: id,
              filename: file.name,
              originalName: file.name,
              filePath: logPath,
              fileType: 'log',
              mimeType: file.type || 'text/plain',
              size: fileSize,
            },
          });

          uploadedFiles.push(uploadedFile);
        }
      } catch (error) {
        // Never leak internal paths/stack traces to the client
        console.error(`Failed to process upload "${file.name}":`, error);
        errors.push({
          file: file.name,
          error: 'Failed to process this file',
        });
      }
    }

    return NextResponse.json({
      uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      success: errors.length === 0,
    });
  } catch (error) {
    console.error('Failed to upload files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
