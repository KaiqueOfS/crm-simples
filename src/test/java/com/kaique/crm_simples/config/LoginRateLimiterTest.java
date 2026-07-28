package com.kaique.crm_simples.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Testa LoginRateLimiter isoladamente (sem Spring), instanciando com
 * limites e janela pequenos — o mesmo componente usado em produção,
 * só configurado para caber num teste rápido.
 */
class LoginRateLimiterTest {

    @Test
    void permiteAteOLimiteEBloqueiaAPartirDaTentativaSeguinte() {
        LoginRateLimiter limiter = new LoginRateLimiter(3, 100, 60);

        assertTrue(limiter.tentativaPermitida("10.0.0.1", "ana@teste.local"));
        assertTrue(limiter.tentativaPermitida("10.0.0.1", "ana@teste.local"));
        assertTrue(limiter.tentativaPermitida("10.0.0.1", "ana@teste.local"));

        // 4ª tentativa para o mesmo e-mail, dentro da mesma janela: bloqueada.
        assertFalse(limiter.tentativaPermitida("10.0.0.1", "ana@teste.local"));
    }

    @Test
    void limitePorEmailNaoAfetaOutroEmailNoMesmoIp() {
        LoginRateLimiter limiter = new LoginRateLimiter(2, 100, 60);

        assertTrue(limiter.tentativaPermitida("10.0.0.1", "ana@teste.local"));
        assertTrue(limiter.tentativaPermitida("10.0.0.1", "ana@teste.local"));
        assertFalse(limiter.tentativaPermitida("10.0.0.1", "ana@teste.local"));

        // E-mail diferente, mesmo IP — tem seu próprio orçamento de tentativas.
        assertTrue(limiter.tentativaPermitida("10.0.0.1", "bruno@teste.local"));
    }

    @Test
    void limitePorIpBloqueiaMesmoComEmailsDiferentes() {
        LoginRateLimiter limiter = new LoginRateLimiter(100, 2, 60);

        assertTrue(limiter.tentativaPermitida("10.0.0.9", "um@teste.local"));
        assertTrue(limiter.tentativaPermitida("10.0.0.9", "dois@teste.local"));

        // Mesmo IP, terceiro e-mail diferente: o limite de IP já foi atingido.
        assertFalse(limiter.tentativaPermitida("10.0.0.9", "tres@teste.local"));
    }

    @Test
    void emailENormalizadoParaMaiusculasEEspacos() {
        LoginRateLimiter limiter = new LoginRateLimiter(1, 100, 60);

        assertTrue(limiter.tentativaPermitida("10.0.0.5", "  Ana@Teste.Local  "));

        // Mesmo e-mail, só com capitalização/espaço diferente — deve
        // contar como a mesma chave, não abrir um orçamento novo.
        assertFalse(limiter.tentativaPermitida("10.0.0.5", "ana@teste.local"));
    }

    @Test
    void liberaNovamenteDepoisQueAJanelaExpira() throws InterruptedException {
        LoginRateLimiter limiter = new LoginRateLimiter(1, 100, 1); // janela de 1 segundo

        assertTrue(limiter.tentativaPermitida("10.0.0.7", "carla@teste.local"));
        assertFalse(limiter.tentativaPermitida("10.0.0.7", "carla@teste.local"));

        Thread.sleep(1_200); // espera a janela de 1s passar, com folga

        assertTrue(limiter.tentativaPermitida("10.0.0.7", "carla@teste.local"));
    }
}
