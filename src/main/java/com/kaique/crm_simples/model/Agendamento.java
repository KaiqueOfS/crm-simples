package com.kaique.crm_simples.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.kaique.crm_simples.model.enums.LocalAtendimento;
import com.kaique.crm_simples.model.enums.StatusAgendamento;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    // Nome da pessoa envolvida (opcional — pode ser cliente ou qualquer pessoa).
    // Mantido por compatibilidade; quando "cliente" está preenchido, este
    // campo é sincronizado automaticamente pelo AgendamentoService a partir
    // de cliente.getNome() (ver docs/FLYWAY.md, V3).
    private String pessoa;

    // Cliente vinculado ao agendamento (opcional — nem todo compromisso tem
    // um cliente cadastrado). Nullable de propósito: agendamentos antigos
    // não têm como ser associados com segurança (ver V3__add_cliente_id_agendamentos.sql).
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

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

    // Situação do agendamento. Default PENDENTE para novos registros feitos
    // pela aplicação; agendamentos antigos recebem PENDENTE diretamente pelo
    // DEFAULT da coluna no banco (ver V4__add_status_agendamento.sql), não
    // por este valor em memória. Sem nullable=false de propósito — mesmo
    // padrão do restante da entidade (obrigatoriedade real fica na API).
    @Enumerated(EnumType.STRING)
    private StatusAgendamento status = StatusAgendamento.PENDENTE;

    // Onde este compromisso específico acontece (Sprint 15.1). Sem valor
    // padrão em memória — quem decide o valor é o AgendamentoService, a
    // partir de ConfiguracaoUsuario.tipoAtendimento (ver V7__add_local_atendimento_agendamento.sql).
    @Enumerated(EnumType.STRING)
    private LocalAtendimento localAtendimento;

    // Usuário dono do agendamento
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getPessoa() { return pessoa; }
    public void setPessoa(String pessoa) { this.pessoa = pessoa; }

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }

    public LocalTime getHora() { return hora; }
    public void setHora(LocalTime hora) { this.hora = hora; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public Integer getLembrete() { return lembrete; }
    public void setLembrete(Integer lembrete) { this.lembrete = lembrete; }

    public StatusAgendamento getStatus() { return status; }
    public void setStatus(StatusAgendamento status) { this.status = status; }

    public LocalAtendimento getLocalAtendimento() { return localAtendimento; }
    public void setLocalAtendimento(LocalAtendimento localAtendimento) { this.localAtendimento = localAtendimento; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}