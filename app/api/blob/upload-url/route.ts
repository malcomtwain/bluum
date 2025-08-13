import { NextResponse } from 'next/server';
import { generateUploadURL } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(request: Request) {
	try {
		if (!process.env.BLOB_READ_WRITE_TOKEN) {
			return NextResponse.json({ error: 'Missing BLOB_READ_WRITE_TOKEN' }, { status: 500 });
		}
		const body = await request.json().catch(() => ({} as any));
		const { filename, contentType } = body || {};
    const res = await generateUploadURL({
			access: 'public',
			token: process.env.BLOB_READ_WRITE_TOKEN,
			// Optionally constrain content types
			allowedContentTypes: ['video/*', 'image/*', 'audio/*', 'application/octet-stream']
		});
    return NextResponse.json({ uploadUrl: res.url, blobPath: res.pathname, filename, contentType });
	} catch (error: any) {
		return NextResponse.json({ error: error?.message || 'Failed to create upload URL' }, { status: 500 });
	}
}
