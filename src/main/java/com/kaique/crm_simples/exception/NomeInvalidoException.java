package com.kaique.crm_simples.exception;

/**
 * Lançada quando o nome informado (cliente ou usuário) não atende às regras
 * de negócio — caracteres inválidos ou nome incompleto (ver
 * ClienteService.validarNome).
 */
public class NomeInvalidoException extends RuntimeException {

    public NomeInvalidoException(String mensagem) {
        super(mensagem);
    }
}
