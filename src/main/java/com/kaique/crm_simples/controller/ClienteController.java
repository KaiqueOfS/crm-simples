package com.kaique.crm_simples.controller;


import com.kaique.crm_simples.model.Cliente;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import jakarta.validation.Valid;
import com.kaique.crm_simples.service.ClienteService;
import com.kaique.crm_simples.dto.StatusLeadRequest;

// Controller responsável por gerenciar os clientes
// recebe as requisições HTTP e retorna as respostas em JSON
@RestController
@RequestMapping("/clientes")
public class ClienteController {


    private final ClienteService service;

    public ClienteController(ClienteService service) {
        this.service = service;
    }

    // Lista todos os clientes pertencentes ao usuário autenticado
    @GetMapping
    public List<Cliente> listar() {
        return service.listarTodos();
    }

    // Busca um cliente específico pelo ID
    @GetMapping("/{id}")
    public Cliente buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    // Cadastra um novo cliente para o usuário autenticado
    @PostMapping
    public Cliente cadastrar(@Valid @RequestBody Cliente cliente) {
        return service.salvar(cliente);
    }

    // Remove um cliente
    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        service.deletar(id);
    }

    // Atualiza os dados de um cliente
    @PutMapping("/{id}")
    public Cliente atualizar(
            @PathVariable Long id,
            @Valid @RequestBody Cliente clienteAtualizado) {

        return service.atualizar(id, clienteAtualizado);
    }

    // Atualiza apenas o status do lead dentro do funil de vendas
    @PutMapping("/{id}/status")
    public Cliente alterarStatus(
            @PathVariable Long id,
            @RequestBody StatusLeadRequest request) {

        return service.alterarStatus(id, request);
    }
}