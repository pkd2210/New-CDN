// return the user's buckets thorugh the /api/me endpoint
import { auth } from '$lib/server/auth';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request, fetch }) {
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return { user: null, buckets: [] };
    }
    // Fetch the user's buckets from the /api/me endpoint
    const response = await fetch('/api/me');
    if (!response.ok) {
        return { user: session.user, buckets: [] };
    }
    const buckets = await response.json();
    // get bucket.userId from the buckets and compare it to the session.user.id, if they match, add a property "isOwner" to the bucket object and set it to true, otherwise set it to false
    buckets.forEach(bucket => {
        bucket.isOwner = bucket.userId === session.user.id;
        bucket.isAdmin = Boolean(bucket.isAdmin);
        bucket.canManage = bucket.isOwner || bucket.isAdmin;
    });
    // get the userId of the bucket and get a username from the database and add it to the bucket object as "ownerName"
    await Promise.all(buckets.map(async bucket => {
        const response = await fetch(`/api/users/${bucket.userId}`);
        if (response.ok) {
            const user = await response.json();
            bucket.ownerName = user.name;
        } else {
            bucket.ownerName = 'Unknown';
        }
    }));
    return { user: session.user, buckets };
}