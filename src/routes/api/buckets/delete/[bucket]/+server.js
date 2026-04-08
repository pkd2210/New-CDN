import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { files, buckets } from '$lib/server/db/schema'; // Drizzle ORM schema for files and buckets
import { eq } from 'drizzle-orm'; // Drizzle ORM helper for equality checks
import { canManageBucket, isAdminUser } from '$lib/server/permissions';

export async function GET({ params, request }) {
    const { bucket } = params;

    // Check if user is authenticated thorugh better auth
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    const isAdmin = await isAdminUser(session.user.id);
    // Check if user is the owner of the bucket
    const [bucketExists] = await db.select().from(buckets).where(eq(buckets.name, bucket)).limit(1);
    if (!bucketExists) {
        return new Response('Bucket not found', { status: 404 });
    }
    if (!canManageBucket(bucketExists, session.user.id, isAdmin)) {
        return new Response('Access denied', { status: 403 });
    }
    // Delete the bucket
    await db.delete(buckets).where(eq(buckets.name, bucket));
    // delete all files in the bucket (cascading delete will handle fileData)
    await db.delete(files).where(eq(files.bucket, bucket));

    return new Response('Bucket deleted successfully', { status: 200 });
}

export async function DELETE() {
    // run it as it was get
    return await GET(...arguments);
}