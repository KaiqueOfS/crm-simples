-- =========================================================================
-- V4__add_status_agendamento.sql
--
-- Adiciona controle de status ao Agendamento (PENDENTE, CONCLUIDO,
-- CANCELADO — ver StatusAgendamento.java).
--
-- NOT NULL DEFAULT 'PENDENTE': ao rodar o ALTER, o próprio banco preenche
-- a coluna em todas as linhas já existentes com 'PENDENTE' — não é feito
-- nenhum backfill manual, nenhum agendamento antigo é alterado por conta
-- própria além de ganhar esse valor padrão via DEFAULT.
-- =========================================================================

ALTER TABLE agendamentos ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE';
