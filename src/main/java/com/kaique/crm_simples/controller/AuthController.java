package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.dto.LoginRequest;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.service.UsuarioService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.kaique.crm_simples.exception.UsuarioNaoEncontradoException;
import com.kaique.crm_simples.exception.CredenciaisInvalidasException;
import com.kaique.crm_simples.config.JwtService;
import com.kaique.crm_simples.dto.TokenResponse;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UsuarioService usuarioService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UsuarioService usuarioService,
            BCryptPasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.usuarioService = usuarioService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public TokenResponse login(
            @RequestBody LoginRequest request) {

        Usuario usuario = usuarioService
                .buscarPorEmail(request.getEmail());

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
}