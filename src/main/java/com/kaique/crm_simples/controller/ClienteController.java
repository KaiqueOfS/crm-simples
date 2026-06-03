package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.repository.ClienteRepository;
import com.kaique.crm_simples.model.Cliente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import jakarta.validation.Valid;
import com.kaique.crm_simples.service.ClienteService;

// Controller responsável por gerenciar os clientes
// recebe as requisições HTTP e retorna as respostas em JSON
@RestController
@RequestMapping("/clientes")
public class ClienteController {


    private final ClienteService service;

    public ClienteController(ClienteService service) {
        this.service = service;
    }

    // Listagem e busca
    @GetMapping
    public List<Cliente> listar() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    public Cliente buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    // Cadastro de novo cliente
    @PostMapping
    public Cliente cadastrar(@Valid @RequestBody Cliente cliente) {
        return service.salvar(cliente);
    }

    // Remoção de cliente por ID
    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        service.deletar(id);
    }

    // Atualização dos dados de um cliente existente
    @PutMapping("/{id}")
    public Cliente atualizar(
            @PathVariable Long id,
            @Valid @RequestBody Cliente clienteAtualizado) {

        return service.atualizar(id, clienteAtualizado);
    }
}