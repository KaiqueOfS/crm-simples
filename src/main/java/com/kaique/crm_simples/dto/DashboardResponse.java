package com.kaique.crm_simples.dto;

/**
 * DTO responsável por retornar os indicadores do dashboard.
 *
 * Contém a quantidade total de clientes e a distribuição
 * dos clientes por etapa do funil de vendas.
 */
public class DashboardResponse {

    private long totalClientes;
    private long novos;
    private long contatados;
    private long negociacao;
    private long proposta;
    private long ganhos;
    private long perdidos;

    public long getTotalClientes() {
        return totalClientes;
    }

    public void setTotalClientes(long totalClientes) {
        this.totalClientes = totalClientes;
    }

    public long getNovos() {
        return novos;
    }

    public void setNovos(long novos) {
        this.novos = novos;
    }

    public long getContatados() {
        return contatados;
    }

    public void setContatados(long contatados) {
        this.contatados = contatados;
    }

    public long getNegociacao() {
        return negociacao;
    }

    public void setNegociacao(long negociacao) {
        this.negociacao = negociacao;
    }

    public long getProposta() {
        return proposta;
    }

    public void setProposta(long proposta) {
        this.proposta = proposta;
    }

    public long getGanhos() {
        return ganhos;
    }

    public void setGanhos(long ganhos) {
        this.ganhos = ganhos;
    }

    public long getPerdidos() {
        return perdidos;
    }

    public void setPerdidos(long perdidos) {
        this.perdidos = perdidos;
    }
}