package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.config.JwtService;
import com.kaique.crm_simples.config.LoginRateLimiter;
import com.kaique.crm_simples.dto.LoginRequest;
import com.kaique.crm_simples.dto.TokenResponse;
import com.kaique.crm_simples.exception.CredenciaisInvalidasException;
import com.kaique.crm_simples.exception.MuitasTentativasException;
import com.kaique.crm_simples.exception.UsuarioNaoEncontradoException;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Garante a prevenção de user enumeration no login: "senha errada" e
 * "e-mail não cadastrado" devem produzir exatamente a mesma exceção,
 * como já documentado em AuthController. Também garante que o rate
 * limiting é consultado antes de qualquer acesso ao UsuarioService.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UsuarioService usuarioService;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private LoginRateLimiter rateLimiter;

    @Mock
    private HttpServletRequest httpRequest;

    private AuthController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthController(usuarioService, passwordEncoder, jwtService, rateLimiter);
        // anyString() não casa com null — sem isso, getRemoteAddr() do mock
        // devolveria null e o obterIp() do controller quebraria o matcher.
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
    }

    @Test
    void loginComSenhaErradaLancaCredenciaisInvalidas() {
        when(rateLimiter.tentativaPermitida(anyString(), any())).thenReturn(true);
        Usuario usuario = usuarioComSenha("existe@teste.local", "hash-armazenado");
        when(usuarioService.buscarPorEmail("existe@teste.local")).thenReturn(usuario);
        when(passwordEncoder.matches("senha-errada", "hash-armazenado")).thenReturn(false);

        assertThrows(
                CredenciaisInvalidasException.class,
                () -> controller.login(loginRequest("existe@teste.local", "senha-errada"), httpRequest));
    }

    @Test
    void loginComUsuarioInexistenteLancaMesmaExcecaoQueSenhaErrada() {
        when(rateLimiter.tentativaPermitida(anyString(), any())).thenReturn(true);
        when(usuarioService.buscarPorEmail("naoexiste@teste.local"))
                .thenThrow(new UsuarioNaoEncontradoException());

        assertThrows(
                CredenciaisInvalidasException.class,
                () -> controller.login(loginRequest("naoexiste@teste.local", "qualquer-senha"), httpRequest));
    }

    @Test
    void loginComCredenciaisCorretasRetornaToken() {
        when(rateLimiter.tentativaPermitida(anyString(), any())).thenReturn(true);
        Usuario usuario = usuarioComSenha("existe@teste.local", "hash-armazenado");
        when(usuarioService.buscarPorEmail("existe@teste.local")).thenReturn(usuario);
        when(passwordEncoder.matches("senha-correta", "hash-armazenado")).thenReturn(true);
        when(jwtService.gerarToken("existe@teste.local")).thenReturn("token-fake-de-teste");

        TokenResponse resposta = controller.login(loginRequest("existe@teste.local", "senha-correta"), httpRequest);

        assertEquals("token-fake-de-teste", resposta.getToken());
    }

    @Test
    void loginBloqueadoPeloRateLimiterNuncaConsultaUsuarioService() {
        when(rateLimiter.tentativaPermitida(anyString(), any())).thenReturn(false);

        assertThrows(
                MuitasTentativasException.class,
                () -> controller.login(loginRequest("existe@teste.local", "qualquer-senha"), httpRequest));

        // O bloqueio acontece antes de qualquer consulta ao banco —
        // nem a existência do e-mail é revelada quando já está limitado.
        verify(usuarioService, never()).buscarPorEmail(anyString());
    }

    private LoginRequest loginRequest(String email, String senha) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setSenha(senha);
        return request;
    }

    private Usuario usuarioComSenha(String email, String senhaCriptografada) {
        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.alterarSenha(senhaCriptografada);
        return usuario;
    }
}
