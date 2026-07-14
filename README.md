# Orbis CRM

Sistema de gestão de clientes desenvolvido para pequenos negócios como barbearias, salões, oficinas e comércios em geral.

Permite cadastrar clientes, acompanhar o andamento de cada negociação dentro de um funil de vendas e visualizar indicadores em tempo real no dashboard.

---

## Funcionalidades

- Cadastro, edição e exclusão de clientes
- Funil de vendas com 6 etapas: Novo → Contatado → Negociação → Proposta → Ganho → Perdido
- Dashboard com contagem de clientes por etapa
- Autenticação segura com JWT
- Cada usuário acessa apenas os seus próprios clientes (multitenancy)
- Interface com modo claro e modo escuro
- Senhas criptografadas com BCrypt

---

## Tecnologias

**Backend**
- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- JWT (JSON Web Token)
- BCrypt
- MySQL
- Maven

**Frontend**
- HTML, CSS e JavaScript puro (sem framework)
- Hospedado pelo próprio Spring Boot como arquivo estático

---

## Como rodar localmente

### Pré-requisitos
- Java 21
- MySQL rodando localmente
- Maven

### Configuração

1. Clone o repositório:
```bash
git clone https://github.com/KaiqueOfS/crm-simples.git
```

2. Crie um banco de dados MySQL:
```sql
CREATE DATABASE crm_simples;
```

3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
JWT_SECRET=sua_chave_secreta_com_no_minimo_32_caracteres
```

4. Configure o `application.properties` com suas credenciais do MySQL:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/crm_simples
spring.datasource.username=seu_usuario
spring.datasource.password=sua_senha
```

5. Rode a aplicação pelo IntelliJ ou via terminal:
```bash
./mvnw spring-boot:run
```

6. Acesse no navegador:
```
http://localhost:8080
```

---

## Endpoints principais

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/usuarios` | Cadastra um novo usuário | Não |
| POST | `/auth/login` | Realiza login e retorna o token JWT | Não |
| GET | `/clientes` | Lista os clientes do usuário autenticado | Sim |
| POST | `/clientes` | Cadastra um novo cliente | Sim |
| PUT | `/clientes/{id}` | Atualiza os dados de um cliente | Sim |
| PUT | `/clientes/{id}/status` | Atualiza o status do cliente no funil | Sim |
| DELETE | `/clientes/{id}` | Remove um cliente | Sim |
| GET | `/dashboard` | Retorna os indicadores do funil de vendas | Sim |

---

## Estrutura do projeto

```
src/main/java/com/kaique/crm_simples/
├── config/         # JWT, filtros e configuração de segurança
├── controller/     # Endpoints da API
├── dto/            # Objetos de transferência de dados
├── exception/      # Exceções customizadas e handler global
├── model/          # Entidades do banco de dados
├── repository/     # Interfaces de acesso ao banco
└── service/        # Regras de negócio
```

---

## Autor

Kaique Oliveira — [GitHub](https://github.com/KaiqueOfS) • [LinkedIn](https://linkedin.com/in/kaique-oliveira)
