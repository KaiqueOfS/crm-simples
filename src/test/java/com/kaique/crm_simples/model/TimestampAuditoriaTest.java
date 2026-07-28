package com.kaique.crm_simples.model;

import com.kaique.crm_simples.repository.AgendamentoRepository;
import com.kaique.crm_simples.repository.ClienteRepository;
import com.kaique.crm_simples.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * @CreationTimestamp/@UpdateTimestamp só disparam de verdade quando o
 * Hibernate persiste através de um EntityManager real — um repository
 * mockado (como em ClienteServiceTest/AgendamentoServiceTest) nunca
 * executa esse ciclo de vida, só devolve o que foi programado no mock.
 *
 * Por isso este teste usa @DataJpaTest: sobe um contexto JPA real
 * contra o H2 de teste, com o Flyway aplicando V1 + V2 normalmente
 * (Replace.NONE garante que não troca pelo datasource auto-configurado
 * do @DataJpaTest, e sim usa o H2 já definido em application.properties).
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TimestampAuditoriaTest {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private AgendamentoRepository agendamentoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void criacaoDeClientePreencheCreatedAtEUpdatedAt() {
        Usuario dono = usuarioRepository.save(usuarioNovo("dono1@teste.local"));

        Cliente cliente = new Cliente();
        cliente.setNome("Ana Paula");
        cliente.setTelefone("11999999999");
        cliente.setUsuario(dono);

        Cliente salvo = clienteRepository.save(cliente);

        assertThat(salvo.getCreatedAt()).isNotNull();
        assertThat(salvo.getUpdatedAt()).isNotNull();
    }

    @Test
    void atualizacaoDeClienteAlteraUpdatedAtMasNaoCreatedAt() throws InterruptedException {
        Usuario dono = usuarioRepository.save(usuarioNovo("dono2@teste.local"));

        Cliente cliente = new Cliente();
        cliente.setNome("Carlos Souza");
        cliente.setTelefone("11988888888");
        cliente.setUsuario(dono);
        cliente = clienteRepository.saveAndFlush(cliente);

        LocalDateTime criadoEm = cliente.getCreatedAt();
        LocalDateTime atualizadoInicial = cliente.getUpdatedAt();

        Thread.sleep(5); // garante um instante distinto para o novo updatedAt
        cliente.setNome("Carlos Souza Alterado");
        Cliente atualizado = clienteRepository.saveAndFlush(cliente);

        assertThat(atualizado.getCreatedAt()).isEqualTo(criadoEm);
        assertThat(atualizado.getUpdatedAt()).isAfter(atualizadoInicial);
    }

    @Test
    void criacaoDeAgendamentoPreencheCreatedAtEUpdatedAt() {
        Usuario dono = usuarioRepository.save(usuarioNovo("dono3@teste.local"));

        Agendamento agendamento = new Agendamento();
        agendamento.setTitulo("Visita técnica");
        agendamento.setData(LocalDate.now());
        agendamento.setHora(LocalTime.of(9, 0));
        agendamento.setUsuario(dono);

        Agendamento salvo = agendamentoRepository.save(agendamento);

        assertThat(salvo.getCreatedAt()).isNotNull();
        assertThat(salvo.getUpdatedAt()).isNotNull();
    }

    @Test
    void atualizacaoDeAgendamentoAlteraUpdatedAtMasNaoCreatedAt() throws InterruptedException {
        Usuario dono = usuarioRepository.save(usuarioNovo("dono4@teste.local"));

        Agendamento agendamento = new Agendamento();
        agendamento.setTitulo("Reunião");
        agendamento.setData(LocalDate.now());
        agendamento.setHora(LocalTime.of(14, 0));
        agendamento.setUsuario(dono);
        agendamento = agendamentoRepository.saveAndFlush(agendamento);

        LocalDateTime criadoEm = agendamento.getCreatedAt();
        LocalDateTime atualizadoInicial = agendamento.getUpdatedAt();

        Thread.sleep(5);
        agendamento.setTitulo("Reunião remarcada");
        Agendamento atualizado = agendamentoRepository.saveAndFlush(agendamento);

        assertThat(atualizado.getCreatedAt()).isEqualTo(criadoEm);
        assertThat(atualizado.getUpdatedAt()).isAfter(atualizadoInicial);
    }

    private Usuario usuarioNovo(String email) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário Teste");
        usuario.setEmail(email);
        usuario.alterarSenha("hash-fake");
        return usuario;
    }
}
