package com.kaique.crm_simples.controller;


import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.StatusLead;
import com.kaique.crm_simples.dto.PaginaResponse;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import com.kaique.crm_simples.service.ClienteService;
import com.kaique.crm_simples.dto.StatusLeadRequest;

// Controller responsável por gerenciar os clientes
// recebe as requisições HTTP e retorna as respostas em JSON
@RestController
@RequestMapping("/api/clientes")
public class ClienteController {


    private final ClienteService service;

    public ClienteController(ClienteService service) {
        this.service = service;
    }

    // Lista todos os clientes pertencentes ao usuário autenticado
    @GetMapping
    public PaginaResponse<Cliente> listar(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho,
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) StatusLead status) {

        int paginaSegura = Math.max(pagina, 0);
        int tamanhoSeguro = Math.clamp(tamanho, 1, 100);
        return service.listarTodos(paginaSegura, tamanhoSeguro, termo, status);
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
            @Valid @RequestBody StatusLeadRequest request) {

        return service.alterarStatus(id, request);
    }
}
