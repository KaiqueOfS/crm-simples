package com.kaique.crm_simples.repository;

import com.kaique.crm_simples.model.ConfiguracaoUsuario;
import com.kaique.crm_simples.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repositório responsável pela configuração de negócio do usuário (Sprint 14).
 */
public interface ConfiguracaoUsuarioRepository extends JpaRepository<ConfiguracaoUsuario, Long> {

    Optional<ConfiguracaoUsuario> findByUsuario(Usuario usuario);
}
