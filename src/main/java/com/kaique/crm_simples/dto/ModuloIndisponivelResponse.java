package com.kaique.crm_simples.dto;

/**
 * Representa um módulo do painel "Meu Dia" que ainda não existe no sistema
 * (Financeiro, Orçamentos). Em vez de o frontend mockar valores, o backend
 * responde explicitamente que o módulo não está disponível — quando os
 * módulos forem implementados, "disponivel" passa a true e ganham seus
 * próprios campos, sem quebrar quem já consome este DTO.
 */
public record ModuloIndisponivelResponse(boolean disponivel) {

    public static ModuloIndisponivelResponse indisponivel() {
        return new ModuloIndisponivelResponse(false);
    }
}
