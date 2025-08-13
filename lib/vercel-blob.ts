import { put, del, list, head } from '@vercel/blob';
import { auth } from '@clerk/nextjs/server';

export interface VercelBlobFile {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

export interface VercelBlobUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  file?: VercelBlobFile;
}

// Configuration pour Vercel Blob
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_READ_WRITE_TOKEN) {
  console.warn('BLOB_READ_WRITE_TOKEN not found. Vercel Blob will not work.');
}

export async function uploadToVercelBlob(
  file: File | Buffer,
  filename: string,
  contentType: string,
  userId?: string
): Promise<VercelBlobUploadResult> {
  try {
    if (!BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN not configured');
    }

    // Créer un chemin unique avec l'ID utilisateur
    const path = userId ? `${userId}/${filename}` : filename;
    
    const blob = await put(path, file, {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
    });

    return {
      success: true,
      url: blob.url,
      file: {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType || contentType,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      }
    };
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function deleteFromVercelBlob(
  url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN not configured');
    }

    await del(url, { token: BLOB_READ_WRITE_TOKEN });
    return { success: true };
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function listVercelBlobFiles(
  prefix?: string
): Promise<{ success: boolean; files?: VercelBlobFile[]; error?: string }> {
  try {
    if (!BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN not configured');
    }

    const { blobs } = await list({ 
      token: BLOB_READ_WRITE_TOKEN,
      prefix 
    });

    const files: VercelBlobFile[] = blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType || '',
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));

    return { success: true, files };
  } catch (error) {
    console.error('Error listing Vercel Blob files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getVercelBlobFileInfo(
  url: string
): Promise<{ success: boolean; file?: VercelBlobFile; error?: string }> {
  try {
    if (!BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN not configured');
    }

    const blob = await head(url, { token: BLOB_READ_WRITE_TOKEN });
    
    const file: VercelBlobFile = {
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType || '',
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    };

    return { success: true, file };
  } catch (error) {
    console.error('Error getting Vercel Blob file info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
