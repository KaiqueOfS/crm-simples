package com.kaique.crm_simples.exception;

/**
 * Lançada quando a nova senha e a confirmação não coincidem
 * durante a atualização do perfil do usuário.
 */
public class SenhasNaoCoincidemException extends RuntimeException {

    public SenhasNaoCoincidemException() {
        super("As senhas não coincidem.");
    }
}