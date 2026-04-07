import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { files, buckets } from '$lib/server/db/schema'; // Drizzle ORM schema for files and buckets
import { eq } from 'drizzle-orm'; // Drizzle ORM helper for equality checks

export async function GET({ params, request }) {
    const { bucket } = params;

    // Check if user is authenticated thorugh better auth
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    // check if uswer is the owner of the bucket
    const [bucketExists] = await db.select().from(buckets).where(eq(buckets.name, bucket)).limit(1);
    if (!bucketExists) {
        return new Response('Bucket not found', { status: 404 });
    }
    if (bucketExists.userId !== session.user.id) {
        return new Response('Access denied', { status: 403 });
    }
    // Toggle publication status
    const newPublicationStatus = bucketExists.publication === 'public' ? 'private' : 'public';
    await db.update(buckets).set({ publication: newPublicationStatus }).where(eq(buckets.name, bucket));

    return new Response(`Bucket publication status updated to ${newPublicationStatus}`, { status: 200 });
}

export async function POST() {
    return new Response("POST requests are not supported for updating bucket publication status", { status: 405 });
}