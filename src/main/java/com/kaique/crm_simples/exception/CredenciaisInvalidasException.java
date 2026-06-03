package com.kaique.crm_simples.exception;

public class CredenciaisInvalidasException extends RuntimeException {

    public CredenciaisInvalidasException() {
        super("Email ou senha inválidos.");
    }
}