package com.kaique.crm_simples.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração da cadeia de segurança real (SecurityConfig +
 * JwtFilter) — sem mockar nada da autenticação, ao contrário dos
 * testes unitários de service/controller.
 *
 * @Transactional garante que cada teste roda em uma transação própria,
 * desfeita ao final: os usuários criados aqui não vazam entre testes.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void endpointProtegidoSemTokenERejeitado() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/usuarios/perfil")).andReturn();

        assertThat(result.getResponse().getStatus()).isIn(401, 403);
    }

    @Test
    void endpointProtegidoComTokenInvalidoERejeitado() throws Exception {
        MvcResult result = mockMvc.perform(
                        get("/api/usuarios/perfil").header("Authorization", "Bearer token.invalido.aqui"))
                .andReturn();

        assertThat(result.getResponse().getStatus()).isIn(401, 403);
    }

    @Test
    void loginPublicoFuncionaSemAutenticacaoERetornaToken() throws Exception {
        String email = "integracao.login@teste.local";
        cadastrarUsuario(email, "Usuário Integração", "senha123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoLogin(email, "senha123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void endpointProtegidoComTokenValidoPermiteAcesso() throws Exception {
        String email = "integracao.perfil@teste.local";
        cadastrarUsuario(email, "Usuário Dois", "senha123");
        String token = autenticar(email, "senha123");

        mockMvc.perform(get("/api/usuarios/perfil").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    /**
     * @DirtiesContext derruba o contexto Spring (e, com ele, o
     * LoginRateLimiter singleton) depois deste teste, para que as
     * tentativas consumidas aqui nunca vazem para outro teste — o
     * limiter é compartilhado por todos os testes que reusam este
     * mesmo contexto, então "sujar" e reconstruir é o jeito seguro de
     * testar bloqueio real sem contaminar os demais cenários.
     */
    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.AFTER_METHOD)
    void loginBloqueiaAposExcederLimiteDeTentativasPorEmail() throws Exception {
        String email = "rate.limit@teste.local";
        cadastrarUsuario(email, "Usuário Rate Limit", "senha-correta");

        // Consome o orçamento de tentativas do e-mail (padrão: 5 por janela) com senha errada.
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(corpoLogin(email, "senha-errada")))
                    .andExpect(status().isUnauthorized());
        }

        // 6ª tentativa: mesmo com a senha CORRETA, o limite já foi atingido.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoLogin(email, "senha-correta")))
                .andExpect(status().is(429));
    }

    private void cadastrarUsuario(String email, String nome, String senha) throws Exception {
        mockMvc.perform(post("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome": "%s", "email": "%s", "senha": "%s"}
                                """.formatted(nome, email, senha)))
                .andExpect(status().isOk());
    }

    private String autenticar(String email, String senha) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoLogin(email, senha)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token")
                .asText();
    }

    private String corpoLogin(String email, String senha) {
        return """
                {"email": "%s", "senha": "%s"}
                """.formatted(email, senha);
    }
}
