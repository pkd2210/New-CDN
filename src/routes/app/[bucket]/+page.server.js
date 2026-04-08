// return the user's bucket info from /api/me and the files from /api/bucket/[bucket]
import { auth } from '$lib/server/auth';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request, fetch, params }) {
    const { bucket } = params;
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return { user: null, bucketInfo: null, bucketFiles: [] };
    }

    const response = await fetch('/api/me');
    if (!response.ok) {
        throw error(response.status, 'Unable to load bucket list');
    }
    const buckets = await response.json();
    const bucketInfo = buckets.find((entry) => entry.name === bucket);

    if (!bucketInfo) {
        throw error(404, 'Bucket not found');
    }

    bucketInfo.isOwner = bucketInfo.userId === session.user.id;

    const ownerResponse = await fetch(`/api/users/${bucketInfo.userId}`);
    if (ownerResponse.ok) {
        const owner = await ownerResponse.json();
        bucketInfo.ownerName = owner.name;
    } else {
        bucketInfo.ownerName = 'Unknown';
    }

    const bucketResponse = await fetch(`/api/bucket/${bucket}`);
    if (!bucketResponse.ok) {
        throw error(bucketResponse.status, 'Unable to load bucket files');
    }

    const bucketData = await bucketResponse.json();

    return {
        user: session.user,
        bucketInfo,
        bucketFiles: bucketData.files ?? []
    };
}