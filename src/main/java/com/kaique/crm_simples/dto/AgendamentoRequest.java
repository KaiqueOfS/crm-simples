package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.enums.LocalAtendimento;
import com.kaique.crm_simples.model.enums.StatusAgendamento;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

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
    @Size(max = 255, message = "Título deve ter no máximo 255 caracteres")
    private String titulo;

    // Mesmo limite da coluna VARCHAR(255) no banco, ver V1__init.sql
    // (mesmo padrão de "titulo", que já tinha esse @Size).
    @Size(max = 255, message = "Nome da pessoa deve ter no máximo 255 caracteres")
    private String pessoa;

    // Opcional nesta fase: quando informado, o service resolve o Cliente
    // (garantindo que pertence ao usuário autenticado) e sincroniza "pessoa"
    // a partir do nome dele. Ausente, o comportamento é o mesmo de antes
    // (pessoa como texto livre).
    private Long clienteId;

    @NotNull(message = "Data é obrigatória")
    private LocalDate data;

    @NotNull(message = "Hora é obrigatória")
    private LocalTime hora;

    // Mesmo padrão da entidade: mesmos defaults se não informado. Restrito
    // aos valores que o frontend conhece (ver CATEGORIA_CFG em AgendaItem.tsx)
    // — uma categoria fora dessa lista quebraria a busca em CATEGORIA_CFG[categoria]
    // no frontend (chave inexistente, undefined.propriedade).
    @Pattern(
            regexp = "^(atendimento|retorno|orcamento|reuniao|urgente|outro)$",
            message = "Categoria inválida")
    private String categoria = "atendimento";

    @Min(value = 0, message = "Lembrete não pode ser negativo")
    private Integer lembrete = 0;

    // Opcional: ausente na criação, o service usa PENDENTE. Na atualização,
    // ausente mantém o status atual do agendamento (não reseta para PENDENTE).
    private StatusAgendamento status;

    // Só é obrigatório quando a configuração do usuário é AMBOS — validado
    // no AgendamentoService (depende do usuário autenticado, não pode ser
    // expresso com @NotNull aqui). Para NO_ESTABELECIMENTO/EXTERNO, o
    // service ignora o que vier aqui e preenche automaticamente.
    private LocalAtendimento localAtendimento;

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getPessoa() { return pessoa; }
    public void setPessoa(String pessoa) { this.pessoa = pessoa; }

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }

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
}
