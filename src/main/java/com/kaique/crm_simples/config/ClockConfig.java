package com.kaique.crm_simples.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Expõe o relógio do sistema como bean para que services com lógica
 * sensível a data/hora (ex.: MeuDiaService) recebam um Clock por injeção
 * em vez de chamar LocalDate.now()/LocalTime.now() diretamente — permite
 * testar essa lógica com um Clock.fixed(...) determinístico.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
