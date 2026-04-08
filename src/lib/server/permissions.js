import { db } from '$lib/server/db';
import { adminList } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function isAdminUser(userId) {
    const normalizedUserId = typeof userId === 'object' ? userId?.id : userId;
    if (!normalizedUserId) {
        return false;
    }

    try {
        const [adminRecord] = await db.select().from(adminList).where(eq(adminList.userId, normalizedUserId)).limit(1);
        return Boolean(adminRecord);
    } catch (err) {
        if (err?.cause?.code === '42P01' || err?.code === '42P01') {
            return false;
        }
        throw err;
    }
}

export function hasBucketAccess(bucket, userId, isAdmin = false) {
    return Boolean(isAdmin || bucket.userId === userId || bucket.accessList?.includes(userId));
}

export function canManageBucket(bucket, userId, isAdmin = false) {
    return Boolean(isAdmin || bucket.userId === userId);
}