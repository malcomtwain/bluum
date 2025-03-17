import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

    const key = await uploadFile(file, userId);
    
    return NextResponse.json({ key });
  } catch (error) {
    console.error('Error uploading file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 