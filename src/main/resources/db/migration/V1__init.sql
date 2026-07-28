-- =========================================================================
-- V1__init.sql
--
-- Estrutura inicial do banco de dados do Orbis CRM.
--
-- Este script CONGELA o schema que o Hibernate já vinha gerando
-- automaticamente em produção via spring.jpa.hibernate.ddl-auto=update,
-- a partir das entidades JPA existentes (Usuario, Cliente, Agendamento).
--
-- Regra seguida ao escrever este arquivo: nenhuma constraint, índice,
-- tabela ou coluna foi inventado ou "corrigido" aqui. O que está abaixo é
-- exatamente o que as entidades produziam, incluindo nullability — as
-- anotações Bean Validation (@NotBlank, @NotNull, @Size) das entidades
-- validam a entrada na camada de API, mas nunca foram traduzidas em
-- constraint de banco (nenhuma entidade usa @Column(nullable = false)).
-- Isso é uma lacuna real do schema atual, não um erro de transcrição —
-- documentada em docs/FLYWAY.md e no relatório de débitos técnicos.
--
-- Compatível com MySQL (produção) e H2 (testes).
-- =========================================================================

-- Usuario: cada usuário do sistema (dono dos próprios clientes/agendamentos).
CREATE TABLE usuarios (
    id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome  VARCHAR(255),
    email VARCHAR(255),
    senha VARCHAR(255),
    CONSTRAINT uk_usuarios_email UNIQUE (email)
);

-- Cliente: registro do funil de vendas, sempre vinculado a um usuário.
CREATE TABLE clientes (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(255),
    telefone    VARCHAR(255),
    email       VARCHAR(255),
    observacoes VARCHAR(255),
    status      VARCHAR(255),
    usuario_id  BIGINT,
    CONSTRAINT fk_clientes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

-- Agendamento: compromisso de agenda, sempre vinculado a um usuário.
CREATE TABLE agendamentos (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    titulo     VARCHAR(255),
    pessoa     VARCHAR(255),
    data       DATE,
    hora       TIME,
    categoria  VARCHAR(255),
    lembrete   INTEGER,
    usuario_id BIGINT,
    CONSTRAINT fk_agendamentos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);
