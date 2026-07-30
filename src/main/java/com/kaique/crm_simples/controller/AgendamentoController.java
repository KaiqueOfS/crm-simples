package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.dto.AgendamentoRequest;
import com.kaique.crm_simples.dto.AgendamentoResponse;
import com.kaique.crm_simples.service.AgendamentoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller responsável pelos endpoints de agendamentos.
 *
 * Todos os endpoints exigem autenticação JWT.
 * Cada usuário só acessa seus próprios agendamentos.
 */
@RestController
@RequestMapping("/api/agendamentos")
public class AgendamentoController {

    private final AgendamentoService service;

    public AgendamentoController(AgendamentoService service) {
        this.service = service;
    }

    /**
     * Lista agendamentos do usuário autenticado.
     *
     * Parâmetros opcionais para filtrar por período:
     * - ?data=2025-07-14          → agenda do dia
     * - ?inicio=2025-07-14&fim=2025-07-21 → agenda da semana
     * - sem parâmetros            → todos os agendamentos
     */
    @GetMapping
    public List<AgendamentoResponse> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {

        if (data != null) {
            // Filtra por data específica (agenda do dia)
            return service.listarPorData(data);
        }

        if (inicio != null && fim != null) {
            // Filtra por período (agenda da semana)
            return service.listarPorPeriodo(inicio, fim);
        }

        // Retorna todos os agendamentos
        return service.listarTodos();
    }

    /**
     * Lista os agendamentos de um cliente específico do usuário autenticado.
     * Usado pela seção "Próximos compromissos" no painel de detalhes do cliente.
     */
    @GetMapping("/cliente/{clienteId}")
    public List<AgendamentoResponse> listarPorCliente(@PathVariable Long clienteId) {
        return service.listarPorCliente(clienteId);
    }

    /**
     * Cria um novo agendamento para o usuário autenticado.
     *
     * @param request dados do agendamento.
     * @return agendamento criado.
     */
    @PostMapping
    public AgendamentoResponse criar(@Valid @RequestBody AgendamentoRequest request) {
        return service.salvar(request);
    }

    /**
     * Atualiza um agendamento existente.
     *
     * @param id      identificador do agendamento.
     * @param request novos dados.
     * @return agendamento atualizado.
     */
    @PutMapping("/{id}")
    public AgendamentoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody AgendamentoRequest request) {
        return service.atualizar(id, request);
    }

    /**
     * Remove um agendamento.
     *
     * @param id identificador do agendamento.
     */
    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        service.deletar(id);
    }
}
