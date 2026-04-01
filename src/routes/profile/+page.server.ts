import { fail, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase-admin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session, supabase }, url }) => {
	if (!session) throw redirect(303, '/auth/login');

	const [{ data: profile }, { data: githubConnection }] = await Promise.all([
		supabase.from('profiles').select('*').eq('id', session.user.id).single(),
		supabase.from('github_connections').select('github_username, connected_at, scopes').eq('user_id', session.user.id).single()
	]);

	return {
		profile,
		githubConnection,
		githubJustConnected: url.searchParams.get('github') === 'connected'
	};
};

export const actions: Actions = {
	update: async ({ request, locals: { supabase, session } }) => {
		if (!session) return fail(401, { error: 'Not authenticated' });

		const formData = await request.formData();
		const full_name = (formData.get('full_name') as string)?.trim();
		const department = (formData.get('department') as string)?.trim();
		const title = (formData.get('title') as string)?.trim();
		const avatarFile = formData.get('avatar') as File | null;

		if (!full_name) {
			return fail(400, { error: 'Full name is required' });
		}

		const updateData: Record<string, any> = { full_name, department, title };

		// Handle avatar upload
		if (avatarFile && avatarFile.size > 0) {
			if (avatarFile.size > 2 * 1024 * 1024) {
				return fail(400, { error: 'Avatar must be under 2MB' });
			}

			const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
			if (!allowedTypes.includes(avatarFile.type)) {
				return fail(400, { error: 'Avatar must be a JPEG, PNG, WebP, or GIF image' });
			}

			const ext = avatarFile.name.split('.').pop() || 'jpg';
			const filePath = `${session.user.id}/avatar.${ext}`;

			const { error: uploadError } = await supabase.storage
				.from('avatars')
				.upload(filePath, avatarFile, { upsert: true });

			if (uploadError) {
				return fail(500, { error: `Upload failed: ${uploadError.message}` });
			}

			const { data: urlData } = supabase.storage
				.from('avatars')
				.getPublicUrl(filePath);

			// Append cache-buster so browser reloads the new avatar
			updateData.avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
		}

		const { error } = await supabase
			.from('profiles')
			.update(updateData)
			.eq('id', session.user.id);

		if (error) return fail(500, { error: error.message });

		return { success: true };
	},

	disconnectGithub: async ({ locals: { session } }) => {
		if (!session) return fail(401, { error: 'Not authenticated' });

		await supabaseAdmin
			.from('github_connections')
			.delete()
			.eq('user_id', session.user.id);

		await supabaseAdmin
			.from('profiles')
			.update({ github_username: null, github_connected: false })
			.eq('id', session.user.id);

		return { success: true };
	},

	logout: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		throw redirect(303, '/auth/login');
	}
};
