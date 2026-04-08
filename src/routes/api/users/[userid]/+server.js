// If logged in, returns the user info, otherwise returns null
import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { files, buckets } from '$lib/server/db/schema'; // Drizzle ORM schema for files and buckets
import { eq, or, sql } from 'drizzle-orm'; // Drizzle ORM helpers
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET({ request }) {
    // Check if user is authenticated thorugh better auth
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    // Get user info from the database using the session.user.id
    const user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email, // Assuming email is stored in the session, otherwise fetch from DB
    };
    return json(user);
}