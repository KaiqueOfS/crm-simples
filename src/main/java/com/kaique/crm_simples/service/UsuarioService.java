package com.kaique.crm_simples.service;

import com.kaique.crm_simples.exception.EmailJaCadastradoException;
import com.kaique.crm_simples.exception.UsuarioNaoEncontradoException;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.UsuarioRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável pelas regras de negócio
 * relacionadas aos usuários do sistema.
 *
 * É aqui que ficam as regras — o controller apenas
 * recebe a requisição e repassa para cá.
 */
@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository repository,
            BCryptPasswordEncoder passwordEncoder) {

        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Cadastra um novo usuário.
     *
     * Antes de salvar, verificamos se o e-mail já existe
     * para evitar duplicatas. Depois criptografamos a senha
     * com BCrypt — nunca salvamos senha em texto puro.
     *
     * @param usuario dados recebidos na requisição.
     * @return usuário salvo no banco.
     */
    public Usuario salvar(Usuario usuario) {

        // Verifica se já existe outro usuário com esse e-mail
        // Fazemos isso antes de salvar para dar uma mensagem clara
        boolean emailEmUso = repository
                .findByEmail(usuario.getEmail())
                .isPresent();

        if (emailEmUso) {
            throw new EmailJaCadastradoException(usuario.getEmail());
        }

        // Criptografa a senha antes de salvar no banco
        // O BCrypt gera um hash diferente a cada vez, o que é seguro
        usuario.alterarSenha(
                passwordEncoder.encode(usuario.getSenha())
        );

        return repository.save(usuario);
    }

    /**
     * Busca um usuário pelo e-mail.
     *
     * Usamos Optional para evitar NullPointerException.
     * Se não encontrar, lançamos nossa exceção customizada
     * em vez de deixar o sistema quebrar sozinho.
     *
     * @param email e-mail do usuário.
     * @return usuário encontrado.
     */
    public Usuario buscarPorEmail(String email) {

        // orElseThrow lança a exceção automaticamente se não encontrar
        return repository.findByEmail(email)
                .orElseThrow(UsuarioNaoEncontradoException::new);
    }
}