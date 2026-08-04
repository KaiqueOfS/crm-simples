package com.kaique.crm_simples.exception;

/**
 * Lançada quando o e-mail ou a senha informados no login não conferem.
 * Mensagem deliberadamente genérica — não diz se foi o e-mail ou a senha,
 * para evitar user enumeration (ver AuthController.login).
 */
public class CredenciaisInvalidasException extends RuntimeException {

    public CredenciaisInvalidasException() {
        super("Email ou senha inválidos.");
    }
}