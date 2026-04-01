import { redirect, error } from '@sveltejs/kit';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) throw redirect(303, '/auth/login');

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('github_oauth_state');

	// Validate CSRF state
	if (!code || !state || state !== storedState) {
		throw error(400, 'Invalid OAuth state. Please try connecting again.');
	}

	cookies.delete('github_oauth_state', { path: '/' });

	// Exchange code for access token
	const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		body: JSON.stringify({
			client_id: GITHUB_CLIENT_ID,
			client_secret: GITHUB_CLIENT_SECRET,
			code
		})
	});

	const tokenData = await tokenResponse.json();

	if (tokenData.error) {
		throw error(400, `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
	}

	const { access_token, refresh_token, expires_in, scope } = tokenData;

	// Fetch GitHub user profile
	const userResponse = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${access_token}`,
			Accept: 'application/vnd.github+json'
		}
	});

	if (!userResponse.ok) {
		throw error(502, 'Failed to fetch GitHub user profile');
	}

	const githubUser = await userResponse.json();

	// Store the connection using service role (bypasses RLS)
	const { error: upsertError } = await supabaseAdmin
		.from('github_connections')
		.upsert({
			user_id: session.user.id,
			github_user_id: githubUser.id,
			github_username: githubUser.login,
			access_token,
			refresh_token: refresh_token || null,
			token_expires_at: expires_in
				? new Date(Date.now() + expires_in * 1000).toISOString()
				: null,
			scopes: scope ? scope.split(',') : [],
			updated_at: new Date().toISOString()
		}, { onConflict: 'user_id' });

	if (upsertError) {
		throw error(500, `Failed to save GitHub connection: ${upsertError.message}`);
	}

	// Update profile with GitHub info
	await supabaseAdmin
		.from('profiles')
		.update({
			github_username: githubUser.login,
			github_connected: true
		})
		.eq('id', session.user.id);

	throw redirect(303, '/profile?github=connected');
};
