package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.dto.LoginRequest;
import com.kaique.crm_simples.dto.LoginResponse;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.service.UsuarioService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.kaique.crm_simples.exception.UsuarioNaoEncontradoException;
import com.kaique.crm_simples.exception.CredenciaisInvalidasException;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UsuarioService usuarioService;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthController(
            UsuarioService usuarioService,
            BCryptPasswordEncoder passwordEncoder) {

        this.usuarioService = usuarioService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public LoginResponse login(
            @RequestBody LoginRequest request) {

        Usuario usuario = usuarioService
                .buscarPorEmail(request.getEmail())
                .orElseThrow(UsuarioNaoEncontradoException::new);

        boolean senhaValida =
                passwordEncoder.matches(
                        request.getSenha(),
                        usuario.getSenha());

        if (!senhaValida) {
            throw new CredenciaisInvalidasException();
        }

        return new LoginResponse(
                "Login realizado com sucesso");
    }
}