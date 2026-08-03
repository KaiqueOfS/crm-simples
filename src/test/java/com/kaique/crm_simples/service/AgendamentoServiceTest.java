package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.AgendamentoRequest;
import com.kaique.crm_simples.dto.AgendamentoResponse;
import com.kaique.crm_simples.exception.AcessoNegadoException;
import com.kaique.crm_simples.exception.AgendamentoNaoEncontradoException;
import com.kaique.crm_simples.exception.ClienteNaoEncontradoException;
import com.kaique.crm_simples.model.Agendamento;
import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.model.enums.LocalAtendimento;
import com.kaique.crm_simples.model.enums.StatusAgendamento;
import com.kaique.crm_simples.model.enums.TipoAtendimento;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
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
    private ClienteService clienteService;

    @Mock
    private UsuarioAutenticadoService usuarioAutenticadoService;

    @Mock
    private ConfiguracaoUsuarioService configuracaoUsuarioService;

    private AgendamentoService service;
    private Usuario usuarioLogado;

    @BeforeEach
    void setUp() {
        service = new AgendamentoService(repository, clienteService, usuarioAutenticadoService, configuracaoUsuarioService);
        usuarioLogado = usuarioComId(1L);
        when(usuarioAutenticadoService.obterUsuarioLogado()).thenReturn(usuarioLogado);
        // Default para os testes que não são sobre local de atendimento: conta
        // NO_ESTABELECIMENTO resolve sozinha, sem exigir nada do request.
        // lenient() porque nem todo teste chama salvar() (ex.: os de deletar/concluir).
        lenient().when(configuracaoUsuarioService.obterTipoAtendimento(any())).thenReturn(TipoAtendimento.NO_ESTABELECIMENTO);
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
        when(clienteService.buscarClienteDoUsuario(5L, usuarioLogado)).thenReturn(cliente);

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
        when(clienteService.buscarClienteDoUsuario(999L, usuarioLogado)).thenThrow(new ClienteNaoEncontradoException(999L));

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
        // A checagem de posse em si é responsabilidade de
        // ClienteService.buscarClienteDoUsuario (já coberta em
        // ClienteServiceTest) — aqui só confirmamos que AgendamentoService
        // propaga a exceção corretamente.
        when(clienteService.buscarClienteDoUsuario(5L, usuarioLogado)).thenThrow(new AcessoNegadoException("cliente"));

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
        when(clienteService.buscarClienteDoUsuario(5L, usuarioLogado)).thenReturn(cliente);

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
        when(clienteService.buscarClienteDoUsuario(999L, usuarioLogado)).thenThrow(new ClienteNaoEncontradoException(999L));

        assertThrows(ClienteNaoEncontradoException.class, () -> service.listarPorCliente(999L));
    }

    @Test
    void lancaExcecaoAoListarPorClienteDeOutroUsuario() {
        when(clienteService.buscarClienteDoUsuario(5L, usuarioLogado)).thenThrow(new AcessoNegadoException("cliente"));

        assertThrows(AcessoNegadoException.class, () -> service.listarPorCliente(5L));
    }

    @Test
    void listaHistoricoApenasComAgendamentosConcluidos() {
        Cliente cliente = clienteComId(5L, usuarioLogado);
        when(clienteService.buscarClienteDoUsuario(5L, usuarioLogado)).thenReturn(cliente);

        Agendamento concluido = new Agendamento();
        concluido.setTitulo("Instalação elétrica");
        concluido.setCliente(cliente);
        concluido.setUsuario(usuarioLogado);
        concluido.setStatus(StatusAgendamento.CONCLUIDO);
        when(repository.findByUsuarioAndClienteAndStatusOrderByDataDescHoraDesc(usuarioLogado, cliente, StatusAgendamento.CONCLUIDO))
                .thenReturn(java.util.List.of(concluido));

        java.util.List<AgendamentoResponse> resposta = service.listarHistorico(5L);

        assertEquals(1, resposta.size());
        assertEquals("Instalação elétrica", resposta.get(0).titulo());
        assertEquals(StatusAgendamento.CONCLUIDO, resposta.get(0).status());
    }

    @Test
    void lancaExcecaoAoListarHistoricoDeClienteInexistente() {
        when(clienteService.buscarClienteDoUsuario(999L, usuarioLogado)).thenThrow(new ClienteNaoEncontradoException(999L));

        assertThrows(ClienteNaoEncontradoException.class, () -> service.listarHistorico(999L));
    }

    @Test
    void lancaExcecaoAoListarHistoricoDeClienteDeOutroUsuario() {
        when(clienteService.buscarClienteDoUsuario(5L, usuarioLogado)).thenThrow(new AcessoNegadoException("cliente"));

        assertThrows(AcessoNegadoException.class, () -> service.listarHistorico(5L));
    }

    @Test
    void usaPendenteComoStatusPadraoQuandoNaoInformado() {
        AgendamentoRequest request = new AgendamentoRequest();
        request.setTitulo("Visita técnica");
        request.setData(LocalDate.now());
        request.setHora(LocalTime.of(9, 0));

        when(repository.save(any(Agendamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        AgendamentoResponse resposta = service.salvar(request);

        assertEquals(StatusAgendamento.PENDENTE, resposta.status());
    }

    @Test
    void mantemStatusInformadoNaCriacao() {
        AgendamentoRequest request = new AgendamentoRequest();
        request.setTitulo("Visita técnica");
        request.setStatus(StatusAgendamento.CONCLUIDO);
        request.setData(LocalDate.now());
        request.setHora(LocalTime.of(9, 0));

        when(repository.save(any(Agendamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        AgendamentoResponse resposta = service.salvar(request);

        assertEquals(StatusAgendamento.CONCLUIDO, resposta.status());
    }

    @Test
    void concluirAlteraStatusParaConcluido() {
        Agendamento agendamento = new Agendamento();
        agendamento.setUsuario(usuarioLogado);
        when(repository.findById(10L)).thenReturn(Optional.of(agendamento));
        when(repository.save(any(Agendamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        AgendamentoResponse resposta = service.concluir(10L);

        assertEquals(StatusAgendamento.CONCLUIDO, resposta.status());
        assertEquals(StatusAgendamento.CONCLUIDO, agendamento.getStatus());
    }

    @Test
    void naoPermiteConcluirAgendamentoDeOutroUsuario() {
        Agendamento agendamentoDeOutroUsuario = new Agendamento();
        agendamentoDeOutroUsuario.setUsuario(usuarioComId(2L));
        when(repository.findById(10L)).thenReturn(Optional.of(agendamentoDeOutroUsuario));

        assertThrows(AcessoNegadoException.class, () -> service.concluir(10L));

        verify(repository, never()).save(any(Agendamento.class));
    }

    @Test
    void preencheEstabelecimentoAutomaticamenteQuandoContaENoEstabelecimento() {
        when(configuracaoUsuarioService.obterTipoAtendimento(usuarioLogado)).thenReturn(TipoAtendimento.NO_ESTABELECIMENTO);

        AgendamentoRequest request = new AgendamentoRequest();
        request.setTitulo("Corte de cabelo");
        request.setData(LocalDate.now());
        request.setHora(LocalTime.of(9, 0));
        // Não informa localAtendimento — e mesmo que informasse EXTERNO, a
        // conta NO_ESTABELECIMENTO sempre prevalece (ver resolverLocalAtendimento).

        when(repository.save(any(Agendamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        AgendamentoResponse resposta = service.salvar(request);

        assertEquals(LocalAtendimento.ESTABELECIMENTO, resposta.localAtendimento());
    }

    @Test
    void preencheExternoAutomaticamenteQuandoContaEExterno() {
        when(configuracaoUsuarioService.obterTipoAtendimento(usuarioLogado)).thenReturn(TipoAtendimento.EXTERNO);

        AgendamentoRequest request = new AgendamentoRequest();
        request.setTitulo("Instalação elétrica");
        request.setData(LocalDate.now());
        request.setHora(LocalTime.of(9, 0));

        when(repository.save(any(Agendamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        AgendamentoResponse resposta = service.salvar(request);

        assertEquals(LocalAtendimento.EXTERNO, resposta.localAtendimento());
    }

    @Test
    void usaLocalInformadoQuandoContaEAmbos() {
        when(configuracaoUsuarioService.obterTipoAtendimento(usuarioLogado)).thenReturn(TipoAtendimento.AMBOS);

        AgendamentoRequest request = new AgendamentoRequest();
        request.setTitulo("Visita técnica");
        request.setData(LocalDate.now());
        request.setHora(LocalTime.of(9, 0));
        request.setLocalAtendimento(LocalAtendimento.EXTERNO);

        when(repository.save(any(Agendamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        AgendamentoResponse resposta = service.salvar(request);

        assertEquals(LocalAtendimento.EXTERNO, resposta.localAtendimento());
    }

    @Test
    void lancaExcecaoQuandoContaEAmbosSemLocalInformado() {
        when(configuracaoUsuarioService.obterTipoAtendimento(usuarioLogado)).thenReturn(TipoAtendimento.AMBOS);

        AgendamentoRequest request = new AgendamentoRequest();
        request.setTitulo("Visita técnica");
        request.setData(LocalDate.now());
        request.setHora(LocalTime.of(9, 0));

        assertThrows(RuntimeException.class, () -> service.salvar(request));
        verify(repository, never()).save(any(Agendamento.class));
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
