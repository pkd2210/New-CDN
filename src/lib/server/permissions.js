import { db } from '$lib/server/db';
import { adminList } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function isAdminUser(userId) {
    const [adminRecord] = await db.select().from(adminList).where(eq(adminList.userId, userId)).limit(1);
    return Boolean(adminRecord);
}

export function hasBucketAccess(bucket, userId, isAdmin = false) {
    return Boolean(isAdmin || bucket.userId === userId || bucket.accessList?.includes(userId));
}

export function canManageBucket(bucket, userId, isAdmin = false) {
    return Boolean(isAdmin || bucket.userId === userId);
}