package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.StatusLead;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

    // Caracteres inválidos e "nome incompleto" NÃO são validados aqui com
    // @Pattern: Bean Validation não garante ordem entre duas anotações no
    // mesmo campo, e o GlobalExceptionHandler guarda só uma mensagem por
    // campo num Map — as regras colidiam e a mensagem errada podia
    // "vencer" (mesmo problema já corrigido no Cadastro de Usuário — ver
    // ClienteService.validarNome, que aplica a prioridade determinística:
    // vazio → caracteres → nome completo).
    @NotBlank(message = "Nome é obrigatório.")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres.")
    private String nome;

    @NotBlank(message = "Telefone é obrigatório")
    @Size(min = 8, max = 20, message = "Telefone deve ter entre 8 e 20 caracteres")
    @Pattern(
            regexp = "^(?=(?:.*\\d){8,})[0-9()+\\-\\s]+$",
            message = "Telefone deve conter apenas números, espaços, parênteses, + e - (mínimo 8 dígitos)")
    private String telefone;

    @Email(message = "E-mail inválido")
    private String email;

    @Size(max = 500, message = "Observações devem ter no máximo 500 caracteres")
    private String observacoes;

    // Mesmo padrão da entidade: recém-criado começa em NOVO se não informado.
    private StatusLead statusLead = StatusLead.NOVO;

    public String getNome() { return nome; }

    // Remove espaços nas extremidades e colapsa espaços duplos digitados/colados no meio do nome.
    public void setNome(String nome) {
        this.nome = nome == null ? null : nome.trim().replaceAll("\\s+", " ");
    }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public String getEmail() { return email; }

    // E-mail é opcional: normaliza para minúsculas e sem espaços, e trata
    // string vazia como "não informado" (null), não como valor salvo.
    public void setEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            this.email = null;
        } else {
            this.email = email.trim().toLowerCase();
        }
    }

    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }

    public StatusLead getStatusLead() { return statusLead; }
    public void setStatusLead(StatusLead statusLead) { this.statusLead = statusLead; }
}
