package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.dto.AtualizarPerfilRequest;
import com.kaique.crm_simples.dto.CadastroUsuarioRequest;
import com.kaique.crm_simples.dto.UsuarioResponse;
import com.kaique.crm_simples.service.UsuarioAutenticadoService;
import com.kaique.crm_simples.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelo gerenciamento de usuários.
 *
 * Expõe endpoints para cadastro de nova conta e
 * atualização do perfil do usuário autenticado.
 */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService service;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    public UsuarioController(UsuarioService service, UsuarioAutenticadoService usuarioAutenticadoService) {
        this.service = service;
        this.usuarioAutenticadoService = usuarioAutenticadoService;
    }

    /**
     * Cadastra um novo usuário no sistema.
     *
     * Rota pública — não precisa de token JWT.
     *
     * @param request dados recebidos na requisição.
     * @return dados públicos do usuário salvo (nunca a senha).
     */
    @PostMapping
    public UsuarioResponse cadastrar(@Valid @RequestBody CadastroUsuarioRequest request) {
        return UsuarioResponse.de(service.cadastrar(request));
    }

    /**
     * Retorna os dados do perfil do usuário autenticado.
     *
     * @return dados do usuário autenticado.
     */
    @GetMapping("/perfil")
    public UsuarioResponse perfil() {
        return UsuarioResponse.de(usuarioAutenticadoService.obterUsuarioLogado());
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
    public UsuarioResponse atualizarPerfil(@Valid @RequestBody AtualizarPerfilRequest request) {

        String email = usuarioAutenticadoService.obterUsuarioLogado().getEmail();
        return UsuarioResponse.de(service.atualizarPerfil(email, request));
    }
}