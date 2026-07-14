package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.StatusLeadRequest;
import com.kaique.crm_simples.exception.AcessoNegadoException;
import com.kaique.crm_simples.exception.ClienteNaoEncontradoException;
import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.ClienteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Serviço responsável pelas regras de negócio relacionadas
 * ao gerenciamento de clientes.
 */
@Service
public class ClienteService {

    // Repositório responsável pelas operações com clientes
    private final ClienteRepository repository;

    // Serviço responsável por identificar o usuário autenticado
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    /**
     * Injeta as dependências necessárias para o serviço.
     */
    public ClienteService(
            ClienteRepository repository,
            UsuarioAutenticadoService usuarioAutenticadoService) {

        this.repository = repository;
        this.usuarioAutenticadoService = usuarioAutenticadoService;
    }

    /**
     * Lista todos os clientes pertencentes ao usuário autenticado.
     *
     * @return lista de clientes.
     */
    public List<Cliente> listarTodos() {

        // Obtém o usuário autenticado
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();

        // Retorna apenas os clientes do usuário logado
        return repository.findByUsuario(usuario);
    }

    /**
     * Busca um cliente pelo ID.
     *
     * @param id identificador do cliente.
     * @return cliente encontrado.
     */
    public Cliente buscarPorId(Long id) {
        return buscarClienteDoUsuario(id);
    }

    /**
     * Salva um novo cliente.
     *
     * O cliente é automaticamente associado ao usuário autenticado.
     *
     * @param cliente cliente a ser cadastrado.
     * @return cliente salvo.
     */
    public Cliente salvar(Cliente cliente) {

        // Obtém o usuário autenticado
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();

        // Vincula o cliente ao usuário logado
        cliente.setUsuario(usuario);

        return repository.save(cliente);
    }

    /**
     * Remove um cliente pertencente ao usuário autenticado.
     *
     * @param id identificador do cliente.
     */
    public void deletar(Long id) {

        Cliente cliente = buscarClienteDoUsuario(id);

        repository.delete(cliente);
    }

    /**
     * Atualiza os dados de um cliente.
     *
     * @param id identificador do cliente.
     * @param clienteAtualizado novos dados do cliente.
     * @return cliente atualizado.
     */
    public Cliente atualizar(Long id, Cliente clienteAtualizado) {

        Cliente cliente = buscarClienteDoUsuario(id);

        // Atualiza apenas os dados editáveis.
        // O status é alterado por um endpoint específico.
        cliente.atualizarDados(clienteAtualizado);

        return repository.save(cliente);
    }

    /**
     * Atualiza o status de um cliente no funil de vendas.
     *
     * @param id identificador do cliente.
     * @param request novo status do cliente.
     * @return cliente atualizado.
     */
    public Cliente alterarStatus(Long id, StatusLeadRequest request) {

        Cliente cliente = buscarClienteDoUsuario(id);

        // Atualiza apenas o status do cliente
        cliente.setStatus(request.getStatus());

        return repository.save(cliente);
    }

    /**
     * Busca um cliente garantindo que ele pertença ao usuário autenticado.
     *
     * @param id identificador do cliente.
     * @return cliente encontrado.
     */
    private Cliente buscarClienteDoUsuario(Long id) {

        // Obtém o usuário autenticado
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();

        Cliente cliente = repository.findById(id)
                .orElseThrow(() ->
                        new ClienteNaoEncontradoException(id));

        // Impede que um usuário acesse clientes de outra conta
        if (!cliente.getUsuario().getId().equals(usuario.getId())) {
            throw new AcessoNegadoException();
        }

        return cliente;
    }
}