package com.kaique.crm_simples.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Entidade que representa um usuário do sistema.
 *
 * Cada usuário possui seus próprios clientes e acessa
 * apenas os dados vinculados à sua conta.
 */
@Entity
@Table(name = "usuarios")
public class Usuario {

    // Identificador único do usuário
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nome do usuário (obrigatório, entre 2 e 100 caracteres)
    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
    private String nome;

    // E-mail utilizado para autenticação (obrigatório e único)
    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    @Column(unique = true)
    private String email;

    // Senha criptografada com BCrypt.
    // WRITE_ONLY = aceita na entrada (cadastro/login) mas NUNCA retorna na resposta JSON.
    // Isso impede que o hash vaze para o cliente mesmo que o token seja interceptado.
    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    // Indica se o usuário já concluiu a configuração inicial (Sprint 14).
    // Usuários cadastrados antes desta sprint começam com false (ver
    // V5__add_onboarding_usuario.sql) e verão a tela de onboarding.
    private boolean onboardingConcluido = false;

    public Long getId() { return id; }

    public String getNome() { return nome; }

    /**
     * Atualiza o nome do usuário.
     * @param nome novo nome.
     */
    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }

    /**
     * Atualiza o e-mail do usuário.
     * @param email novo e-mail.
     */
    public void setEmail(String email) { this.email = email; }

    public String getSenha() { return senha; }

    /**
     * Atualiza a senha do usuário.
     * Este método deve receber a senha já criptografada via BCrypt.
     * @param senhaCriptografada senha criptografada.
     */
    public void alterarSenha(String senhaCriptografada) { this.senha = senhaCriptografada; }

    public boolean isOnboardingConcluido() { return onboardingConcluido; }

    public void setOnboardingConcluido(boolean onboardingConcluido) { this.onboardingConcluido = onboardingConcluido; }
}