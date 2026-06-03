package com.kaique.crm_simples.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

// nome é obrigatório
    @NotBlank(message = "Nome é Obrigatório")
    private String nome;

    //telefone é obrigatório
    @NotBlank(message = "Telefone é obrigatório")
    private String telefone;

    // Validação de email desativada temporariamente
// @Email(message = "Email inválido")
    private String email;

    private String observacoes;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
}