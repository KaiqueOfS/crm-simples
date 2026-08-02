package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.AtualizarPerfilRequest;
import com.kaique.crm_simples.dto.CadastroUsuarioRequest;
import com.kaique.crm_simples.exception.EmailJaCadastradoException;
import com.kaique.crm_simples.exception.SenhasNaoCoincidemException;
import com.kaique.crm_simples.exception.UsuarioNaoEncontradoException;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

/**
 * Serviço responsável pelas regras de negócio
 * relacionadas aos usuários do sistema.
 *
 * É aqui que ficam as regras — o controller apenas
 * recebe a requisição e repassa para cá.
 */
@Service
public class UsuarioService {

    // BCrypt trunca (e no Spring Security lança exceção) senhas acima de 72
    // bytes — validamos em bytes, não em caracteres, porque um caractere
    // multibyte (acentos, emojis, CJK) pode passar de 1 byte cada.
    private static final int SENHA_MAX_BYTES = 72;

    // Só letras (com acento), espaço, hífen e apóstrofo.
    private static final Pattern NOME_CARACTERES_VALIDOS = Pattern.compile("^[\\p{L}\\s'-]+$");

    // Nome completo: ao menos duas palavras separadas por espaço. Assume
    // que o nome já passou por NOME_CARACTERES_VALIDOS e por setNome()
    // (trim + colapso de espaços), então cada "palavra" aqui já é só
    // letras/hífen/apóstrofo.
    private static final Pattern NOME_COMPLETO = Pattern.compile("^[\\p{L}'-]+(?:\\s[\\p{L}'-]+)+$");

    private final UsuarioRepository repository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository repository,
            BCryptPasswordEncoder passwordEncoder) {

        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Cadastra um novo usuário a partir dos dados do formulário de cadastro.
     *
     * Valida a confirmação de senha aqui (nunca só no frontend) e delega
     * a persistência para {@link #salvar(Usuario)}.
     *
     * @param request dados recebidos na requisição.
     * @return usuário salvo no banco.
     */
    public Usuario cadastrar(CadastroUsuarioRequest request) {

        // Campo vazio já foi barrado pelo @NotBlank do DTO antes de chegar
        // aqui. A partir daqui a prioridade é: caracteres inválidos → nome
        // incompleto (ver validarNome).
        validarNome(request.getNome());

        if (!request.getSenha().equals(request.getConfirmarSenha())) {
            throw new SenhasNaoCoincidemException();
        }

        Usuario usuario = new Usuario();
        usuario.setNome(request.getNome());
        usuario.setEmail(request.getEmail());
        usuario.alterarSenha(request.getSenha());

        return salvar(usuario);
    }

    /**
     * Valida o campo nome do cadastro na ordem exigida pela Sprint 3.2.1.1:
     * 1) caracteres inválidos, 2) nome incompleto (uma palavra só).
     * Campo vazio é responsabilidade do @NotBlank do DTO (roda antes).
     */
    private void validarNome(String nome) {

        if (!NOME_CARACTERES_VALIDOS.matcher(nome).matches()) {
            throw new RuntimeException("O nome deve conter apenas letras.");
        }

        if (!NOME_COMPLETO.matcher(nome).matches()) {
            throw new RuntimeException("Informe seu nome completo (nome e sobrenome).");
        }
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

        // Senha em bytes acima do limite do BCrypt: valida ANTES de
        // criptografar para nunca deixar a exceção crua do BCrypt
        // ("password cannot be more than 72 bytes", em inglês) vazar
        // para o cliente.
        if (usuario.getSenha().getBytes(StandardCharsets.UTF_8).length > SENHA_MAX_BYTES) {
            throw new RuntimeException("Senha não pode ter mais que 72 bytes.");
        }

        // Criptografa a senha antes de salvar no banco
        usuario.alterarSenha(
                passwordEncoder.encode(usuario.getSenha())
        );

        try {
            return repository.save(usuario);
        } catch (DataIntegrityViolationException e) {
            // Condição de corrida: duas requisições simultâneas passaram
            // pela verificação de e-mail acima antes de qualquer uma
            // salvar. Sem isso, o cliente recebia o erro cru do banco
            // (nome de tabela, coluna e constraint) em vez da mensagem
            // de negócio já usada no caso não concorrente.
            throw new EmailJaCadastradoException(usuario.getEmail());
        }
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