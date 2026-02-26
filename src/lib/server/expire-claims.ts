import type { SupabaseClient } from '@supabase/supabase-js';
import { CLAIM_DEADLINE_DAYS, CLAIM_ABANDON_XP_PENALTY } from '$lib/constants';

export async function expireOverdueClaims(supabase: SupabaseClient) {
	const deadline = new Date();
	deadline.setDate(deadline.getDate() - CLAIM_DEADLINE_DAYS);

	const { data: overdue } = await supabase
		.from('tool_requests')
		.select('id, claimed_by, bonus_xp')
		.eq('status', 'claimed')
		.not('claimed_at', 'is', null)
		.lt('claimed_at', deadline.toISOString());

	if (!overdue || overdue.length === 0) return;

	for (const req of overdue) {
		// Reset claim and add the penalty to the request's bounty
		await supabase
			.from('tool_requests')
			.update({
				status: 'open',
				claimed_by: null,
				claimed_at: null,
				bonus_xp: (req.bonus_xp ?? 0) + CLAIM_ABANDON_XP_PENALTY
			})
			.eq('id', req.id);

		// Deduct XP from the person who abandoned
		if (req.claimed_by) {
			await supabase.rpc('deduct_xp', {
				user_id: req.claimed_by,
				amount: CLAIM_ABANDON_XP_PENALTY
			});
		}
	}
}
