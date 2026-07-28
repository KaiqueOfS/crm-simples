package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.Agendamento;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AgendamentoResponseTest {

    @Test
    void deCopiaTodosOsCamposIncluindoTimestamps() {
        Agendamento agendamento = new Agendamento();
        agendamento.setTitulo("Visita técnica");
        agendamento.setPessoa("Roberto Silva");
        agendamento.setData(LocalDate.of(2026, 2, 1));
        agendamento.setHora(LocalTime.of(9, 0));
        ReflectionTestUtils.setField(agendamento, "id", 7L);

        LocalDateTime criadoEm = LocalDateTime.of(2026, 1, 20, 10, 0);
        LocalDateTime atualizadoEm = LocalDateTime.of(2026, 1, 21, 11, 0);
        ReflectionTestUtils.setField(agendamento, "createdAt", criadoEm);
        ReflectionTestUtils.setField(agendamento, "updatedAt", atualizadoEm);

        AgendamentoResponse resposta = AgendamentoResponse.de(agendamento);

        assertEquals(7L, resposta.id());
        assertEquals("Visita técnica", resposta.titulo());
        assertEquals(criadoEm, resposta.createdAt());
        assertEquals(atualizadoEm, resposta.updatedAt());
    }
}
