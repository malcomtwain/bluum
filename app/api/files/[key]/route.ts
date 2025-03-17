import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  context: { params: { key: string } }
) {
  try {
    const fileUrl = getFileUrl(context.params.key);
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get file URL' },
      { status: 500 }
    );
  }
} 