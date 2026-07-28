package com.kaique.crm_simples.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Serviço responsável por gerar e validar os tokens JWT.
 *
 * O segredo vem da propriedade "jwt.secret" (application.properties),
 * que por sua vez é resolvida a partir da variável de ambiente JWT_SECRET
 * (carregada do .env em CrmSimplesApplication). Isso mantém uma única
 * fonte de verdade para variáveis de ambiente na aplicação, em vez de
 * ler o .env diretamente aqui também.
 */
@Service
public class JwtService {

    private final SecretKey key;

    public JwtService(@Value("${jwt.secret}") String secret) {

        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET não configurado. Defina a variável de ambiente " +
                            "JWT_SECRET (arquivo .env) antes de iniciar a aplicação.");
        }

        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET precisa ter pelo menos 32 caracteres para o algoritmo HMAC-SHA256.");
        }

        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String gerarToken(String email) {

        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(
                        new Date(
                                System.currentTimeMillis()
                                        + 1000 * 60 * 60 * 24
                        ))
                .signWith(key)
                .compact();
    }

    public String extrairEmail(String token) {

        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean tokenValido(String token) {

        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);

            return true;

        } catch (Exception e) {
            return false;
        }
    }
}