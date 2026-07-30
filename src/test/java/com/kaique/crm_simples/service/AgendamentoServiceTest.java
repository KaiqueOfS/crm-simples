package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.AgendamentoRequest;
import com.kaique.crm_simples.dto.AgendamentoResponse;
import com.kaique.crm_simples.exception.AcessoNegadoException;
import com.kaique.crm_simples.exception.AgendamentoNaoEncontradoException;
import com.kaique.crm_simples.exception.ClienteNaoEncontradoException;
import com.kaique.crm_simples.model.Agendamento;
import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.AgendamentoRepository;
import com.kaique.crm_simples.repository.ClienteRepository;
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
import static org.junit.jupiter.api.Assertions.assertNull;
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
    private ClienteRepository clienteRepository;

    @Mock
    private UsuarioAutenticadoService usuarioAutenticadoService;

    private AgendamentoService service;
    private Usuario usuarioLogado;

    @BeforeEach
    void setUp() {
        service = new AgendamentoService(repository, clienteRepository, usuarioAutenticadoService);
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

    @Test
    void mantemPessoaLivreQuandoClienteIdAusente() {
        AgendamentoRequest request = new AgendamentoRequest();
        request.setTitulo("Ligação");
        request.setPessoa("Qualquer pessoa");
        request.setData(LocalDate.now());
        request.setHora(LocalTime.of(9, 0));

        when(repository.save(any(Agendamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        service.salvar(request);

        ArgumentCaptor<Agendamento> captor = ArgumentCaptor.forClass(Agendamento.class);
        verify(repository).save(captor.capture());

        assertEquals("Qualquer pessoa", captor.getValue().getPessoa());
        assertNull(captor.getValue().getCliente());
    }

    @Test
    void associaClienteESincronizaPessoaQuandoClienteIdValido() {
        Cliente cliente = clienteComId(5L, usuarioLogado);
        when(clienteRepository.findById(5L)).thenReturn(Optional.of(cliente));

        AgendamentoRequest request = new AgendamentoRequest();
        request.setTitulo("Visita técnica");
        request.setClienteId(5L);
        request.setData(LocalDate.now());
        request.setHora(LocalTime.of(9, 0));

        when(repository.save(any(Agendamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        service.salvar(request);

        ArgumentCaptor<Agendamento> captor = ArgumentCaptor.forClass(Agendamento.class);
        verify(repository).save(captor.capture());

        assertSame(cliente, captor.getValue().getCliente());
        assertEquals(cliente.getNome(), captor.getValue().getPessoa());
    }

    @Test
    void lancaExcecaoQuandoClienteIdNaoExiste() {
        when(clienteRepository.findById(999L)).thenReturn(Optional.empty());

        AgendamentoRequest request = new AgendamentoRequest();
        request.setTitulo("Visita técnica");
        request.setClienteId(999L);
        request.setData(LocalDate.now());
        request.setHora(LocalTime.of(9, 0));

        assertThrows(ClienteNaoEncontradoException.class, () -> service.salvar(request));
        verify(repository, never()).save(any(Agendamento.class));
    }

    @Test
    void lancaExcecaoQuandoClienteIdPertenceAOutroUsuario() {
        Cliente clienteDeOutroUsuario = clienteComId(5L, usuarioComId(2L));
        when(clienteRepository.findById(5L)).thenReturn(Optional.of(clienteDeOutroUsuario));

        AgendamentoRequest request = new AgendamentoRequest();
        request.setTitulo("Visita técnica");
        request.setClienteId(5L);
        request.setData(LocalDate.now());
        request.setHora(LocalTime.of(9, 0));

        assertThrows(AcessoNegadoException.class, () -> service.salvar(request));
        verify(repository, never()).save(any(Agendamento.class));
    }

    @Test
    void listaAgendamentosDeUmClienteDoUsuario() {
        Cliente cliente = clienteComId(5L, usuarioLogado);
        when(clienteRepository.findById(5L)).thenReturn(Optional.of(cliente));

        Agendamento agendamento = new Agendamento();
        agendamento.setTitulo("Troca de óleo");
        agendamento.setCliente(cliente);
        agendamento.setUsuario(usuarioLogado);
        when(repository.findByUsuarioAndClienteOrderByDataAscHoraAsc(usuarioLogado, cliente))
                .thenReturn(java.util.List.of(agendamento));

        java.util.List<AgendamentoResponse> resposta = service.listarPorCliente(5L);

        assertEquals(1, resposta.size());
        assertEquals("Troca de óleo", resposta.get(0).titulo());
    }

    @Test
    void lancaExcecaoAoListarPorClienteInexistente() {
        when(clienteRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ClienteNaoEncontradoException.class, () -> service.listarPorCliente(999L));
    }

    @Test
    void lancaExcecaoAoListarPorClienteDeOutroUsuario() {
        Cliente clienteDeOutroUsuario = clienteComId(5L, usuarioComId(2L));
        when(clienteRepository.findById(5L)).thenReturn(Optional.of(clienteDeOutroUsuario));

        assertThrows(AcessoNegadoException.class, () -> service.listarPorCliente(5L));
    }

    private Usuario usuarioComId(Long id) {
        Usuario usuario = new Usuario();
        ReflectionTestUtils.setField(usuario, "id", id);
        usuario.setEmail("usuario" + id + "@teste.local");
        return usuario;
    }

    private Cliente clienteComId(Long id, Usuario dono) {
        Cliente cliente = new Cliente();
        cliente.setId(id);
        cliente.setNome("Cliente " + id);
        cliente.setUsuario(dono);
        return cliente;
    }
}
