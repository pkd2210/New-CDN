import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user as users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

import { isAdminUser } from '$lib/server/permissions';

async function deleteUser({ request, params }) {
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

    const { userid } = params;
    if (!userid) {
        return new Response('User id missing', { status: 400 });
    }

    const [dbUser] = await db.select().from(users).where(eq(users.id, userid)).limit(1);
    if (!dbUser) {
        return new Response('User not found', { status: 404 });
    }

    await db.delete(users).where(eq(users.id, userid));

    return new Response('User deleted successfully', { status: 200 });
}

export async function GET(context) {
    return deleteUser(context);
}

export async function DELETE(context) {
    return deleteUser(context);
}