# Orbis CRM

CRM simples para pequenos negócios acompanharem clientes, oportunidades e agendamentos. Cada conta possui seus próprios dados e os acessa por meio de autenticação JWT.

## Funcionalidades atuais

- Cadastro e autenticação de usuários
- Gestão do perfil da conta
- Cadastro, edição e exclusão de clientes
- Funil de vendas: `NOVO`, `CONTATADO`, `NEGOCIACAO`, `PROPOSTA`, `GANHO` e `PERDIDO`
- Dashboard com indicadores do funil
- Agendamentos por dia ou período
- Isolamento de dados por usuário
- Validação dos dados recebidos pela API e tratamento centralizado de erros

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Backend | Java 21, Spring Boot, Spring Security, Spring Data JPA, JWT, BCrypt e Maven |
| Banco de dados | MySQL em produção e H2 em memória nos testes, com schema versionado via Flyway |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI e React Router |

## Estrutura do projeto

```text
crm-simples/
├── frontend/                         # Aplicação React/TypeScript
│   ├── src/
│   │   ├── components/ui/             # Componentes visuais reutilizáveis
│   │   ├── lib/                       # Cliente HTTP e utilitários
│   │   ├── pages/                     # Telas e fluxos da aplicação
│   │   ├── App.tsx                    # Rotas e proteção de telas autenticadas
│   │   └── main.tsx                   # Ponto de entrada do React
│   └── vite.config.ts                 # Build para os arquivos estáticos do Spring
├── src/main/java/com/kaique/crm_simples/
│   ├── config/                        # Segurança, JWT, CORS e suporte à SPA
│   ├── controller/                    # Contratos HTTP da API
│   ├── dto/                           # Objetos de entrada e saída da API
│   ├── exception/                     # Exceções e respostas de erro
│   ├── model/                         # Entidades JPA e enums do domínio
│   ├── repository/                    # Consultas ao banco de dados
│   └── service/                       # Regras de negócio
├── src/main/resources/
│   ├── application.properties         # Configuração da aplicação
│   ├── db/migration/                  # Migrations do Flyway (schema versionado)
│   └── static/                        # Build do frontend servido pelo Spring
├── src/test/                          # Testes e configuração do banco H2
└── docs/                              # Documentação técnica
```

Consulte [a documentação de arquitetura](docs/ARQUITETURA.md) para os limites de cada camada e o fluxo entre frontend, API e banco de dados.

## Como executar localmente

### Pré-requisitos

- Java 21
- Node.js 20 ou superior
- MySQL 8 ou superior

### 1. Configure o banco e as variáveis locais

Crie o banco:

```sql
CREATE DATABASE crm_simples;
```

Crie um arquivo `.env` na raiz do projeto. Ele não deve ser versionado:

```env
DB_PASSWORD=sua_senha_do_mysql
JWT_SECRET=uma_chave_secreta_com_pelo_menos_32_caracteres
# Opcional em desenvolvimento; em produção, use o domínio do frontend.
ALLOWED_ORIGINS=http://localhost:5173
```

O usuário do MySQL é configurado em `src/main/resources/application.properties` e, por padrão, é `root`.

### 2. Execute o backend

```bash
./mvnw spring-boot:run
```

A API estará disponível em `http://localhost:8080`.

### 3. Execute o frontend em desenvolvimento

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. Em desenvolvimento, o frontend chama a API em `http://localhost:8080`; esse endereço pode ser alterado com `VITE_API_BASE_URL`.

### Build integrado para produção

Para servir o frontend pelo próprio Spring Boot:

```bash
cd frontend
npm run build
```

O build é gerado em `src/main/resources/static`. Depois, inicie o backend e acesse `http://localhost:8080`.

## Endpoints principais

Todas as rotas abaixo começam com `/api`. As rotas marcadas como **Sim** exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Descrição | Autenticação |
| --- | --- | --- | --- |
| POST | `/usuarios` | Cria uma conta | Não |
| GET | `/usuarios/perfil` | Retorna o perfil do usuário | Sim |
| PUT | `/usuarios/perfil` | Atualiza nome e/ou senha | Sim |
| POST | `/auth/login` | Autentica e retorna o JWT | Não |
| GET | `/clientes` | Lista clientes paginados; aceita `pagina`, `tamanho`, `termo` e `status` | Sim |
| GET | `/clientes/{id}` | Busca um cliente | Sim |
| POST | `/clientes` | Cria um cliente | Sim |
| PUT | `/clientes/{id}` | Atualiza os dados cadastrais | Sim |
| PUT | `/clientes/{id}/status` | Altera a etapa do funil | Sim |
| DELETE | `/clientes/{id}` | Remove um cliente | Sim |
| GET | `/dashboard` | Retorna os indicadores do funil | Sim |
| GET | `/agendamentos` | Lista agendamentos; aceita `data`, `inicio` e `fim` | Sim |
| POST | `/agendamentos` | Cria um agendamento | Sim |
| PUT | `/agendamentos/{id}` | Atualiza um agendamento | Sim |
| DELETE | `/agendamentos/{id}` | Remove um agendamento | Sim |

## Banco de dados e migrations

O schema do banco é versionado com [Flyway](https://flywaydb.org/) — o Hibernate **nunca** cria ou altera tabelas (`spring.jpa.hibernate.ddl-auto=validate` em todos os ambientes, produção e teste). Ele só confere se as entidades JPA batem com o schema que o Flyway já aplicou; se não baterem, a aplicação falha ao subir em vez de alterar o banco silenciosamente.

- **Onde ficam as migrations:** `src/main/resources/db/migration/`, arquivos `V{numero}__{descricao}.sql` (ex.: `V1__init.sql`). O Flyway aplica em ordem crescente de versão, uma única vez cada, e registra o histórico na tabela `flyway_schema_history`.
- **Como criar uma nova migration:** nunca edite um arquivo `V*.sql` já aplicado (em produção ou já commitado). Crie um novo arquivo com o próximo número — ex. `V2__adiciona_campo_x.sql` — com o `ALTER TABLE`/`CREATE TABLE` necessário. Ele será aplicado automaticamente na próxima inicialização da aplicação, em qualquer ambiente (produção, dev, CI).
- **Regra permanente:** `ddl-auto=update` (ou `create`/`create-drop` fora de teste) nunca deve voltar a ser usado em produção. Toda mudança de schema entra por uma migration nova, revisável e reproduzível. Detalhes de por que isso importa e como o fluxo de inicialização funciona: [`docs/FLYWAY.md`](docs/FLYWAY.md).

## Qualidade

```bash
# Backend: executa os testes usando H2 em memória
./mvnw test

# Frontend: valida tipos e gera a versão de produção
cd frontend
npm run build
npm exec tsc -- --noEmit
```

## Próximos passos sugeridos

- Tela de dashboard e de agenda no frontend, pois as APIs já existem
- Histórico de interações por cliente
- Papéis e permissões para ações administrativas, como exclusões
- Testes de API para complementar os testes de regras de negócio

## Autor

Kaique Oliveira — [GitHub](https://github.com/KaiqueOfS) · [LinkedIn](https://linkedin.com/in/kaique-oliveira)
