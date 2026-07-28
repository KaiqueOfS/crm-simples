package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.ClienteRequest;
import com.kaique.crm_simples.dto.ClienteResponse;
import com.kaique.crm_simples.dto.StatusLeadRequest;
import com.kaique.crm_simples.exception.AcessoNegadoException;
import com.kaique.crm_simples.exception.ClienteNaoEncontradoException;
import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.StatusLead;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.ClienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {

    @Mock
    private ClienteRepository repository;

    @Mock
    private UsuarioAutenticadoService usuarioAutenticadoService;

    private ClienteService service;
    private Usuario usuarioLogado;

    @BeforeEach
    void setUp() {
        service = new ClienteService(repository, usuarioAutenticadoService);
        usuarioLogado = usuarioComId(1L);
        when(usuarioAutenticadoService.obterUsuarioLogado()).thenReturn(usuarioLogado);
    }

    @Test
    void naoPermiteExcluirClienteDeOutroUsuario() {
        Cliente clienteDeOutroUsuario = new Cliente();
        clienteDeOutroUsuario.setUsuario(usuarioComId(2L));
        when(repository.findById(10L)).thenReturn(Optional.of(clienteDeOutroUsuario));

        assertThrows(AcessoNegadoException.class, () -> service.deletar(10L));

        verify(repository, never()).delete(clienteDeOutroUsuario);
    }

    @Test
    void naoPermiteBuscarClienteDeOutroUsuario() {
        Cliente clienteDeOutroUsuario = new Cliente();
        clienteDeOutroUsuario.setUsuario(usuarioComId(2L));
        when(repository.findById(10L)).thenReturn(Optional.of(clienteDeOutroUsuario));

        assertThrows(AcessoNegadoException.class, () -> service.buscarPorId(10L));
    }

    @Test
    void naoPermiteAtualizarClienteDeOutroUsuario() {
        Cliente clienteDeOutroUsuario = new Cliente();
        clienteDeOutroUsuario.setUsuario(usuarioComId(2L));
        when(repository.findById(10L)).thenReturn(Optional.of(clienteDeOutroUsuario));

        ClienteRequest dadosNovos = new ClienteRequest();
        dadosNovos.setNome("Nome alterado por outro usuário");
        dadosNovos.setTelefone("11999999999");

        assertThrows(AcessoNegadoException.class, () -> service.atualizar(10L, dadosNovos));

        verify(repository, never()).save(any(Cliente.class));
    }

    @Test
    void naoPermiteAlterarStatusDeClienteDeOutroUsuario() {
        Cliente clienteDeOutroUsuario = new Cliente();
        clienteDeOutroUsuario.setUsuario(usuarioComId(2L));
        when(repository.findById(10L)).thenReturn(Optional.of(clienteDeOutroUsuario));

        StatusLeadRequest request = new StatusLeadRequest();
        request.setStatus(StatusLead.GANHO);

        assertThrows(AcessoNegadoException.class, () -> service.alterarStatus(10L, request));

        verify(repository, never()).save(any(Cliente.class));
    }

    @Test
    void lancaExcecaoQuandoClienteNaoExiste() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ClienteNaoEncontradoException.class, () -> service.buscarPorId(99L));
    }

    @Test
    void associaClienteNovoAoUsuarioAutenticado() {
        ClienteRequest request = new ClienteRequest();
        request.setNome("Ana Paula");
        request.setTelefone("11999999999");

        when(repository.save(any(Cliente.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        ClienteResponse resposta = service.salvar(request);

        ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
        verify(repository).save(captor.capture());

        // O dono é sempre o usuário autenticado — nunca algo vindo do request,
        // que sequer tem um campo "usuario" para carregar isso.
        assertSame(usuarioLogado, captor.getValue().getUsuario());
        assertEquals("Ana Paula", resposta.nome());
        assertEquals(StatusLead.NOVO, resposta.statusLead());
    }

    private Usuario usuarioComId(Long id) {
        Usuario usuario = new Usuario();
        ReflectionTestUtils.setField(usuario, "id", id);
        usuario.setEmail("usuario" + id + "@teste.local");
        return usuario;
    }
}
