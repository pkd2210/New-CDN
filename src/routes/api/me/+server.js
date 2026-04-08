import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { files, buckets } from '$lib/server/db/schema'; // Drizzle ORM schema for files and buckets
import { eq, or, sql } from 'drizzle-orm'; // Drizzle ORM helpers
import { json } from '@sveltejs/kit';
import { isAdminUser } from '$lib/server/permissions';

export async function GET({ request }) {
    // Check if user is authenticated thorugh better auth
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    const isAdmin = await isAdminUser(session.user.id);

    // Get all buckets the user owns or has been granted access to.
    const userBuckets = isAdmin
        ? await db.select().from(buckets)
        : await db
            .select()
            .from(buckets)
            .where(
                or(
                    eq(buckets.userId, session.user.id),
                    sql`${session.user.id} = ANY(${buckets.accessList})`
                )
            );
        // add a used space and free space sections
    await Promise.all(userBuckets.map(async bucket => {
        const bucketFiles = await db.select({ size: files.size }).from(files).where(eq(files.bucket, bucket.name));
        const usedSpace = bucketFiles.reduce((total, file) => total + file.size, 0);
        bucket.usedSpace = usedSpace;
        bucket.freeSpace = bucket.sizeLimit - usedSpace;
        bucket.isAdmin = isAdmin;
    }));
    return json(userBuckets);
}