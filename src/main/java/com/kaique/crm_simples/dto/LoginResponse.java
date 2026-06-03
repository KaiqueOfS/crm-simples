package com.kaique.crm_simples.dto;

public class LoginResponse {

    private String mensagem;

    public LoginResponse(String mensagem) {
        this.mensagem = mensagem;
    }

    public String getMensagem() {
        return mensagem;
    }
}