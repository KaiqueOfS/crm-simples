package com.kaique.crm_simples.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limita tentativas de login por IP e por e-mail, para dificultar
 * força bruta e credential stuffing contra /api/auth/login.
 *
 * Cada chave (um IP, um e-mail normalizado) tem seu próprio "balde" de
 * tentativas (Bucket4j) que se enche de novo com o tempo — ver
 * docs/RATE-LIMITING.md para os números e o motivo de cada um.
 *
 * Implementação em memória (ConcurrentHashMap), adequada porque a
 * aplicação roda como instância única — não há Redis nem qualquer
 * outro backend distribuído no projeto hoje. Se um dia a aplicação
 * escalar horizontalmente, os buckets precisam migrar para um backend
 * compartilhado (Bucket4j suporta isso nativamente, trocando só a
 * implementação de ProxyManager).
 */
@Component
public class LoginRateLimiter {

    private final int limitePorEmail;
    private final int limitePorIp;
    private final Duration janela;

    private final ConcurrentHashMap<String, Bucket> bucketsPorIp = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> bucketsPorEmail = new ConcurrentHashMap<>();

    public LoginRateLimiter(
            @Value("${app.rate-limit.login.max-tentativas-email:5}") int limitePorEmail,
            @Value("${app.rate-limit.login.max-tentativas-ip:10}") int limitePorIp,
            @Value("${app.rate-limit.login.janela-segundos:60}") long janelaSegundos) {
        this.limitePorEmail = limitePorEmail;
        this.limitePorIp = limitePorIp;
        this.janela = Duration.ofSeconds(janelaSegundos);
    }

    /**
     * @return true se a tentativa pode prosseguir; false se o IP ou o
     * e-mail (ou ambos) já esgotaram as tentativas na janela atual.
     *
     * Sempre tenta consumir de AMBOS os buckets, mesmo que um já tenha
     * negado — assim os dois contadores refletem toda tentativa real,
     * sem inconsistência entre "quantas vezes esse IP tentou" e
     * "quantas vezes esse e-mail foi tentado".
     */
    public boolean tentativaPermitida(String ip, String email) {
        boolean permitidoIp = bucketDoIp(ip).tryConsume(1);
        boolean permitidoEmail = bucketDoEmail(email).tryConsume(1);
        return permitidoIp && permitidoEmail;
    }

    private Bucket bucketDoIp(String ip) {
        String chave = (ip == null || ip.isBlank()) ? "desconhecido" : ip;
        return bucketsPorIp.computeIfAbsent(chave, k -> novoBucket(limitePorIp));
    }

    private Bucket bucketDoEmail(String email) {
        String chave = (email == null) ? "" : email.trim().toLowerCase();
        return bucketsPorEmail.computeIfAbsent(chave, k -> novoBucket(limitePorEmail));
    }

    private Bucket novoBucket(int capacidade) {
        Bandwidth limite = Bandwidth.classic(capacidade, Refill.greedy(capacidade, janela));
        return Bucket.builder().addLimit(limite).build();
    }
}
