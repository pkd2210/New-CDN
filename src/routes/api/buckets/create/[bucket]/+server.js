import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { buckets } from '$lib/server/db/schema'; // Drizzle ORM schema for buckets
import { isAdminUser } from '$lib/server/permissions';
import { eq } from 'drizzle-orm'; // Drizzle ORM helper for equality checks

export async function GET({ params, request }) {
    return POST({ params, request });
}

export async function POST({ params, request }) {
    const { bucket } = params;

    // Check if user is authenticated thorugh better auth
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    // Check if user is an admin
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
        return new Response('Forbidden', { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const useMyselfAsOwner = body?.useMyselfAsOwner !== false;
    const requestedOwnerId = body?.ownerId?.trim();
    const ownerId = useMyselfAsOwner ? session.user.id : requestedOwnerId;
    const sizeLimitGb = Number(body?.sizeLimitGb ?? 5);
    const publication = body?.publication === 'public' ? 'public' : 'private';

    if (!ownerId) {
        return new Response('Owner is required when not using myself', { status: 400 });
    }
    if (!Number.isFinite(sizeLimitGb) || sizeLimitGb <= 0) {
        return new Response('GB amount must be a positive number', { status: 400 });
    }

    const sizeLimitBytes = Math.floor(sizeLimitGb * 1024 * 1024 * 1024);

    // Check for duplicate buckets
    const [existingBucket] = await db.select().from(buckets).where(eq(buckets.name, bucket)).limit(1);
    if (existingBucket) {
        return new Response('Bucket name already exists', { status: 409 });
    }
    // Create the bucket
    await db.insert(buckets).values({
        name: bucket,
        userId: ownerId,
        publication,
        accessList: [ownerId],
        sizeLimit: sizeLimitBytes
    });

    return new Response('Bucket created successfully', { status: 201 });
}