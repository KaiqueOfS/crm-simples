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
 * Todas as rotas de API vivem sob /api/**. Tudo que não é /api/** é
 * o front-end React (arquivos estáticos ou rotas do React Router que
 * caem no fallback do SpaFallbackController) e fica liberado, porque
 * o próprio HTML da tela precisa carregar sem token — quem exige
 * token são as chamadas fetch() para /api/**, feitas pelo JavaScript
 * com o header Authorization.
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
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())

                // Define que a aplicação não guarda sessão no servidor.
                // Cada requisição precisa enviar o token JWT.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth

                        // Rotas públicas de autenticação
                        .requestMatchers("/api/auth/**").permitAll()

                        // Apenas o cadastro de usuário é público
                        .requestMatchers(HttpMethod.POST, "/api/usuarios").permitAll()

                        // Qualquer outra rota de API exige token
                        .requestMatchers("/api/**").authenticated()

                        // Tudo que não é /api/** é o front-end (HTML/JS/CSS
                        // servidos como estático, ou rota do React Router
                        // que cai no fallback do SpaFallbackController)
                        .anyRequest().permitAll())

                // Registra o filtro JWT antes do filtro padrão do Spring Security
                // Isso garante que o token seja validado em toda requisição
                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}