package com.kaique.crm_simples.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Faz o Spring Boot devolver o index.html (o app React) para qualquer
 * rota que não seja de API e que não bata com um arquivo estático real.
 *
 * Como o React Router controla a navegação no navegador, rotas como
 * /clientes ou /auth não existem de fato no servidor — só existem no
 * JavaScript. Quando o navegador pede uma dessas rotas direto (F5,
 * digitar a URL, compartilhar o link), o Spring não acha handler nem
 * arquivo, cai em 404, e esse controller intercepta o 404 e devolve o
 * index.html no lugar — o React assume a partir daí e mostra a tela
 * certa.
 *
 * Rotas de API (/api/**) não são afetadas: se a rota não existir de
 * verdade, o 404 é devolvido normalmente, sem forward.
 */
@Controller
public class SpaFallbackController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request) {
        Object uri = request.getAttribute("jakarta.servlet.error.request_uri");
        String path = uri != null ? uri.toString() : "";

        if (!path.startsWith("/api")) {
            return "forward:/index.html";
        }

        // Rota de API que realmente não existe — deixa o Spring
        // tratar como erro normal (404 JSON, por exemplo).
        return "error";
    }
}