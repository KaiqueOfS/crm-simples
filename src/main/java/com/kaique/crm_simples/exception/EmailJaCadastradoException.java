package com.kaique.crm_simples.exception;

/**
 * Lançada quando alguém tenta cadastrar um e-mail
 * que já existe no banco de dados.
 *
 * Usamos uma exceção própria para ter controle total
 * sobre a mensagem e o status HTTP retornado,
 * em vez de depender do erro genérico do banco.
 */
public class EmailJaCadastradoException extends RuntimeException {

    public EmailJaCadastradoException(String email) {
        super("O e-mail '" + email + "' já está cadastrado.");
    }
}