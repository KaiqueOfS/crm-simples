package com.kaique.crm_simples.exception;

/**
 * Lançada quando o limite de tentativas de login (por IP ou por
 * e-mail) foi atingido. A mensagem é deliberadamente genérica — não
 * diz se foi o IP, o e-mail, ou os dois, para não dar a um atacante
 * informação extra sobre qual limite ele está testando.
 */
public class MuitasTentativasException extends RuntimeException {

    public MuitasTentativasException() {
        super("Muitas tentativas de login. Tente novamente em instantes.");
    }
}
