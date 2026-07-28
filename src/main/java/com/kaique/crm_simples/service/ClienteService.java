package com.kaique.crm_simples.service;

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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Serviço responsável pelas regras de negócio dos clientes.
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
    public PaginaResponse<Cliente> listarTodos(int pagina, int tamanho, String termo, StatusLead status) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();
        Pageable pageable = PageRequest.of(pagina, tamanho, Sort.by("nome").ascending());

        if (status != null) {
            return PaginaResponse.de(repository.findByUsuarioAndStatus(usuario, status, pageable));
        }

        if (termo != null && !termo.isBlank()) {
            return PaginaResponse.de(repository.buscarPorUsuarioETermo(usuario, termo.trim(), pageable));
        }

        return PaginaResponse.de(repository.findByUsuario(usuario, pageable));
    }

    /**
     * Busca um cliente pelo ID, garantindo que pertence ao usuário autenticado.
     */
    public Cliente buscarPorId(Long id) {
        return buscarClienteDoUsuario(id);
    }

    /**
     * Salva um novo cliente vinculado ao usuário autenticado.
     */
    public Cliente salvar(Cliente cliente) {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();
        cliente.setUsuario(usuario);
        Cliente salvo = repository.save(cliente);
        log.info("Cliente criado: id={} usuario={}", salvo.getId(), usuario.getEmail());
        return salvo;
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
    public Cliente atualizar(Long id, Cliente clienteAtualizado) {
        Cliente cliente = buscarClienteDoUsuario(id);
        cliente.atualizarDados(clienteAtualizado);
        return repository.save(cliente);
    }

    /**
     * Atualiza o status do cliente no funil de vendas.
     */
    public Cliente alterarStatus(Long id, StatusLeadRequest request) {
        Cliente cliente = buscarClienteDoUsuario(id);
        cliente.setStatus(request.getStatus());
        return repository.save(cliente);
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
