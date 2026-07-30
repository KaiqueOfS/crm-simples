package com.kaique.crm_simples.dto;

import java.util.List;

/**
 * Painel agregado da tela "Meu Dia" (Fase 12). Reúne em uma única resposta
 * o que antes era calculado no frontend a partir de GET /api/agendamentos:
 * próximo compromisso, lista do dia e os contadores (pendentes, concluídos,
 * atrasados). "financeiro"/"orcamentos" existem só para o frontend parar de
 * mockar esses cards — os módulos em si ainda não foram implementados.
 */
public record MeuDiaResponse(
        AgendamentoResponse proximoCompromisso,
        List<AgendamentoResponse> compromissosHoje,
        long totalPendentes,
        long totalConcluidos,
        long totalAtrasados,
        ModuloIndisponivelResponse financeiro,
        ModuloIndisponivelResponse orcamentos) {
}
