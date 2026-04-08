// If logged in, returns the user info, otherwise returns null
import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { user as users } from '$lib/server/db/schema'; // Drizzle ORM auth user table
import { eq } from 'drizzle-orm'; // Drizzle ORM helpers
import { json } from '@sveltejs/kit';

export async function GET({ request, params }) {
    // Check if user is authenticated thorugh better auth
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
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

    // Get user info from the database using the database
    const user = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email
    };
    return json(user);
}