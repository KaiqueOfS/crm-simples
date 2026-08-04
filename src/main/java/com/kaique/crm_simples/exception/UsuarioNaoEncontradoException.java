package com.kaique.crm_simples.exception;

/**
 * Lançada quando um usuário não é encontrado pelo e-mail informado.
 */
public class UsuarioNaoEncontradoException extends RuntimeException {

    public UsuarioNaoEncontradoException() {
        super("Usuário não encontrado.");
    }
}