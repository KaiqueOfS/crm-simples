package com.kaique.crm_simples.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// Health check público da API — usado por monitoramento externo (ex.: uptime
// checker) que precise de um corpo JSON próprio, diferente do
// /actuator/health padrão do Spring (ver SecurityConfig).
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public Map<String, String> status() {
        return Map.of(
                "status", "UP",
                "service", "Orbis CRM");
    }
}
