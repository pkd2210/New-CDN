import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { account, adminList, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { svelteKitHandler } from 'better-auth/svelte-kit';

let bootstrapPromise;

async function ensureOgAdmin() {
	const adminEmail = env.OG_ADMIN_EMAIL?.trim().toLowerCase();
	const adminPassword = env.OG_ADMIN_PASSWORD?.trim();
	const adminName = env.OG_ADMIN_NAME?.trim();

	if (!adminEmail || !adminPassword || !adminName) {
		return;
	}

	try {
		const [existingUser] = await db.select().from(user).where(eq(user.email, adminEmail)).limit(1);

		let adminUserId = existingUser?.id;
		if (!adminUserId) {
			adminUserId = crypto.randomUUID();
			await db.insert(user).values({
				id: adminUserId,
				name: adminName,
				email: adminEmail,
				emailVerified: true
			});
		}

		const [credentialAccount] = await db
			.select()
			.from(account)
			.where(and(eq(account.userId, adminUserId), eq(account.providerId, 'credential')))
			.limit(1);

		if (!credentialAccount) {
			const passwordHash = await hashPassword(adminPassword);
			await db.insert(account).values({
				id: crypto.randomUUID(),
				userId: adminUserId,
				accountId: adminUserId,
				providerId: 'credential',
				password: passwordHash
			});
		}

		const [adminRecord] = await db.select().from(adminList).where(eq(adminList.userId, adminUserId)).limit(1);
		if (!adminRecord) {
			await db.insert(adminList).values({ userId: adminUserId });
		}
	} catch (err) {
		if (err?.cause?.code === '42P01' || err?.code === '42P01') {
			return;
		}
		throw err;
	}
}

/** @type {import('@sveltejs/kit').Handle} */ const handleBetterAuth = async ({ event, resolve }) => {
	bootstrapPromise ??= ensureOgAdmin();
	await bootstrapPromise;

	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export /** @type {import('@sveltejs/kit').Handle} */ const handle = handleBetterAuth;
