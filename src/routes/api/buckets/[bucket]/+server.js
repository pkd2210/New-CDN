// if logged in, and in acess list, return bucket info, with file list, otherwise return 404
import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { files, buckets } from '$lib/server/db/schema'; // Drizzle ORM schema for files and buckets
import { eq } from 'drizzle-orm'; // Drizzle ORM helpers
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasBucketAccess, isAdminUser } from '$lib/server/permissions';

export async function GET({ request, params }) {
    const { bucket } = params;
    // Check if user is authenticated thorugh better auth
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    const isAdmin = await isAdminUser(session.user.id);

    // Check if bucket exists and user has access to it
    const [bucketInfo] = await db
        .select()
        .from(buckets)
        .where(eq(buckets.name, bucket))
        .limit(1);
    if (!bucketInfo || !hasBucketAccess(bucketInfo, session.user.id, isAdmin)) {
        return new Response('Bucket not found', { status: 404 });
    }
    // Get files in the bucket (metadata only)
    const bucketFiles = await db.select({
        id: files.id,
        bucket: files.bucket,
        userId: files.userId,
        name: files.name,
        mimeType: files.mimeType,
        size: files.size,
        createdAt: files.createdAt
    }).from(files).where(eq(files.bucket, bucket));
    return json({ bucket: bucketInfo, files: bucketFiles });
}