package com.kaique.crm_simples.exception;

/**
 * Lançada quando a senha informada não atende às regras de negócio —
 * ex.: tamanho acima do limite suportado pelo BCrypt (ver
 * UsuarioService.validarTamanhoSenha).
 */
public class SenhaInvalidaException extends RuntimeException {

    public SenhaInvalidaException(String mensagem) {
        super(mensagem);
    }
}
