package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.Agendamento;
import com.kaique.crm_simples.model.enums.StatusAgendamento;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Dados de um agendamento expostos pela API — sem o "usuario" dono.
 *
 * "createdAt"/"updatedAt" são só leitura: vêm de @CreationTimestamp/
 * @UpdateTimestamp na entidade (ver docs/DATA-AUDIT.md) e nunca
 * aparecem em AgendamentoRequest.
 *
 * "clienteId" é null quando o agendamento não está vinculado a um cliente
 * (ver V3__add_cliente_id_agendamentos.sql). "pessoa" continua presente e
 * sincronizado com o nome do cliente pelo AgendamentoService, para telas
 * que só precisam exibir o nome sem buscar a lista de clientes de novo.
 *
 * "status" (PENDENTE/CONCLUIDO/CANCELADO) — ver StatusAgendamento e
 * V4__add_status_agendamento.sql.
 */
public record AgendamentoResponse(
        Long id,
        String titulo,
        String pessoa,
        Long clienteId,
        LocalDate data,
        LocalTime hora,
        String categoria,
        Integer lembrete,
        StatusAgendamento status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static AgendamentoResponse de(Agendamento agendamento) {
        return new AgendamentoResponse(
                agendamento.getId(),
                agendamento.getTitulo(),
                agendamento.getPessoa(),
                agendamento.getCliente() != null ? agendamento.getCliente().getId() : null,
                agendamento.getData(),
                agendamento.getHora(),
                agendamento.getCategoria(),
                agendamento.getLembrete(),
                agendamento.getStatus(),
                agendamento.getCreatedAt(),
                agendamento.getUpdatedAt());
    }
}
