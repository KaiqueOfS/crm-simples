package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.AgendamentoRequest;
import com.kaique.crm_simples.dto.AgendamentoResponse;
import com.kaique.crm_simples.exception.AcessoNegadoException;
import com.kaique.crm_simples.exception.AgendamentoNaoEncontradoException;
import com.kaique.crm_simples.model.Agendamento;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.AgendamentoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Espelha ClienteServiceTest: garante que o mesmo padrão de isolamento
 * (buscarDoUsuario) protege agendamentos da mesma forma que protege
 * clientes — mesmo mecanismo, mesma cobertura.
 */
@ExtendWith(MockitoExtension.class)
class AgendamentoServiceTest {

    @Mock
    private AgendamentoRepository repository;

    @Mock
    private UsuarioAutenticadoService usuarioAutenticadoService;

    private AgendamentoService service;
    private Usuario usuarioLogado;

    @BeforeEach
    void setUp() {
        service = new AgendamentoService(repository, usuarioAutenticadoService);
        usuarioLogado = usuarioComId(1L);
        when(usuarioAutenticadoService.obterUsuarioLogado()).thenReturn(usuarioLogado);
    }

    @Test
    void naoPermiteAtualizarAgendamentoDeOutroUsuario() {
        Agendamento agendamentoDeOutroUsuario = new Agendamento();
        agendamentoDeOutroUsuario.setUsuario(usuarioComId(2L));
        when(repository.findById(10L)).thenReturn(Optional.of(agendamentoDeOutroUsuario));

        AgendamentoRequest novosDados = new AgendamentoRequest();
        novosDados.setTitulo("Alterado por outro usuário");
        novosDados.setData(LocalDate.now());
        novosDados.setHora(LocalTime.NOON);

        assertThrows(AcessoNegadoException.class, () -> service.atualizar(10L, novosDados));

        verify(repository, never()).save(any(Agendamento.class));
    }

    @Test
    void naoPermiteExcluirAgendamentoDeOutroUsuario() {
        Agendamento agendamentoDeOutroUsuario = new Agendamento();
        agendamentoDeOutroUsuario.setUsuario(usuarioComId(2L));
        when(repository.findById(10L)).thenReturn(Optional.of(agendamentoDeOutroUsuario));

        assertThrows(AcessoNegadoException.class, () -> service.deletar(10L));

        verify(repository, never()).delete(agendamentoDeOutroUsuario);
    }

    @Test
    void lancaExcecaoQuandoAgendamentoNaoExiste() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(AgendamentoNaoEncontradoException.class, () -> service.deletar(99L));
    }

    @Test
    void associaAgendamentoNovoAoUsuarioAutenticado() {
        AgendamentoRequest request = new AgendamentoRequest();
        request.setTitulo("Visita técnica");
        request.setData(LocalDate.now());
        request.setHora(LocalTime.of(9, 0));

        when(repository.save(any(Agendamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        AgendamentoResponse resposta = service.salvar(request);

        ArgumentCaptor<Agendamento> captor = ArgumentCaptor.forClass(Agendamento.class);
        verify(repository).save(captor.capture());

        // O dono é sempre o usuário autenticado — nunca algo vindo do request,
        // que sequer tem um campo "usuario" para carregar isso.
        assertSame(usuarioLogado, captor.getValue().getUsuario());
        assertEquals("Visita técnica", resposta.titulo());
    }

    private Usuario usuarioComId(Long id) {
        Usuario usuario = new Usuario();
        ReflectionTestUtils.setField(usuario, "id", id);
        usuario.setEmail("usuario" + id + "@teste.local");
        return usuario;
    }
}
