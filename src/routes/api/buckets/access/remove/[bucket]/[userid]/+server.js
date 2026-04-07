import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { files, buckets } from '$lib/server/db/schema'; // Drizzle ORM schema for files and buckets
import { eq } from 'drizzle-orm'; // Drizzle ORM helper for equality checks

export async function GET({ params, request }) {
    const { bucket, userid } = params;

    // check if user is authenticated
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    // check if bucket exists
    const [bucketExists] = await db.select().from(buckets).where(eq(buckets.name, bucket)).limit(1);
    if (!bucketExists) {
        return new Response('Bucket not found', { status: 404 });
    }
    // check if user is the owner of the bucket
    if (bucketExists.userId !== session.user.id) {
        return new Response('Access denied', { status: 403 });
    }
    // Dont let the owner remove themselves from the access list
    if (userid === bucketExists.userId) {
        return new Response('Owners cannot be removed from the access list', { status: 400 });
    }
    // Remove the user from the access list if present
    if (bucketExists.accessList?.includes(userid)) {
        const updatedAccessList = bucketExists.accessList.filter((id) => id !== userid);
        await db.update(buckets).set({ accessList: updatedAccessList }).where(eq(buckets.name, bucket));
    }

    return new Response('Access granted', { status: 200 });
}

export async function POST() {
    return new Response("POST requests are not supported for bucket access management", { status: 405 });
}