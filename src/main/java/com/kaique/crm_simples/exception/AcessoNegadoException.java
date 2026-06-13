package com.kaique.crm_simples.exception;

public class AcessoNegadoException extends RuntimeException {

    public AcessoNegadoException() {
        super("Você não tem permissão para acessar este cliente.");
    }
}