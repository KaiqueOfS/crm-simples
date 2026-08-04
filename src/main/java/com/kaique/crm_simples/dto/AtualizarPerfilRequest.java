package com.kaique.crm_simples.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO utilizado para atualizar o perfil do usuário autenticado.
 *
 * Permite alterar o nome e a senha sem precisar reenviar o e-mail.
 * A senha nova é opcional — se não for enviada, mantém a atual.
 */
public class AtualizarPerfilRequest {

    // Nome do usuário (obrigatório, entre 2 e 100 caracteres)
    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
    @Pattern(regexp = "^[\\p{L}\\s'-]+$", message = "Nome deve conter apenas letras")
    private String nome;

    // Nova senha (opcional — se vier vazia ou nula, não atualiza).
    // Quando preenchida, segue a mesma regra do cadastro (CadastroUsuarioRequest):
    // mínimo 8 caracteres, com letra e número. @Pattern não dispara em
    // string vazia/nula, então o campo continua opcional.
    @Pattern(
            regexp = "^$|^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
            message = "Senha deve ter no mínimo 8 caracteres, incluindo letras e números")
    private String novaSenha;

    // Confirmação da nova senha — validada no service
    private String confirmarSenha;

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getNovaSenha() { return novaSenha; }
    public void setNovaSenha(String novaSenha) { this.novaSenha = novaSenha; }

    public String getConfirmarSenha() { return confirmarSenha; }
    public void setConfirmarSenha(String confirmarSenha) { this.confirmarSenha = confirmarSenha; }
}