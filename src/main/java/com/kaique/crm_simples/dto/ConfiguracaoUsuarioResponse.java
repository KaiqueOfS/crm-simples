package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.ConfiguracaoUsuario;
import com.kaique.crm_simples.model.enums.TipoAtendimento;

/**
 * Configuração de negócio do usuário exposta pela API.
 *
 * tipoAtendimento vem null quando o usuário ainda não concluiu a
 * configuração inicial (GET antes do primeiro POST).
 */
public record ConfiguracaoUsuarioResponse(
        Long id,
        TipoAtendimento tipoAtendimento,
        String segmentoNegocio,
        String enderecoEstabelecimento
) {

    public static ConfiguracaoUsuarioResponse de(ConfiguracaoUsuario configuracao) {
        return new ConfiguracaoUsuarioResponse(
                configuracao.getId(),
                configuracao.getTipoAtendimento(),
                configuracao.getSegmentoNegocio(),
                configuracao.getEnderecoEstabelecimento()
        );
    }

    public static ConfiguracaoUsuarioResponse vazia() {
        return new ConfiguracaoUsuarioResponse(null, null, null, null);
    }
}
