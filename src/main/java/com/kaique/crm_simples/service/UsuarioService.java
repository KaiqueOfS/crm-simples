package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.AtualizarPerfilRequest;
import com.kaique.crm_simples.exception.EmailJaCadastradoException;
import com.kaique.crm_simples.exception.SenhasNaoCoincidemException;
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
        boolean emailEmUso = repository
                .findByEmail(usuario.getEmail())
                .isPresent();

        if (emailEmUso) {
            throw new EmailJaCadastradoException(usuario.getEmail());
        }

        // Criptografa a senha antes de salvar no banco
        usuario.alterarSenha(
                passwordEncoder.encode(usuario.getSenha())
        );

        return repository.save(usuario);
    }

    /**
     * Busca um usuário pelo e-mail.
     *
     * Usamos Optional para evitar NullPointerException.
     * Se não encontrar, lançamos nossa exceção customizada.
     *
     * @param email e-mail do usuário.
     * @return usuário encontrado.
     */
    public Usuario buscarPorEmail(String email) {

        return repository.findByEmail(email)
                .orElseThrow(UsuarioNaoEncontradoException::new);
    }

    /**
     * Atualiza o perfil do usuário autenticado.
     *
     * Permite alterar o nome e, opcionalmente, a senha.
     * Se a nova senha vier preenchida, valida se as duas
     * senhas coincidem antes de criptografar e salvar.
     *
     * @param email   e-mail do usuário autenticado (vem do token JWT).
     * @param request novos dados do perfil.
     * @return usuário atualizado.
     */
    public Usuario atualizarPerfil(String email, AtualizarPerfilRequest request) {

        // Busca o usuário autenticado pelo e-mail do token
        Usuario usuario = buscarPorEmail(email);

        // Atualiza o nome sempre
        usuario.setNome(request.getNome());

        // Atualiza a senha apenas se uma nova senha foi informada
        boolean novaSenhaInformada = request.getNovaSenha() != null
                && !request.getNovaSenha().isBlank();

        if (novaSenhaInformada) {

            // Valida se a confirmação bate com a nova senha
            if (!request.getNovaSenha().equals(request.getConfirmarSenha())) {
                throw new SenhasNaoCoincidemException();
            }

            // Valida tamanho mínimo da nova senha
            if (request.getNovaSenha().length() < 6) {
                throw new RuntimeException("Senha deve ter no mínimo 6 caracteres.");
            }

            // Criptografa e salva a nova senha
            usuario.alterarSenha(
                    passwordEncoder.encode(request.getNovaSenha())
            );
        }

        return repository.save(usuario);
    }
}