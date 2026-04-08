import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { files, buckets } from '$lib/server/db/schema';
import { eq, or, sql } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

export async function GET({ request, params }) {
    const { bucket } = params;

    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const [bucketInfo] = await db
        .select()
        .from(buckets)
        .where(
            eq(buckets.name, bucket),
            or(
                eq(buckets.userId, session.user.id),
                sql`${session.user.id} = ANY(${buckets.accessList})`
            )
        )
        .limit(1);

    if (!bucketInfo) {
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