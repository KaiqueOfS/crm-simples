package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.DashboardResponse;
import com.kaique.crm_simples.model.StatusLead;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.ClienteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por gerar os indicadores do dashboard.
 *
 * Usa queries COUNT direto no banco em vez de carregar
 * todos os clientes em memória — muito mais eficiente
 * quando o usuário tem muitos clientes.
 */
@Service
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

    private final ClienteRepository clienteRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    public DashboardService(
            ClienteRepository clienteRepository,
            UsuarioAutenticadoService usuarioAutenticadoService) {
        this.clienteRepository = clienteRepository;
        this.usuarioAutenticadoService = usuarioAutenticadoService;
    }

    /**
     * Gera os indicadores do dashboard do usuário autenticado.
     *
     * Cada contador é uma query COUNT independente no banco,
     * o que é muito mais eficiente do que buscar todos os
     * clientes e filtrar em memória com streams.
     *
     * @return estatísticas do funil de vendas.
     */
    public DashboardResponse gerarDashboard() {
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();

        log.debug("Gerando dashboard para usuário: {}", usuario.getEmail());

        DashboardResponse dashboard = new DashboardResponse();

        // Cada linha é uma query COUNT no banco — sem trazer dados desnecessários
        dashboard.setTotalClientes(clienteRepository.countByUsuario(usuario));
        dashboard.setNovos(       clienteRepository.contarPorStatus(usuario, StatusLead.NOVO));
        dashboard.setContatados(  clienteRepository.contarPorStatus(usuario, StatusLead.CONTATADO));
        dashboard.setNegociacao(  clienteRepository.contarPorStatus(usuario, StatusLead.NEGOCIACAO));
        dashboard.setProposta(    clienteRepository.contarPorStatus(usuario, StatusLead.PROPOSTA));
        dashboard.setGanhos(      clienteRepository.contarPorStatus(usuario, StatusLead.GANHO));
        dashboard.setPerdidos(    clienteRepository.contarPorStatus(usuario, StatusLead.PERDIDO));

        return dashboard;
    }
}