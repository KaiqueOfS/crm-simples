package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.dto.AtualizarPerfilRequest;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelo gerenciamento de usuários.
 *
 * Expõe endpoints para cadastro de nova conta e
 * atualização do perfil do usuário autenticado.
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
     * Rota pública — não precisa de token JWT.
     *
     * @param usuario dados recebidos na requisição.
     * @return usuário salvo.
     */
    @PostMapping
    public Usuario cadastrar(@Valid @RequestBody Usuario usuario) {
        return service.salvar(usuario);
    }

    /**
     * Retorna os dados do perfil do usuário autenticado.
     *
     * Usamos o e-mail do token JWT para buscar o usuário —
     * assim cada usuário só consegue ver o próprio perfil.
     *
     * @return dados do usuário autenticado.
     */
    @GetMapping("/perfil")
    public Usuario perfil() {

        // Obtém o e-mail do token JWT via SecurityContext
        String email = getEmailAutenticado();
        return service.buscarPorEmail(email);
    }

    /**
     * Atualiza o perfil do usuário autenticado.
     *
     * Permite alterar nome e senha.
     * O e-mail não pode ser alterado pois é o identificador da conta.
     *
     * @param request novos dados do perfil.
     * @return usuário atualizado.
     */
    @PutMapping("/perfil")
    public Usuario atualizarPerfil(@Valid @RequestBody AtualizarPerfilRequest request) {

        String email = getEmailAutenticado();
        return service.atualizarPerfil(email, request);
    }

    /**
     * Obtém o e-mail do usuário autenticado a partir do token JWT.
     *
     * O Spring Security armazena o e-mail no SecurityContext
     * após validar o token no JwtFilter.
     *
     * @return e-mail do usuário autenticado.
     */
    private String getEmailAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}