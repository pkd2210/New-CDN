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
    // Check for duplicate buckets
    const [existingBucket] = await db.select().from(buckets).where(eq(buckets.name, bucket)).limit(1);
    if (existingBucket) {
        return new Response('Bucket name already exists', { status: 409 });
    }
    // Create the bucket
    await db.insert(buckets).values({
        name: bucket,
        userId: session.user.id, // Use the authenticated user's ID
        publication: 'private', // Default to private, can be updated later
        accessList: [session.user.id], // Owner has access by default
    });

    return new Response('Bucket created successfully', { status: 201 });
}