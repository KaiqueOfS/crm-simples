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
        Cliente cliente = buscarClienteDoUsuario(id);
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
