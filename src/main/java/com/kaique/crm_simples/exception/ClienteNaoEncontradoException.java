package com.kaique.crm_simples.exception;

public class ClienteNaoEncontradoException extends RuntimeException {

    public ClienteNaoEncontradoException(Long id) {
        super("Cliente com ID " + id + " não encontrado.");
    }
}