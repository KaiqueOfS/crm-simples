package com.kaique.crm_simples.exception;

/**
 * Lançada quando um cliente não é encontrado pelo ID
 * ou quando o usuário tenta acessar um cliente de outra conta.
 */
public class ClienteNaoEncontradoException extends RuntimeException {

    public ClienteNaoEncontradoException(Long id) {
        super("Cliente com ID " + id + " não encontrado.");
    }
}