// if logged in, and in acess list, return bucket info, with file list, otherwise return 404
import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { files, buckets } from '$lib/server/db/schema'; // Drizzle ORM schema for files and buckets
import { eq, or, sql } from 'drizzle-orm'; // Drizzle ORM helpers
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET({ request, params }) {
    const { bucket } = params;
    // Check if user is authenticated thorugh better auth
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    // Check if bucket exists and user has access to it
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
    // Get files in the bucket
    const bucketFiles = await db.select().from(files).where(eq(files.bucket, bucket));
    return json({ bucket: bucketInfo, files: bucketFiles });
}