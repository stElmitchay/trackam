-- ============================================
-- SINAI TRACKER - Migration 005: Synthesis
-- ============================================
-- Adds: synthesis column on ai_analyses
-- Run this in Supabase SQL Editor AFTER migration-004-idea-evaluation.sql

ALTER TABLE ai_analyses ADD COLUMN IF NOT EXISTS synthesis jsonb;

-- ============================================
-- DONE!
-- ============================================
