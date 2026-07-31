# =========================================================================
# Dockerfile — Orbis CRM (Sprint 16.2.1)
#
# Respeita a arquitetura já existente do projeto: o frontend (React/Vite)
# é buildado e cai DENTRO do backend (src/main/resources/static — ver
# frontend/vite.config.ts, "outDir"), e o Spring Boot serve os dois
# (API + SPA) de um único jar, na mesma origem. Não há dois deploys
# separados aqui, só um: este Dockerfile só reproduz em container o mesmo
# processo (npm run build → mvn package) que já roda localmente.
#
# IMPORTANTE (ver auditoria da Sprint 16.2): o frontend só deve ser
# buildado aqui SEM VITE_API_BASE_URL definido, para que a API seja
# chamada em runtime pela mesma origem (comportamento padrão de
# frontend/lib/api.ts em produção). Não copie um frontend/.env com
# VITE_API_BASE_URL apontando para localhost para dentro desta imagem.
# =========================================================================

# ---- Estágio 1: build do frontend -------------------------------------
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# Sem VITE_API_BASE_URL de propósito — produção usa mesma origem.
RUN npm run build
# Resultado cai em /app/src/main/resources/static (relativo ao WORKDIR
# acima), por causa do outDir configurado em vite.config.ts.

# ---- Estágio 2: build do backend (jar) ---------------------------------
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app

COPY pom.xml ./
COPY src ./src

# Traz os assets do frontend já compilados para dentro do static do
# Spring Boot — o mesmo lugar onde o build local do Vite já os coloca.
COPY --from=frontend-build /app/src/main/resources/static ./src/main/resources/static

RUN mvn -B -q -DskipTests package

# ---- Estágio 3: runtime -------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

COPY --from=backend-build /app/target/crm-simples-*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
