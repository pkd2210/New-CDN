// as a resault of a request, it will get the file and if public then server the file, if private then check if the user is authenticated and has access to the bucket, if yes then serve the file, if not then return 403

import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { files, buckets } from '$lib/server/db/schema'; // Drizzle ORM schema for files and buckets
import { eq } from 'drizzle-orm'; // Drizzle ORM helper for equality checks

export async function GET({ params, request }) {
    // get bucket and file name from dynamic route
    const { bucket, file } = params;
    
    // Check if bucket exists
    const [bucketExists] = await db.select().from(buckets).where(eq(buckets.name, bucket)).limit(1);
    if (!bucketExists) {
        return new Response('Bucket not found', { status: 404 });
    }
    // Check if file exists in the bucket
    const [fileRecord] = await db.select().from(files).where(eq(files.name, file), eq(files.bucket, bucket)).limit(1);
    if (!fileRecord) {
        return new Response('File not found', { status: 404 });
    }
    // If bucket is private, check if user is authenticated and has access
    if (bucketExists.publication === 'private') {
        const session = await auth.api.getSession({
            headers: request.headers
        });
        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 });
        }
        if (!bucketExists.accessList?.includes(session.user.id)) {
            return new Response('Access denied', { status: 403 });
        }
    }
    const mimeType = fileRecord.mimeType || 'application/octet-stream';
    const shouldInline = mimeType.startsWith('image/') || mimeType.startsWith('video/');

    // Serve the file
    return new Response(fileRecord.data, {
        headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `${shouldInline ? 'inline' : 'attachment'}; filename="${fileRecord.name}"`
        }
    });
}

export async function POST() {
    return new Response("POST requests are not supported for file retrieval", { status: 405 });
}