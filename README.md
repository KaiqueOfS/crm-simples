<div align="center">

# 📋 CRM Simples

**Sistema de cadastro de clientes com autenticação JWT para pequenos comércios**

![Java](https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring_Security-JWT-6DB33F?style=flat-square&logo=springsecurity&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Status](https://img.shields.io/badge/status-em_desenvolvimento-yellow?style=flat-square)
![Versão](https://img.shields.io/badge/versão-3.0-blue?style=flat-square)

Barbearias, salões, oficinas — todo comércio tem clientes e quase ninguém os controla direito.
O CRM Simples resolve isso com autenticação segura, isolamento de dados por usuário e uma interface limpa.

[Funcionalidades](#-funcionalidades) • [Tecnologias](#-tecnologias) • [Como rodar](#-como-rodar) • [Endpoints](#-endpoints-da-api) • [Estrutura](#-estrutura-do-projeto) • [Roadmap](#-roadmap)

</div>

---

## ✨ Funcionalidades

- ✅ Cadastro e login de usuários com senha criptografada (BCrypt)
- ✅ Autenticação via JWT — token gerado no login, validado em cada requisição
- ✅ Cada usuário enxerga **apenas seus próprios clientes** (isolamento de dados)
- ✅ CRUD completo de clientes — criar, listar, buscar, editar e excluir
- ✅ Validação de dados no backend (`@NotBlank`, `@Valid`)
- ✅ Tratamento global de erros com respostas padronizadas em JSON
- ✅ Banco de dados MySQL com variáveis de ambiente via dotenv

---

## 🛠 Tecnologias

| Camada | Tecnologia |
|---|---|
| Linguagem | Java 21 |
| Framework | Spring Boot 3.5 |
| Segurança | Spring Security + JWT (jjwt 0.12.7) |
| Persistência | Spring Data JPA |
| Banco de dados | MySQL 8.0 |
| Validação | Bean Validation (jakarta.validation) |
| Variáveis de ambiente | dotenv-java 3.0 |
| Build | Maven (Maven Wrapper incluso) |
| Frontend | HTML, CSS e JavaScript puro |

---

## 🚀 Como rodar

### Pré-requisitos

- Java 21+
- MySQL rodando localmente

### 1. Clone o repositório

```bash
git clone https://github.com/KaiqueOfS/crm-simples.git
cd crm-simples
```

### 2. Configure o banco de dados

Crie o banco no MySQL:

```sql
CREATE DATABASE crm_simples;
```

### 3. Crie o arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
DB_PASSWORD=sua_senha_do_mysql
JWT_SECRET=sua_chave_secreta_com_minimo_32_caracteres
```

> O arquivo `.env` está no `.gitignore` e nunca deve ser commitado.

### 4. Rode a aplicação

```bash
# Via Maven Wrapper (sem precisar instalar o Maven)
./mvnw spring-boot:run

# No Windows
mvnw.cmd spring-boot:run
```

Acesse no navegador: [http://localhost:8080](http://localhost:8080)

### Via IntelliJ IDEA

1. Abra o projeto no IntelliJ
2. Aguarde a indexação das dependências Maven
3. Execute a classe `CrmSimplesApplication`
4. Acesse `http://localhost:8080`

---

## 🔐 Como funciona a autenticação

O sistema usa **JWT (JSON Web Token)** stateless:

1. O usuário se cadastra via `POST /usuarios`
2. Faz login via `POST /auth/login` e recebe um token JWT
3. Todas as requisições seguintes enviam o token no header:
   ```
   Authorization: Bearer <token>
   ```
4. O backend valida o token, identifica o usuário e filtra os dados automaticamente

---

## 📡 Endpoints da API

### Autenticação (público)

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/usuarios` | Cadastra um novo usuário |
| `POST` | `/auth/login` | Realiza login e retorna o JWT |

### Clientes (requer autenticação)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/clientes` | Lista todos os clientes do usuário logado |
| `GET` | `/clientes/{id}` | Busca um cliente por ID |
| `POST` | `/clientes` | Cadastra um novo cliente |
| `PUT` | `/clientes/{id}` | Atualiza os dados de um cliente |
| `DELETE` | `/clientes/{id}` | Remove um cliente |

---

## 📁 Estrutura do projeto

```
crm-simples/
├── src/
│   ├── main/
│   │   ├── java/com/kaique/crm_simples/
│   │   │   ├── config/
│   │   │   │   ├── JwtFilter.java         # Intercepta requisições e valida o token
│   │   │   │   ├── JwtService.java        # Gera e valida tokens JWT
│   │   │   │   ├── PasswordConfig.java    # Bean do BCryptPasswordEncoder
│   │   │   │   └── SecurityConfig.java    # Regras de acesso e filtros
│   │   │   ├── controller/
│   │   │   │   ├── AuthController.java    # Login
│   │   │   │   ├── ClienteController.java
│   │   │   │   └── UsuarioController.java
│   │   │   ├── dto/
│   │   │   │   ├── LoginRequest.java
│   │   │   │   ├── LoginResponse.java
│   │   │   │   └── TokenResponse.java
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java       # Tratamento centralizado de erros
│   │   │   │   ├── AcessoNegadoException.java
│   │   │   │   ├── ClienteNaoEncontradoException.java
│   │   │   │   ├── CredenciaisInvalidasException.java
│   │   │   │   └── UsuarioNaoEncontradoException.java
│   │   │   ├── model/
│   │   │   │   ├── Cliente.java
│   │   │   │   └── Usuario.java
│   │   │   ├── repository/
│   │   │   │   ├── ClienteRepository.java
│   │   │   │   └── UsuarioRepository.java
│   │   │   ├── service/
│   │   │   │   ├── ClienteService.java    # Regras de negócio + isolamento por usuário
│   │   │   │   └── UsuarioService.java
│   │   │   └── CrmSimplesApplication.java
│   │   └── resources/
│   │       ├── static/                    # Frontend (HTML, CSS, JS)
│   │       └── application.properties
│   └── test/
├── .env                   # Variáveis de ambiente (NÃO commitado)
├── .gitignore
├── pom.xml
└── README.md
```

---

## 🗺 Roadmap

```
v1.0  ✅  Cadastro, listagem e exclusão de clientes
v2.0  ✅  Edição de clientes + migração para MySQL + variáveis de ambiente
v2.1  ✅  Validações no backend com feedback visual
v3.0  ✅  Spring Security + JWT + isolamento de dados por usuário
v3.1  🔄  Deploy online
```

---

## 🌱 Sobre o projeto

Esse projeto nasceu de uma vontade de voltar a codar. Fiquei um tempo parado e senti falta — programar é algo que gosto de verdade, e nada melhor do que retomar com algo que tem utilidade real.
A ideia foi criar um sistema que qualquer pequeno comércio pudesse usar: barbearia, salão, oficina. O que começou como um CRUD simples evoluiu para uma API REST com autenticação JWT, isolamento de dados por usuário e arquitetura em camadas — mais do que eu esperava quando comecei.
O projeto segue em desenvolvimento ativo. Em breve terá deploy online, tornando-se um sistema completo e pronto para uso real por qualquer negócio.

---

## 👤 Autor

**Kaique Oliveira**

[![GitHub](https://img.shields.io/badge/GitHub-KaiqueOfS-181717?style=flat-square&logo=github)](https://github.com/KaiqueOfS)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.