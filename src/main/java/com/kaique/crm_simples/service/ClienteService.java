package com.kaique.crm_simples.service;

import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.ClienteRepository;
import com.kaique.crm_simples.repository.UsuarioRepository;
import com.kaique.crm_simples.exception.ClienteNaoEncontradoException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.kaique.crm_simples.exception.AcessoNegadoException;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository repository;
    private final UsuarioRepository usuarioRepository;

    public ClienteService(
            ClienteRepository repository,
            UsuarioRepository usuarioRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<Cliente> listarTodos() {

        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        System.out.println("AUTH: " + authentication);

        if (authentication != null) {
            System.out.println("NAME: " + authentication.getName());
        }

        String email = authentication.getName();

        Usuario usuario = usuarioRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Usuário não encontrado"));

        return repository.findByUsuario(usuario);
    }

    public Cliente buscarPorId(Long id) {
        return buscarClienteDoUsuario(id);
    }

    public Cliente salvar(Cliente cliente) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email = authentication.getName();

        Usuario usuario = usuarioRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Usuário não encontrado"));

        cliente.setUsuario(usuario);

        return repository.save(cliente);
    }

    public void deletar(Long id) {

        Cliente cliente = buscarClienteDoUsuario(id);

        repository.delete(cliente);
    }

    public Cliente atualizar(Long id, Cliente clienteAtualizado) {

        Cliente cliente = buscarClienteDoUsuario(id);

        if (cliente == null) {
            return null;
        }

        cliente.setNome(clienteAtualizado.getNome());
        cliente.setTelefone(clienteAtualizado.getTelefone());
        cliente.setEmail(clienteAtualizado.getEmail());
        cliente.setObservacoes(clienteAtualizado.getObservacoes());

        return repository.save(cliente);
    }
    private Cliente buscarClienteDoUsuario(Long id) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email = authentication.getName();

        Usuario usuario = usuarioRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Usuário não encontrado"));

        Cliente cliente = repository.findById(id)
                .orElseThrow(() ->
                        new ClienteNaoEncontradoException(id));

        if (!cliente.getUsuario().getId().equals(usuario.getId())) {
            throw new AcessoNegadoException();
        }

        return cliente;
    }
}