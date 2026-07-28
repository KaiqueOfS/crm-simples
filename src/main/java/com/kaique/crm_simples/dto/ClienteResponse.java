package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.StatusLead;

import java.time.LocalDateTime;

/**
 * Dados de um cliente expostos pela API.
 *
 * Nunca inclui o "usuario" dono do registro — o isolamento por conta
 * é garantido no service, não precisa (e não deve) vazar na resposta.
 *
 * "createdAt"/"updatedAt" são só leitura: vêm de @CreationTimestamp/
 * @UpdateTimestamp na entidade (ver docs/DATA-AUDIT.md) e nunca
 * aparecem em ClienteRequest — o cliente da API não define isso.
 */
public record ClienteResponse(
        Long id,
        String nome,
        String telefone,
        String email,
        String observacoes,
        StatusLead statusLead,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static ClienteResponse de(Cliente cliente) {
        return new ClienteResponse(
                cliente.getId(),
                cliente.getNome(),
                cliente.getTelefone(),
                cliente.getEmail(),
                cliente.getObservacoes(),
                cliente.getStatus(),
                cliente.getCreatedAt(),
                cliente.getUpdatedAt());
    }
}
