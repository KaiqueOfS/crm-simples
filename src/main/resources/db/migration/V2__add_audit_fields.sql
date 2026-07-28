-- =========================================================================
-- V2__add_audit_fields.sql
--
-- Adiciona rastreamento de criação e atualização (created_at/updated_at)
-- a clientes e agendamentos.
--
-- created_at/updated_at recebem DEFAULT CURRENT_TIMESTAMP para que
-- linhas já existentes (se houver) sejam preenchidas automaticamente
-- pelo próprio banco no momento do ALTER, sem precisar de um passo de
-- backfill manual. Em operação normal, quem efetivamente controla os
-- valores é o Hibernate (@CreationTimestamp/@UpdateTimestamp, ver
-- Cliente/Agendamento e docs/DATA-AUDIT.md) — o DEFAULT aqui é só uma
-- rede de segurança para qualquer INSERT que não passe pela aplicação.
--
-- Uma coluna por ALTER TABLE, de propósito: garante compatibilidade
-- idêntica entre MySQL (produção) e H2 (testes), sem depender de
-- sintaxe de múltiplas colunas por statement que diverge entre os dois.
-- =========================================================================

ALTER TABLE clientes ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE clientes ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE agendamentos ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE agendamentos ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
