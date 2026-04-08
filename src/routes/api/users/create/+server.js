import { json } from '@sveltejs/kit';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';

import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { account as accounts, user as users } from '$lib/server/db/schema';
import { isAdminUser } from '$lib/server/permissions';

export async function POST({ request }) {
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
        return new Response('Access denied', { status: 403 });
    }
    const data = await request.json();
    const { name, email, password } = data;
    if (!name || !email || !password) {
        return new Response('Missing required fields', { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
    if (existingUser) {
        return new Response('User with this email already exists', { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    await db.transaction(async (tx) => {
        await tx.insert(users).values({
            id: userId,
            name: name.trim(),
            email: normalizedEmail,
            emailVerified: false
        });

        await tx.insert(accounts).values({
            id: crypto.randomUUID(),
            userId,
            providerId: 'credential',
            accountId: userId,
            password: passwordHash
        });
    });

    return json({ message: 'User created successfully', userId });
}