package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.AgendamentoResponse;
import com.kaique.crm_simples.dto.MeuDiaResponse;
import com.kaique.crm_simples.dto.ModuloIndisponivelResponse;
import com.kaique.crm_simples.model.enums.StatusAgendamento;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Agrega os dados do painel "Meu Dia" (Fase 12).
 *
 * Não acessa AgendamentoRepository diretamente: reaproveita
 * AgendamentoService.listarPorData, que já resolve o usuário autenticado e
 * já devolve a lista do dia ordenada por hora. Este service só soma o que
 * antes era calculado no frontend (próximo compromisso, pendentes,
 * concluídos, atrasados) — nenhuma regra de negócio de agendamento é
 * reimplementada aqui.
 */
@Service
public class MeuDiaService {

    private final AgendamentoService agendamentoService;
    private final Clock clock;

    public MeuDiaService(AgendamentoService agendamentoService, Clock clock) {
        this.agendamentoService = agendamentoService;
        this.clock = clock;
    }

    public MeuDiaResponse montarPainel() {
        LocalDate hoje = LocalDate.now(clock);
        LocalTime agora = LocalTime.now(clock);

        List<AgendamentoResponse> compromissosHoje = agendamentoService.listarPorData(hoje);

        List<AgendamentoResponse> pendentes = compromissosHoje.stream()
                .filter(a -> a.status() == StatusAgendamento.PENDENTE)
                .toList();

        // A lista já vem ordenada por hora crescente (AgendamentoService); o
        // primeiro pendente com hora >= agora é o próximo compromisso.
        AgendamentoResponse proximo = pendentes.stream()
                .filter(a -> !a.hora().isBefore(agora))
                .findFirst()
                .orElse(null);

        long totalConcluidos = compromissosHoje.stream()
                .filter(a -> a.status() == StatusAgendamento.CONCLUIDO)
                .count();

        // Atrasado = ainda PENDENTE com horário já passado hoje.
        long totalAtrasados = pendentes.stream()
                .filter(a -> a.hora().isBefore(agora))
                .count();

        return new MeuDiaResponse(
                proximo,
                compromissosHoje,
                pendentes.size(),
                totalConcluidos,
                totalAtrasados,
                ModuloIndisponivelResponse.indisponivel(),
                ModuloIndisponivelResponse.indisponivel());
    }
}
