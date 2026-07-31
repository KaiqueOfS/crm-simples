package com.kaique.crm_simples.model;

import com.kaique.crm_simples.model.enums.TipoAtendimento;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Configuração de negócio do usuário (Sprint 14).
 *
 * Guarda como o usuário atende seus clientes, para futuramente adaptar
 * Clientes/Agenda/Meu Dia a essa informação. Relação 1:1 com Usuario —
 * cada usuário tem no máximo uma configuração.
 *
 * segmentoNegocio e enderecoEstabelecimento são reservados para uma fase
 * futura: nenhuma tela preenche esses campos ainda.
 */
@Entity
@Table(name = "configuracoes_usuario")
public class ConfiguracaoUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Tipo de atendimento é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_atendimento", nullable = false)
    private TipoAtendimento tipoAtendimento;

    // Reservado para uma fase futura — não preenchido pela tela de onboarding.
    @Column(name = "segmento_negocio")
    private String segmentoNegocio;

    // Reservado para uma fase futura — não preenchido pela tela de onboarding.
    @Column(name = "endereco_estabelecimento")
    private String enderecoEstabelecimento;

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"senha"})
    private Usuario usuario;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public TipoAtendimento getTipoAtendimento() {
        return tipoAtendimento;
    }

    public void setTipoAtendimento(TipoAtendimento tipoAtendimento) {
        this.tipoAtendimento = tipoAtendimento;
    }

    public String getSegmentoNegocio() {
        return segmentoNegocio;
    }

    public void setSegmentoNegocio(String segmentoNegocio) {
        this.segmentoNegocio = segmentoNegocio;
    }

    public String getEnderecoEstabelecimento() {
        return enderecoEstabelecimento;
    }

    public void setEnderecoEstabelecimento(String enderecoEstabelecimento) {
        this.enderecoEstabelecimento = enderecoEstabelecimento;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
