package com.kaique.crm_simples.exception;

/**
 * Lançada quando o usuário autenticado tenta acessar um recurso (cliente,
 * agendamento, etc.) que pertence a outro usuário.
 *
 * Exige o nome do recurso no construtor — evita que a mensagem fique
 * incorreta quando a exceção é reaproveitada para um tipo de recurso
 * diferente do que o texto original menciona.
 */
public class AcessoNegadoException extends RuntimeException {

    public AcessoNegadoException(String recurso) {
        super("Você não tem permissão para acessar este " + recurso + ".");
    }
}
