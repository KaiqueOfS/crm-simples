package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelo cadastro de usuários.
 *
 * Expõe apenas o endpoint de criação de conta.
 * Não existe listagem de usuários por segurança —
 * um usuário não deve ter acesso aos dados de outros.
 */
@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    /**
     * Cadastra um novo usuário no sistema.
     *
     * Os dados são validados pelo @Valid antes de chegar aqui.
     * A senha é criptografada pelo UsuarioService antes de ser salva.
     *
     * @param usuario dados recebidos na requisição.
     * @return usuário salvo.
     */
    @PostMapping
    public Usuario cadastrar(@Valid @RequestBody Usuario usuario) {
        return service.salvar(usuario);
    }
}