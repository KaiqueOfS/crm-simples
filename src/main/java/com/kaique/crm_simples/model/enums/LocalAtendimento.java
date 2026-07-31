package com.kaique.crm_simples.model.enums;

/**
 * Onde um compromisso específico acontece (Sprint 15.1).
 *
 * Não reutiliza {@link TipoAtendimento}: aquele representa a capacidade/
 * configuração da conta (o que o profissional oferece), este representa o
 * local de UM agendamento específico. Um usuário AMBOS tem compromissos que
 * são ou ESTABELECIMENTO ou EXTERNO, nunca "ambos" ao mesmo tempo.
 */
public enum LocalAtendimento {
    ESTABELECIMENTO,
    EXTERNO
}
