package com.kaique.crm_simples.model;

/**
 * Representa as etapas do funil de vendas do CRM.
 *
 * Cada cliente deve estar sempre em uma dessas etapas.
 */
public enum StatusLead {

    // Cliente recém-cadastrado
    NOVO,

    // Primeiro contato realizado
    CONTATADO,

    // Cliente em fase de negociação
    NEGOCIACAO,

    // Proposta comercial enviada
    PROPOSTA,

    // Venda concluída com sucesso
    GANHO,

    // Negociação encerrada sem venda
    PERDIDO
}