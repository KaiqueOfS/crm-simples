package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.StatusLead;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Cliente.createdAt/updatedAt não têm setter público (só o Hibernate
 * deveria preenchê-los), então usamos ReflectionTestUtils para simular
 * uma entidade já persistida — mesmo padrão já usado nos testes de
 * service para simular o "id" gerado pelo banco.
 */
class ClienteResponseTest {

    @Test
    void deCopiaTodosOsCamposIncluindoTimestamps() {
        Cliente cliente = new Cliente();
        cliente.setNome("Ana Paula");
        cliente.setTelefone("11999999999");
        cliente.setEmail("ana@teste.local");
        cliente.setObservacoes("Cliente prioritário");
        cliente.setStatus(StatusLead.GANHO);
        ReflectionTestUtils.setField(cliente, "id", 42L);

        LocalDateTime criadoEm = LocalDateTime.of(2026, 1, 10, 8, 30);
        LocalDateTime atualizadoEm = LocalDateTime.of(2026, 1, 12, 9, 0);
        ReflectionTestUtils.setField(cliente, "createdAt", criadoEm);
        ReflectionTestUtils.setField(cliente, "updatedAt", atualizadoEm);

        ClienteResponse resposta = ClienteResponse.de(cliente);

        assertEquals(42L, resposta.id());
        assertEquals("Ana Paula", resposta.nome());
        assertEquals(StatusLead.GANHO, resposta.statusLead());
        assertEquals(criadoEm, resposta.createdAt());
        assertEquals(atualizadoEm, resposta.updatedAt());
    }
}
