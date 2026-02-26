import { createSupabaseBrowserClient } from '$lib/supabase';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends }) => {
	depends('supabase:auth');
	const supabase = createSupabaseBrowserClient();

	return {
		...data,
		supabase
	};
};
