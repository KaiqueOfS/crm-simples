package com.kaique.crm_simples.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Entidade que representa um agendamento no CRM.
 *
 * Cada agendamento pertence a um usuário e pode ser
 * vinculado a um cliente existente ou a qualquer pessoa.
 */
@Entity
@Table(name = "agendamentos")
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Título do agendamento (obrigatório)
    @NotBlank(message = "Título é obrigatório")
    private String titulo;

    // Nome da pessoa envolvida (opcional — pode ser cliente ou qualquer pessoa)
    private String pessoa;

    // Data do agendamento (obrigatório)
    @NotNull(message = "Data é obrigatória")
    private LocalDate data;

    // Hora do agendamento (obrigatório)
    @NotNull(message = "Hora é obrigatória")
    private LocalTime hora;

    // Categoria para identificação visual por cor
    // Valores: atendimento, retorno, orcamento, reuniao, urgente, outro
    private String categoria = "atendimento";

    // Minutos antes para disparar o lembrete (0 = sem lembrete)
    private Integer lembrete = 0;

    // Usuário dono do agendamento
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    @JsonIgnoreProperties({"senha"})
    private Usuario usuario;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    /**
     * Atualiza os dados do agendamento.
     * O usuário não é alterado — pertence sempre ao criador.
     */
    public void atualizarDados(Agendamento novo) {
        this.titulo    = novo.getTitulo();
        this.pessoa    = novo.getPessoa();
        this.data      = novo.getData();
        this.hora      = novo.getHora();
        this.categoria = novo.getCategoria();
        this.lembrete  = novo.getLembrete();
    }
}