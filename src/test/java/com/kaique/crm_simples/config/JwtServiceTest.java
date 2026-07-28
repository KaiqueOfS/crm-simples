package com.kaique.crm_simples.config;

import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Garante que a fronteira de autenticação (tokenValido) rejeita
 * qualquer token que não seja exatamente o que foi emitido: adulterado,
 * assinado com outra chave, expirado ou simplesmente malformado.
 */
class JwtServiceTest {

    private static final String SEGREDO = "segredo-de-teste-com-mais-de-32-caracteres";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SEGREDO);
    }

    @Test
    void tokenGeradoEValidoEContemOEmailCorreto() {
        String token = jwtService.gerarToken("usuario@teste.local");

        assertTrue(jwtService.tokenValido(token));
        assertEquals("usuario@teste.local", jwtService.extrairEmail(token));
    }

    @Test
    void tokenAdulteradoEInvalido() {
        String token = jwtService.gerarToken("usuario@teste.local");
        String tokenAdulterado = token.substring(0, token.length() - 2) + "xx";

        assertFalse(jwtService.tokenValido(tokenAdulterado));
    }

    @Test
    void tokenAssinadoComOutraChaveEInvalido() {
        JwtService outroServico = new JwtService("outro-segredo-completamente-diferente-32c");
        String tokenDeOutraChave = outroServico.gerarToken("usuario@teste.local");

        assertFalse(jwtService.tokenValido(tokenDeOutraChave));
    }

    @Test
    void tokenExpiradoEInvalido() {
        SecretKey key = (SecretKey) ReflectionTestUtils.getField(jwtService, "key");

        String tokenExpirado = Jwts.builder()
                .subject("usuario@teste.local")
                .issuedAt(new Date(System.currentTimeMillis() - 2_000_000))
                .expiration(new Date(System.currentTimeMillis() - 1_000_000))
                .signWith(key)
                .compact();

        assertFalse(jwtService.tokenValido(tokenExpirado));
    }

    @Test
    void tokenMalformadoEInvalido() {
        assertFalse(jwtService.tokenValido("isso-nao-e-um-jwt"));
    }

    @Test
    void construtorRejeitaSegredoCurto() {
        assertThrows(IllegalStateException.class, () -> new JwtService("curto-demais"));
    }
}
