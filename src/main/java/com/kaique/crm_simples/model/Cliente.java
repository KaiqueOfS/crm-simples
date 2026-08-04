package com.kaique.crm_simples.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidade que representa um cliente cadastrado no CRM.
 *
 * Cada cliente pertence a um usuário e possui um status
 * dentro do funil de vendas.
 */
@Entity
@Table(name = "clientes")
public class Cliente {

    // Identificador único do cliente
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nome do cliente (obrigatório, entre 2 e 100 caracteres)
    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
    private String nome;

    // Telefone do cliente (obrigatório, entre 8 e 20 caracteres)
    @NotBlank(message = "Telefone é obrigatório")
    @Size(min = 8, max = 20, message = "Telefone deve ter entre 8 e 20 caracteres")
    private String telefone;

    // E-mail do cliente (opcional, mas validado quando preenchido)
    @Email(message = "E-mail inválido")
    private String email;

    // Observações livres sobre o cliente (máximo 255 caracteres — mesmo
    // limite da coluna VARCHAR(255) no banco, ver V1__init.sql)
    @Size(max = 255, message = "Observações devem ter no máximo 255 caracteres")
    private String observacoes;

    // Etapa atual do cliente no funil de vendas
    // Valor padrão: NOVO (recém-cadastrado)
    @Enumerated(EnumType.STRING)
    private StatusLead status = StatusLead.NOVO;

    // Usuário proprietário do cliente
    // A senha é ocultada para não ser exposta nas respostas da API
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    @JsonIgnoreProperties({"senha"})
    private Usuario usuario;

    // Preenchido automaticamente pelo Hibernate na criação — nunca
    // definido pela aplicação, por isso não existe setter.
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Atualizado automaticamente pelo Hibernate a cada UPDATE.
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public StatusLead getStatus() {
        return status;
    }

    public void setStatus(StatusLead status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}