package com.kaique.crm_simples.dto;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * Garante, de forma estrutural (não só por comportamento), que os DTOs
 * de entrada nunca ganhem de volta um campo capaz de deixar o cliente
 * da API definir ou trocar o dono do recurso (usuario) ou o próprio
 * identificador (id). Quem define isso é sempre o service, a partir do
 * usuário autenticado — nunca o corpo da requisição.
 *
 * Se algum dia alguém adicionar "usuario" ou "id" a um desses DTOs por
 * engano, este teste quebra imediatamente, antes de virar uma falha de
 * segurança em produção.
 */
class DtoSegurancaTest {

    @Test
    void clienteRequestNaoExpoeUsuarioOuId() {
        assertNaoTemCampo(ClienteRequest.class, "usuario");
        assertNaoTemCampo(ClienteRequest.class, "id");
    }

    @Test
    void agendamentoRequestNaoExpoeUsuarioOuId() {
        assertNaoTemCampo(AgendamentoRequest.class, "usuario");
        assertNaoTemCampo(AgendamentoRequest.class, "id");
    }

    @Test
    void clienteResponseNaoExpoeUsuario() {
        assertNaoTemCampo(ClienteResponse.class, "usuario");
    }

    @Test
    void agendamentoResponseNaoExpoeUsuario() {
        assertNaoTemCampo(AgendamentoResponse.class, "usuario");
    }

    @Test
    void usuarioResponseNuncaExpoeSenha() {
        assertNaoTemCampo(UsuarioResponse.class, "senha");
    }

    private void assertNaoTemCampo(Class<?> dto, String nomeCampo) {
        boolean existe = Arrays.stream(dto.getDeclaredFields())
                .map(Field::getName)
                .anyMatch(nomeCampo::equals);
        assertFalse(existe, dto.getSimpleName() + " não deveria ter o campo '" + nomeCampo + "'");
    }
}
