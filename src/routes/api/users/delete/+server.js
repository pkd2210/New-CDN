// if admin delete user
import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { user as users } from '$lib/server/db/schema'; // Drizzle ORM auth user table
import { eq } from 'drizzle-orm'; // Drizzle ORM helpers
import { json } from '@sveltejs/kit';
import { isAdminUser } from '$lib/server/permissions';

export async function GET({ request, params }) {
    // Check if user is authenticated thorugh better auth
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

    // get user info from the database using the database
    const [dbUser] = await db.select().from(users).where(eq(users.id, userid)).limit(1);
    if (!dbUser) {
        return new Response('User not found', { status: 404 });
    }

    // Delete the user
    await db.delete(users).where(eq(users.id, userid));

    return new Response('User deleted successfully', { status: 200 });
}

export async function DELETE() {
    // run it as it was get
    return await GET(...arguments);
}   