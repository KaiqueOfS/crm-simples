package com.kaique.crm_simples.service;

import com.kaique.crm_simples.exception.AcessoNegadoException;
import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.ClienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
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
    void associaClienteNovoAoUsuarioAutenticado() {
        Cliente cliente = new Cliente();
        when(repository.save(cliente)).thenReturn(cliente);

        service.salvar(cliente);

        verify(repository).save(cliente);
        org.junit.jupiter.api.Assertions.assertSame(usuarioLogado, cliente.getUsuario());
    }

    private Usuario usuarioComId(Long id) {
        Usuario usuario = new Usuario();
        ReflectionTestUtils.setField(usuario, "id", id);
        usuario.setEmail("usuario" + id + "@teste.local");
        return usuario;
    }
}
