-- =========================================================================
-- V7__add_local_atendimento_agendamento.sql
--
-- Onde aquele compromisso específico acontece (Sprint 15.1) — distinto de
-- ConfiguracaoUsuario.tipo_atendimento, que descreve a capacidade da conta,
-- não o compromisso individual. Nullable e sem DEFAULT: agendamentos já
-- existentes ficam com local_atendimento = NULL (compatibilidade), e todo
-- agendamento novo passa a receber um valor via AgendamentoService.
-- =========================================================================

ALTER TABLE agendamentos ADD COLUMN local_atendimento VARCHAR(255);
