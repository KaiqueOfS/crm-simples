package com.kaique.crm_simples.service;

import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por obter o usuário autenticado
 * através do token JWT.
 */
@Service
public class UsuarioAutenticadoService {

    // Repositório utilizado para buscar o usuário no banco de dados
    private final UsuarioRepository usuarioRepository;

    // Injeta as dependências necessárias para o serviço
    public UsuarioAutenticadoService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Obtém o usuário autenticado.
     *
     * @return usuário autenticado.
     */
    public Usuario obterUsuarioLogado() {

        // Recupera as informações da autenticação armazenadas pelo Spring Security
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        // Obtém o e-mail presente no token JWT
        String email = authentication.getName();

        // Busca o usuário correspondente no banco de dados
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Usuário não encontrado."));
    }
}