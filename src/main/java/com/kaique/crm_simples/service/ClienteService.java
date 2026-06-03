package com.kaique.crm_simples.service;

import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.repository.ClienteRepository;
import org.springframework.stereotype.Service;
import com.kaique.crm_simples.exception.ClienteNaoEncontradoException;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository repository;

    public ClienteService(ClienteRepository repository) {
        this.repository = repository;
    }

    public List<Cliente> listarTodos() {
        return repository.findAll();
    }

    public Cliente buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new ClienteNaoEncontradoException(id));
    }

    public Cliente salvar(Cliente cliente) {
        return repository.save(cliente);
    }

    public void deletar(Long id) {
        repository.deleteById(id);
    }

    public Cliente atualizar(Long id, Cliente clienteAtualizado) {

        Cliente cliente = repository.findById(id)
                .orElseThrow(() ->
                        new ClienteNaoEncontradoException(id));

        if (cliente == null) {
            return null;
        }

        cliente.setNome(clienteAtualizado.getNome());
        cliente.setTelefone(clienteAtualizado.getTelefone());
        cliente.setEmail(clienteAtualizado.getEmail());
        cliente.setObservacoes(clienteAtualizado.getObservacoes());

        return repository.save(cliente);
    }
}