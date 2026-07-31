package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.enums.TipoAtendimento;
import jakarta.validation.constraints.NotNull;

/**
 * Dados de entrada para salvar a configuração inicial do usuário (Sprint 14).
 *
 * segmentoNegocio e enderecoEstabelecimento ficam reservados para uma fase
 * futura — não fazem parte deste contrato ainda.
 */
public class ConfiguracaoUsuarioRequest {

    @NotNull(message = "Tipo de atendimento é obrigatório")
    private TipoAtendimento tipoAtendimento;

    public TipoAtendimento getTipoAtendimento() { return tipoAtendimento; }
    public void setTipoAtendimento(TipoAtendimento tipoAtendimento) { this.tipoAtendimento = tipoAtendimento; }
}
