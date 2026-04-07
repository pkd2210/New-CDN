import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { files, buckets } from '$lib/server/db/schema'; // Drizzle ORM schema for files and buckets
import { eq } from 'drizzle-orm'; // Drizzle ORM helper for equality checks
import { json } from '@sveltejs/kit';

export async function GET({ params, request }) {
    const { bucket, filename } = params;
    // Check if bucket exists
    const [bucketExists] = await db.select().from(buckets).where(eq(buckets.name, bucket)).limit(1);
    if (!bucketExists) {
        return new Response('Bucket not found', { status: 404 });
    }
    // Check if file exists in the bucket
    const [fileRecord] = await db.select().from(files).where(eq(files.name, filename), eq(files.bucket, bucket)).limit(1);
    if (!fileRecord) {
        return new Response('File not found', { status: 404 });
    }

    // check if user is allowed to delete the file 
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    if (!bucketExists.accessList?.includes(session.user.id)) {
        return new Response('Access denied', { status: 403 });
    }

    // Delete the file from the database
    await db.delete(files).where(eq(files.name, filename), eq(files.bucket, bucket));

    return new Response('File deleted successfully', { status: 200 });
}

export async function POST() {
    return new Response("POST requests are not supported for file deletion", { status: 405 });
}   