package com.kaique.crm_simples.model;

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

    // Senha do usuário — deve ter no mínimo 6 caracteres
    // O valor armazenado no banco é sempre o hash BCrypt
    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    private String senha;

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    /**
     * Atualiza o nome do usuário.
     *
     * @param nome novo nome.
     */
    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    /**
     * Atualiza o e-mail do usuário.
     *
     * @param email novo e-mail.
     */
    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    /**
     * Atualiza a senha do usuário.
     *
     * Este método deve receber a senha já criptografada.
     *
     * @param senhaCriptografada senha criptografada via BCrypt.
     */
    public void alterarSenha(String senhaCriptografada) {
        this.senha = senhaCriptografada;
    }
}