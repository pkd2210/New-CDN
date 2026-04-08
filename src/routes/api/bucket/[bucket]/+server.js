import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { files, buckets } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import { hasBucketAccess, isAdminUser } from '$lib/server/permissions';

export async function GET({ request, params }) {
    const { bucket } = params;

    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    const isAdmin = await isAdminUser(session.user.id);

    const [bucketInfo] = await db
        .select()
        .from(buckets)
        .where(eq(buckets.name, bucket))
        .limit(1);

    if (!bucketInfo || !hasBucketAccess(bucketInfo, session.user.id, isAdmin)) {
        return new Response('Bucket not found', { status: 404 });
    }

    const bucketFiles = await db.select().from(files).where(eq(files.bucket, bucket));
    
    // Map files to exclude the binary data field, only return metadata
    const fileMetadata = bucketFiles.map(file => ({
        id: file.id,
        bucket: file.bucket,
        userId: file.userId,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt
    }));
    
    return json({ bucket: bucketInfo, files: fileMetadata });
}