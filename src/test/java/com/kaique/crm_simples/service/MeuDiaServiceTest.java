package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.AgendamentoResponse;
import com.kaique.crm_simples.dto.MeuDiaResponse;
import com.kaique.crm_simples.model.enums.StatusAgendamento;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * MeuDiaService só agrega o que AgendamentoService já devolve — por isso
 * aqui mockamos AgendamentoService, não o repository, e fixamos o Clock em
 * 12:00 para os testes de "próximo"/"atrasado" serem determinísticos.
 */
@ExtendWith(MockitoExtension.class)
class MeuDiaServiceTest {

    private static final ZoneId ZONA = ZoneId.systemDefault();
    private static final LocalDate HOJE = LocalDate.of(2026, 7, 30);
    private static final Clock CLOCK_MEIO_DIA =
            Clock.fixed(LocalDateTime.of(HOJE, LocalTime.NOON).atZone(ZONA).toInstant(), ZONA);

    @Mock
    private AgendamentoService agendamentoService;

    private MeuDiaService service;

    @BeforeEach
    void setUp() {
        service = new MeuDiaService(agendamentoService, CLOCK_MEIO_DIA);
    }

    @Test
    void calculaProximoPendentesConcluidosEAtrasadosCorretamente() {
        AgendamentoResponse concluidoDeManha = agendamento(1L, LocalTime.of(9, 0), StatusAgendamento.CONCLUIDO);
        AgendamentoResponse atrasado = agendamento(2L, LocalTime.of(10, 0), StatusAgendamento.PENDENTE);
        AgendamentoResponse proximoEsperado = agendamento(3L, LocalTime.of(14, 0), StatusAgendamento.PENDENTE);
        AgendamentoResponse futuroDistante = agendamento(4L, LocalTime.of(18, 0), StatusAgendamento.PENDENTE);

        when(agendamentoService.listarPorData(HOJE))
                .thenReturn(List.of(concluidoDeManha, atrasado, proximoEsperado, futuroDistante));

        MeuDiaResponse painel = service.montarPainel();

        assertEquals(proximoEsperado, painel.proximoCompromisso());
        assertEquals(3, painel.totalPendentes());
        assertEquals(1, painel.totalConcluidos());
        assertEquals(1, painel.totalAtrasados());
    }

    @Test
    void retornaProximoNuloQuandoNaoHaPendenteFuturo() {
        AgendamentoResponse atrasado = agendamento(1L, LocalTime.of(8, 0), StatusAgendamento.PENDENTE);
        AgendamentoResponse concluido = agendamento(2L, LocalTime.of(9, 0), StatusAgendamento.CONCLUIDO);

        when(agendamentoService.listarPorData(HOJE)).thenReturn(List.of(atrasado, concluido));

        MeuDiaResponse painel = service.montarPainel();

        assertNull(painel.proximoCompromisso());
        assertEquals(1, painel.totalPendentes());
        assertEquals(1, painel.totalAtrasados());
    }

    @Test
    void marcaFinanceiroEOrcamentosComoIndisponiveis() {
        when(agendamentoService.listarPorData(any())).thenReturn(List.of());

        MeuDiaResponse painel = service.montarPainel();

        assertFalse(painel.financeiro().disponivel());
        assertFalse(painel.orcamentos().disponivel());
    }

    private static AgendamentoResponse agendamento(Long id, LocalTime hora, StatusAgendamento status) {
        return new AgendamentoResponse(
                id, "Compromisso " + id, "Cliente " + id, id, HOJE, hora,
                "atendimento", 0, status, null, null, null);
    }
}
