import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
	if (!locals.session) {
		throw redirect(302, '/login');
	}

	return {};
}
