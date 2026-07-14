package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.dto.DashboardResponse;
import com.kaique.crm_simples.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * ==========================================================
 * Classe: DashboardController
 *
 * Responsabilidade:
 * Expor os endpoints responsáveis pelo dashboard do CRM.
 *
 * O dashboard apresenta indicadores importantes para que
 * o usuário acompanhe rapidamente a situação dos seus leads.
 *
 * Projeto: CRM Simples
 * ==========================================================
 */
@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    // ==========================================================
    // Dependências
    // ==========================================================

    private final DashboardService service;

    // ==========================================================
    // Construtor
    // ==========================================================

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    // ==========================================================
    // Métodos Públicos
    // ==========================================================

    /**
     * Retorna os indicadores do dashboard.
     *
     * @return estatísticas dos clientes por etapa do funil.
     */
    @GetMapping
    public DashboardResponse dashboard() {
        return service.gerarDashboard();
    }

}