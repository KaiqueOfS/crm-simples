package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.dto.MeuDiaResponse;
import com.kaique.crm_simples.service.MeuDiaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller do painel "Meu Dia" (Fase 12).
 *
 * Endpoint exige autenticação JWT (mesma configuração de segurança das
 * demais rotas /api/**); os dados retornados já são escopados ao usuário
 * autenticado por MeuDiaService/AgendamentoService.
 */
@RestController
@RequestMapping("/api/meu-dia")
public class MeuDiaController {

    private final MeuDiaService service;

    public MeuDiaController(MeuDiaService service) {
        this.service = service;
    }

    @GetMapping
    public MeuDiaResponse obter() {
        return service.montarPainel();
    }
}
