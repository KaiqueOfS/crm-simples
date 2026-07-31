-- =========================================================================
-- V6__create_configuracoes_usuario.sql
--
-- Estrutura inicial da configuração de negócio do usuário (Sprint 14).
-- Guarda como o usuário atende seus clientes, para futuramente adaptar
-- Clientes/Agenda/Meu Dia (mostrar/ocultar endereço, organizar agenda
-- por local de atendimento, etc.) — nenhuma dessas regras é implementada
-- ainda, só a estrutura.
--
-- Relação 1:1 com usuarios (um usuário tem no máximo uma configuração).
-- segmento_negocio e endereco_estabelecimento ficam reservados para uma
-- fase futura: a tela de onboarding desta sprint não os preenche, por
-- isso são NULL-áveis.
-- =========================================================================

CREATE TABLE configuracoes_usuario (
    id                        BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id                BIGINT NOT NULL,
    tipo_atendimento          VARCHAR(255) NOT NULL,
    segmento_negocio          VARCHAR(255),
    endereco_estabelecimento  VARCHAR(255),
    created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_configuracoes_usuario_usuario UNIQUE (usuario_id),
    CONSTRAINT fk_configuracoes_usuario_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);
