-- Migration 007: AI Analysis Pipeline Redesign
-- Adds columns for enhanced next steps (done_when, addresses),
-- implementation plan mode (implementation_plan, plan_status),
-- and commit SHA tracking for diff-based analysis.

-- 1. Enhanced next_steps columns
ALTER TABLE next_steps
  ADD COLUMN IF NOT EXISTS done_when text,
  ADD COLUMN IF NOT EXISTS addresses jsonb,
  ADD COLUMN IF NOT EXISTS implementation_plan jsonb,
  ADD COLUMN IF NOT EXISTS plan_status text CHECK (plan_status IN ('planning', 'ready', 'approved', 'failed'));

-- 2. Track the HEAD commit SHA at analysis time for diff comparisons
ALTER TABLE ai_analyses
  ADD COLUMN IF NOT EXISTS commit_sha text;

-- 3. Index for finding steps by plan status (for admin views)
CREATE INDEX IF NOT EXISTS idx_next_steps_plan_status ON next_steps(plan_status) WHERE plan_status IS NOT NULL;

-- 4. Comment on new columns for documentation
COMMENT ON COLUMN next_steps.done_when IS 'Concrete completion criteria that can be verified';
COMMENT ON COLUMN next_steps.addresses IS 'Array of evaluation findings this step addresses, e.g. ["dpg:criterion-2", "idea:feasibility"]';
COMMENT ON COLUMN next_steps.implementation_plan IS 'AI-generated implementation plan (JSON) awaiting user approval';
COMMENT ON COLUMN next_steps.plan_status IS 'Plan lifecycle: planning -> ready -> approved/failed';
COMMENT ON COLUMN ai_analyses.commit_sha IS 'HEAD commit SHA at analysis time, used as base for next diff comparison';
