package com.kaique.crm_simples.model.enums;

/**
 * Situação de um agendamento. Todo agendamento novo começa como PENDENTE
 * (ver Agendamento.status e V4__add_status_agendamento.sql). Cancelamento
 * já existe como valor aqui, mas ainda não tem um endpoint próprio — só
 * "concluir" (PATCH /api/agendamentos/{id}/concluir) foi criado nesta fase.
 */
public enum StatusAgendamento {
    PENDENTE,
    CONCLUIDO,
    CANCELADO
}
