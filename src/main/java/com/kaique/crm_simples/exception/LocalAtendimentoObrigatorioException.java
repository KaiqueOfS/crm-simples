package com.kaique.crm_simples.exception;

/**
 * Lançada ao criar um agendamento quando a conta do usuário é do tipo AMBOS
 * (ou ainda não tem configuração salva) e o local de atendimento não foi
 * informado no request — nesse caso o valor não pode ser resolvido
 * automaticamente (ver AgendamentoService.resolverLocalAtendimento).
 */
public class LocalAtendimentoObrigatorioException extends RuntimeException {

    public LocalAtendimentoObrigatorioException() {
        super("Selecione o local de atendimento.");
    }
}
