package com.kaique.crm_simples.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Dados de entrada para o cadastro de um novo usuário (Sprint 3.2.1).
 *
 * DTO próprio (em vez de vincular {@link com.kaique.crm_simples.model.Usuario}
 * direto ao corpo da requisição) para poder exigir confirmarSenha sem afetar
 * as regras de validação usadas pelo módulo de Perfil, que reutiliza a
 * entidade Usuario com constraints próprias (ver AtualizarPerfilRequest).
 */
public class CadastroUsuarioRequest {

    // Caracteres inválidos e "nome incompleto" (só uma palavra) NÃO são
    // validados aqui com @Pattern: Bean Validation não garante ordem entre
    // duas anotações no mesmo campo, e o GlobalExceptionHandler guarda só
    // uma mensagem por campo num Map — as duas regras colidiam e a mensagem
    // errada podia "vencer" (ver UsuarioService.validarNome, que aplica a
    // prioridade exigida: vazio → caracteres → nome completo).
    @NotBlank(message = "Informe seu nome.")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    private String nome;

    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
            message = "Senha deve ter no mínimo 8 caracteres, incluindo letras e números")
    private String senha;

    @NotBlank(message = "Confirmação de senha é obrigatória")
    private String confirmarSenha;

    public String getNome() { return nome; }

    // Remove espaços nas extremidades e colapsa espaços duplos digitados/colados no meio do nome.
    public void setNome(String nome) {
        this.nome = nome == null ? null : nome.trim().replaceAll("\\s+", " ");
    }

    public String getEmail() { return email; }

    public void setEmail(String email) {
        this.email = email == null ? null : email.trim().toLowerCase();
    }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }

    public String getConfirmarSenha() { return confirmarSenha; }
    public void setConfirmarSenha(String confirmarSenha) { this.confirmarSenha = confirmarSenha; }
}
