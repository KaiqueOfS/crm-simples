package com.kaique.crm_simples.exception;

/**
 * Lançada quando um agendamento não é encontrado pelo ID
 * ou quando o usuário tenta acessar um agendamento de outra conta.
 */
public class AgendamentoNaoEncontradoException extends RuntimeException {

    public AgendamentoNaoEncontradoException(Long id) {
        super("Agendamento com ID " + id + " não encontrado.");
    }
}