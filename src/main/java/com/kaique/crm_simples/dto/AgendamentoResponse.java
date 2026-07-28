package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.Agendamento;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Dados de um agendamento expostos pela API — sem o "usuario" dono.
 *
 * "createdAt"/"updatedAt" são só leitura: vêm de @CreationTimestamp/
 * @UpdateTimestamp na entidade (ver docs/DATA-AUDIT.md) e nunca
 * aparecem em AgendamentoRequest.
 */
public record AgendamentoResponse(
        Long id,
        String titulo,
        String pessoa,
        LocalDate data,
        LocalTime hora,
        String categoria,
        Integer lembrete,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static AgendamentoResponse de(Agendamento agendamento) {
        return new AgendamentoResponse(
                agendamento.getId(),
                agendamento.getTitulo(),
                agendamento.getPessoa(),
                agendamento.getData(),
                agendamento.getHora(),
                agendamento.getCategoria(),
                agendamento.getLembrete(),
                agendamento.getCreatedAt(),
                agendamento.getUpdatedAt());
    }
}
