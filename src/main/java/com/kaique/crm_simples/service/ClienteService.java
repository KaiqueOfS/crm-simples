package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.ClienteRequest;
import com.kaique.crm_simples.dto.ClienteResponse;
import com.kaique.crm_simples.dto.StatusLeadRequest;
import com.kaique.crm_simples.dto.PaginaResponse;
import com.kaique.crm_simples.exception.AcessoNegadoException;
import com.kaique.crm_simples.exception.ClienteNaoEncontradoException;
import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.StatusLead;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.ClienteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.regex.Pattern;

/**
 * Serviço responsável pelas regras de negócio dos clientes.
 *
 * Fronteira DTO ↔ entidade: este service é o único lugar que converte
 * ClienteRequest em Cliente e Cliente em ClienteResponse. O dono
 * (usuario) nunca vem do request — é sempre atribuído aqui a partir
 * do usuário autenticado (ver docs/DTO-ARCHITECTURE.md).
 */
@Service
public class ClienteService {

    private static final Logger log = LoggerFactory.getLogger(ClienteService.class);

    // Só letras (com acento), espaço, hífen e apóstrofo.
    private static final Pattern NOME_CARACTERES_VALIDOS = Pattern.compile("^[\\p{L}\\s'-]+$");

    // Nome completo: ao menos duas palavras separadas por espaço. Assume
    // que o nome já passou por NOME_CARACTERES_VALIDOS e por
    // ClienteRequest.setNome() (trim + colapso de espaços), então cada
    // "palavra" aqui já é só letras/hífen/apóstrofo.
    private static final Pattern NOME_COMPLETO = Pattern.compile("^[\\p{L}'-]+(?:\\s[\\p{L}'-]+)+$");

    private final ClienteRepository repository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    public ClienteService(
            ClienteRepository repository,
            UsuarioAutenticadoService usuarioAutenticadoService) {
        this.repository = repository;
        this.usuarioAutenticadoService = usuarioAutenticadoService;
    }

    /**
     * Lista todos os clientes do usuário autenticado.
     */
    public PaginaResponse<ClienteResponse> listarTodos(int pagina, int tamanho, String termo, StatusLead status) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();
        Pageable pageable = PageRequest.of(pagina, tamanho, Sort.by("nome").ascending());

        Page<Cliente> resultado;
        if (status != null) {
            resultado = repository.findByUsuarioAndStatus(usuario, status, pageable);
        } else if (termo != null && !termo.isBlank()) {
            resultado = repository.buscarPorUsuarioETermo(usuario, termo.trim(), pageable);
        } else {
            resultado = repository.findByUsuario(usuario, pageable);
        }

        return PaginaResponse.de(resultado.map(ClienteResponse::de));
    }

    /**
     * Busca um cliente pelo ID, garantindo que pertence ao usuário autenticado.
     */
    public ClienteResponse buscarPorId(Long id) {
        return ClienteResponse.de(buscarClienteDoUsuario(id));
    }

    /**
     * Salva um novo cliente vinculado ao usuário autenticado.
     *
     * O request não tem campo "usuario" — o dono é sempre o usuário
     * autenticado, nunca algo vindo do corpo da requisição.
     */
    public ClienteResponse salvar(ClienteRequest request) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();

        // Campo vazio já foi barrado pelo @NotBlank do DTO antes de chegar
        // aqui. A partir daqui a prioridade é: caracteres inválidos → nome
        // incompleto (ver validarNome).
        validarNome(request.getNome());

        Cliente cliente = new Cliente();
        cliente.setNome(request.getNome());
        cliente.setTelefone(request.getTelefone());
        cliente.setEmail(request.getEmail());
        cliente.setObservacoes(request.getObservacoes());
        cliente.setStatus(request.getStatusLead());
        cliente.setUsuario(usuario);

        Cliente salvo = repository.save(cliente);
        log.info("Cliente criado: id={} usuario={}", salvo.getId(), usuario.getEmail());
        return ClienteResponse.de(salvo);
    }

    /**
     * Remove um cliente do usuário autenticado.
     */
    public void deletar(Long id) {
        Cliente cliente = buscarClienteDoUsuario(id);
        repository.delete(cliente);
        log.info("Cliente removido: id={}", id);
    }

    /**
     * Atualiza os dados cadastrais de um cliente.
     * O status não é alterado aqui — tem endpoint próprio.
     */
    public ClienteResponse atualizar(Long id, ClienteRequest request) {
        // Confirma posse do recurso antes de validar os dados — evita
        // rodar regra de negócio sobre um cliente que nem pertence a
        // quem está pedindo a alteração.
        Cliente cliente = buscarClienteDoUsuario(id);

        // Clientes cadastrados antes da exigência de nome completo podem
        // ter nome incompleto no banco. Só reaplicamos validarNome quando
        // o nome de fato muda nesta edição — assim dá pra editar telefone/
        // e-mail de um cliente antigo sem ser barrado por um nome que já
        // estava lá antes da regra existir. Se o nome muda, a regra atual
        // vale integralmente, inclusive para "completar" um nome antigo.
        boolean nomeAlterado = !cliente.getNome().equals(request.getNome());
        if (nomeAlterado) {
            validarNome(request.getNome());
        }

        cliente.setNome(request.getNome());
        cliente.setTelefone(request.getTelefone());
        cliente.setEmail(request.getEmail());
        cliente.setObservacoes(request.getObservacoes());
        return ClienteResponse.de(repository.save(cliente));
    }

    /**
     * Atualiza o status do cliente no funil de vendas.
     */
    public ClienteResponse alterarStatus(Long id, StatusLeadRequest request) {
        Cliente cliente = buscarClienteDoUsuario(id);
        cliente.setStatus(request.getStatus());
        return ClienteResponse.de(repository.save(cliente));
    }

    /**
     * Valida o campo nome do cliente na ordem exigida pela Sprint 3.3:
     * 1) caracteres inválidos, 2) nome incompleto (uma palavra só).
     * Campo vazio é responsabilidade do @NotBlank do DTO (roda antes).
     */
    private void validarNome(String nome) {

        if (!NOME_CARACTERES_VALIDOS.matcher(nome).matches()) {
            throw new RuntimeException("Nome deve conter apenas letras.");
        }

        if (!NOME_COMPLETO.matcher(nome).matches()) {
            throw new RuntimeException("Informe o nome completo.");
        }
    }

    /**
     * Busca um cliente garantindo que pertence ao usuário autenticado.
     * Lança exceção se não encontrar ou se for de outro usuário.
     */
    private Cliente buscarClienteDoUsuario(Long id) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();

        Cliente cliente = repository.findById(id)
                .orElseThrow(() -> new ClienteNaoEncontradoException(id));

        // Segurança: impede que um usuário acesse clientes de outro
        if (!cliente.getUsuario().getId().equals(usuario.getId())) {
            throw new AcessoNegadoException();
        }

        return cliente;
    }
}
