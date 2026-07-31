package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.Usuario;

/**
 * Dados do usuário expostos pela API — nunca inclui a senha (nem o
 * hash), ao contrário de retornar a entidade Usuario diretamente.
 */
public record UsuarioResponse(Long id, String nome, String email, boolean onboardingConcluido) {

    public static UsuarioResponse de(Usuario usuario) {
        return new UsuarioResponse(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.isOnboardingConcluido());
    }
}
