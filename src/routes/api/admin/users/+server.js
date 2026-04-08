import { json } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';

import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user as users } from '$lib/server/db/auth.schema';
import { isAdminUser } from '$lib/server/permissions';

export async function GET({ request }) {
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

    const usersList = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            createdAt: users.createdAt
        })
        .from(users)
        .orderBy(asc(users.createdAt));

    return json({ users: usersList });
}