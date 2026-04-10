import { redirect } from '@sveltejs/kit';
import { GITHUB_CLIENT_ID } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) throw redirect(303, '/auth/login');

	// Generate CSRF state token
	const state = crypto.randomUUID();
	cookies.set('github_oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: !import.meta.env.DEV,
		sameSite: 'lax',
		maxAge: 600 // 10 minutes
	});

	const params = new URLSearchParams({
		client_id: GITHUB_CLIENT_ID,
		scope: 'public_repo read:user',
		state,
		allow_signup: 'true'
	});

	throw redirect(302, `https://github.com/login/oauth/authorize?${params}`);
};
