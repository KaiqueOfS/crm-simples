package com.kaique.crm_simples.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Dados de entrada para criar ou atualizar um agendamento.
 *
 * Sem "id" e sem "usuario" — o dono do agendamento é sempre o usuário
 * autenticado, atribuído pelo AgendamentoService.
 */
public class AgendamentoRequest {

    @NotBlank(message = "Título é obrigatório")
    private String titulo;

    private String pessoa;

    @NotNull(message = "Data é obrigatória")
    private LocalDate data;

    @NotNull(message = "Hora é obrigatória")
    private LocalTime hora;

    // Mesmo padrão da entidade: mesmos defaults se não informado.
    private String categoria = "atendimento";
    private Integer lembrete = 0;

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getPessoa() { return pessoa; }
    public void setPessoa(String pessoa) { this.pessoa = pessoa; }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }

    public LocalTime getHora() { return hora; }
    public void setHora(LocalTime hora) { this.hora = hora; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public Integer getLembrete() { return lembrete; }
    public void setLembrete(Integer lembrete) { this.lembrete = lembrete; }
}
