import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  return NextResponse.json({
    hasBlobToken,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown'
  });
}
