package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.dto.DashboardResponse;
import com.kaique.crm_simples.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller responsável pelos endpoints do dashboard.
 *
 * O dashboard apresenta indicadores importantes para que o usuário
 * acompanhe rapidamente a situação dos seus leads.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

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