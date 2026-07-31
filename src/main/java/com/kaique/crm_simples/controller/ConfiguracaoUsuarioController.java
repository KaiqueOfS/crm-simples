package com.kaique.crm_simples.controller;

import com.kaique.crm_simples.dto.ConfiguracaoUsuarioRequest;
import com.kaique.crm_simples.dto.ConfiguracaoUsuarioResponse;
import com.kaique.crm_simples.service.ConfiguracaoUsuarioService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pela configuração inicial de negócio do usuário
 * (Sprint 14 — onboarding). Rota protegida por padrão (SecurityConfig já
 * exige autenticação em qualquer /api/**, nenhuma mudança necessária lá).
 */
@RestController
@RequestMapping("/api/configuracao-usuario")
public class ConfiguracaoUsuarioController {

    private final ConfiguracaoUsuarioService service;

    public ConfiguracaoUsuarioController(ConfiguracaoUsuarioService service) {
        this.service = service;
    }

    @GetMapping
    public ConfiguracaoUsuarioResponse buscar() {
        return service.buscar();
    }

    @PostMapping
    public ConfiguracaoUsuarioResponse salvar(@Valid @RequestBody ConfiguracaoUsuarioRequest request) {
        return service.salvar(request);
    }
}
