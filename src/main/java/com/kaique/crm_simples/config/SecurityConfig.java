package com.kaique.crm_simples.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuração de segurança da aplicação.
 *
 * Define quais rotas são públicas e quais exigem autenticação.
 * Também desativa a sessão HTTP (usamos JWT no lugar)
 * e registra o filtro que valida o token a cada requisição.
 */
@Configuration
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                // Desativa CSRF — não precisamos porque usamos JWT,
                // não cookies de sessão
                .csrf(csrf -> csrf.disable())

                // Define que a aplicação não guarda sessão no servidor.
                // Cada requisição precisa enviar o token JWT.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth

                        // Rotas públicas — não precisam de token
                        .requestMatchers("/auth/**").permitAll()

                        // Apenas o cadastro de usuário é público
                        // GET /usuarios foi removido por segurança
                        .requestMatchers(HttpMethod.POST, "/usuarios").permitAll()

                        // Arquivos estáticos do front-end
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/*.html",
                                "/*.css",
                                "/*.js"
                        ).permitAll()

                        // Todas as outras rotas exigem autenticação
                        .anyRequest().authenticated())

                // Registra o filtro JWT antes do filtro padrão do Spring Security
                // Isso garante que o token seja validado em toda requisição
                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}