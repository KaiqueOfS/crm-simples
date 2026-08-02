package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.config.LoginRateLimiter;
import com.kaique.crm_simples.dto.LoginRequest;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.kaique.crm_simples.exception.MuitasTentativasException;
import com.kaique.crm_simples.exception.UsuarioNaoEncontradoException;
import com.kaique.crm_simples.exception.CredenciaisInvalidasException;
import com.kaique.crm_simples.config.JwtService;
import com.kaique.crm_simples.dto.TokenResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioService usuarioService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginRateLimiter rateLimiter;

    public AuthController(
            UsuarioService usuarioService,
            BCryptPasswordEncoder passwordEncoder,
            JwtService jwtService,
            LoginRateLimiter rateLimiter) {

        this.usuarioService = usuarioService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/login")
    public TokenResponse login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        // Bloqueia ANTES de tocar no banco — nem a existência do e-mail
        // é consultada quando o limite já foi atingido. A mensagem de
        // erro (MuitasTentativasException) é genérica de propósito:
        // não diz se foi o IP, o e-mail, ou os dois, para não dar pista
        // extra a quem está testando os limites.
        if (!rateLimiter.tentativaPermitida(obterIp(httpRequest), request.getEmail())) {
            throw new MuitasTentativasException();
        }

        // Não diferenciamos "email não existe" de "senha errada":
        // ambos retornam a mesma exceção (401 genérico). Isso evita
        // que alguém descubra, por tentativa e erro, quais e-mails
        // já têm conta cadastrada no sistema (user enumeration).
        Usuario usuario;
        try {
            usuario = usuarioService.buscarPorEmail(request.getEmail());
        } catch (UsuarioNaoEncontradoException e) {
            throw new CredenciaisInvalidasException();
        }

        // Senha ausente/em branco cai na mesma exceção genérica acima —
        // sem isso, passwordEncoder.matches(null, ...) lança
        // IllegalArgumentException, que vaza como 400 (diferente do 401
        // do e-mail inexistente) e reabre o user enumeration que este
        // método existe justamente para evitar.
        if (request.getSenha() == null || request.getSenha().isBlank()) {
            throw new CredenciaisInvalidasException();
        }

        boolean senhaValida =
                passwordEncoder.matches(
                        request.getSenha(),
                        usuario.getSenha());

        if (!senhaValida) {
            throw new CredenciaisInvalidasException();
        }

        String token =
                jwtService.gerarToken(usuario.getEmail());

        return new TokenResponse(token);
    }

    /**
     * Prioriza X-Forwarded-For (padrão atrás de proxy/load balancer);
     * cai para o IP direto da conexão quando o header não existe.
     */
    private String obterIp(HttpServletRequest request) {
        String encaminhado = request.getHeader("X-Forwarded-For");
        if (encaminhado != null && !encaminhado.isBlank()) {
            return encaminhado.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
