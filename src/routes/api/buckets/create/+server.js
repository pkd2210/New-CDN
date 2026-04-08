import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { buckets } from '$lib/server/db/schema';
import { isAdminUser } from '$lib/server/permissions';
import { eq } from 'drizzle-orm';

export async function POST({ request }) {
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
        return new Response('Forbidden', { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const bucketName = body?.bucketName?.trim();
    const useMyselfAsOwner = body?.useMyselfAsOwner !== false;
    const requestedOwnerId = body?.ownerId?.trim();
    const sizeLimitGb = Number(body?.sizeLimitGb);

    if (!bucketName) {
        return new Response('Bucket name is required', { status: 400 });
    }
    if (!Number.isFinite(sizeLimitGb) || sizeLimitGb <= 0) {
        return new Response('GB amount must be a positive number', { status: 400 });
    }

    const ownerId = useMyselfAsOwner ? session.user.id : requestedOwnerId;
    if (!ownerId) {
        return new Response('Owner is required when not using myself', { status: 400 });
    }

    const [existingBucket] = await db.select().from(buckets).where(eq(buckets.name, bucketName)).limit(1);
    if (existingBucket) {
        return new Response('Bucket name already exists', { status: 409 });
    }

    const sizeLimitBytes = Math.floor(sizeLimitGb * 1024 * 1024 * 1024);

    await db.insert(buckets).values({
        name: bucketName,
        userId: ownerId,
        publication: 'private',
        accessList: [ownerId],
        sizeLimit: sizeLimitBytes
    });

    return new Response('Bucket created successfully', { status: 201 });
}
