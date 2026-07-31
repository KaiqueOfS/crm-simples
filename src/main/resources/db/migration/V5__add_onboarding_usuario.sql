-- =========================================================================
-- V5__add_onboarding_usuario.sql
--
-- Marca se o usuário já concluiu a configuração inicial (Sprint 14).
-- DEFAULT FALSE cobre linhas existentes (usuários já cadastrados antes
-- desta sprint) — eles verão a tela de onboarding no próximo acesso,
-- o que é o comportamento esperado.
-- =========================================================================

ALTER TABLE usuarios ADD COLUMN onboarding_concluido BOOLEAN NOT NULL DEFAULT FALSE;
