-- =========================================================================
-- V3__add_cliente_id_agendamentos.sql
--
-- Adiciona o vínculo real entre Agendamento e Cliente. `pessoa` (texto
-- livre) é mantido por compatibilidade e continua sendo preenchido
-- automaticamente pelo AgendamentoService a partir do cliente vinculado,
-- quando houver um.
--
-- Nullable de propósito: registros existentes não têm como ser associados
-- a um cliente com segurança (pessoa é texto livre, sem garantia de
-- correspondência exata com clientes.nome). Só agendamentos novos, ou
-- editados a partir de agora, passam a ter cliente_id preenchido.
--
-- ON DELETE SET NULL: excluir um cliente não deve apagar seus
-- compromissos, só desvincular.
-- =========================================================================

ALTER TABLE agendamentos ADD COLUMN cliente_id BIGINT NULL;

ALTER TABLE agendamentos
  ADD CONSTRAINT fk_agendamentos_cliente
  FOREIGN KEY (cliente_id) REFERENCES clientes (id)
  ON DELETE SET NULL;
