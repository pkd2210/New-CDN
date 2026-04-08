// return the user's buckets thorugh the /api/me endpoint
import { auth } from '$lib/server/auth';
import { isAdminUser } from '$lib/server/permissions';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request, fetch }) {
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return { user: null, buckets: [], users: [] };
    }
    const isAdmin = await isAdminUser(session.user.id);
    // Fetch the user's buckets from the /api/me endpoint
    const [meResponse, usersResponse] = await Promise.all([
        fetch('/api/me'),
        isAdmin ? fetch('/api/admin/users') : Promise.resolve(null)
    ]);

    if (!meResponse.ok) {
        return { user: session.user, buckets: [], users: [] };
    }

    const buckets = await meResponse.json();
    const usersData = usersResponse && usersResponse.ok ? await usersResponse.json() : { users: [] };

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
    return {
        user: {
            ...session.user,
            isAdmin
        },
        buckets,
        users: usersData.users ?? []
    };
}