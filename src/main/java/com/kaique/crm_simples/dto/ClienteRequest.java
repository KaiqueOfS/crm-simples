package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.StatusLead;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Dados de entrada para criar ou atualizar um cliente.
 *
 * Contém só o que o cliente da API tem permissão de definir —
 * propositalmente sem "id" e sem "usuario". O dono do cliente é
 * sempre o usuário autenticado, atribuído pelo ClienteService;
 * não existe campo aqui capaz de alterar isso.
 */
public class ClienteRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
    private String nome;

    @NotBlank(message = "Telefone é obrigatório")
    @Size(min = 8, max = 20, message = "Telefone deve ter entre 8 e 20 caracteres")
    private String telefone;

    @Email(message = "E-mail inválido")
    private String email;

    @Size(max = 500, message = "Observações devem ter no máximo 500 caracteres")
    private String observacoes;

    // Mesmo padrão da entidade: recém-criado começa em NOVO se não informado.
    private StatusLead statusLead = StatusLead.NOVO;

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }

    public StatusLead getStatusLead() { return statusLead; }
    public void setStatusLead(StatusLead statusLead) { this.statusLead = statusLead; }
}
