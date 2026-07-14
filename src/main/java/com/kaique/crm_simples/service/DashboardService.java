package com.kaique.crm_simples.service;

import com.kaique.crm_simples.dto.DashboardResponse;
import com.kaique.crm_simples.model.Cliente;
import com.kaique.crm_simples.model.StatusLead;
import com.kaique.crm_simples.model.Usuario;
import com.kaique.crm_simples.repository.ClienteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Serviço responsável por gerar os indicadores exibidos
 * no dashboard do CRM.
 */
@Service
public class DashboardService {

    // Repositório responsável pelas consultas de clientes
    private final ClienteRepository clienteRepository;

    // Serviço responsável por identificar o usuário autenticado
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    /**
     * Injeta as dependências necessárias para o serviço.
     */
    public DashboardService(
            ClienteRepository clienteRepository,
            UsuarioAutenticadoService usuarioAutenticadoService) {

        this.clienteRepository = clienteRepository;
        this.usuarioAutenticadoService = usuarioAutenticadoService;
    }

    /**
     * Gera os indicadores do dashboard do usuário autenticado.
     *
     * @return estatísticas do funil de vendas.
     */
    public DashboardResponse gerarDashboard() {

        // Obtém o usuário autenticado
        Usuario usuario = usuarioAutenticadoService.obterUsuarioLogado();

        // Busca apenas os clientes pertencentes ao usuário logado
        List<Cliente> clientes = clienteRepository.findByUsuario(usuario);

        DashboardResponse dashboard = new DashboardResponse();

        // Quantidade total de clientes cadastrados
        dashboard.setTotalClientes(clientes.size());

        // Quantidade de clientes em cada etapa do funil
        dashboard.setNovos(
                clientes.stream()
                        .filter(cliente -> cliente.getStatus() == StatusLead.NOVO)
                        .count());

        dashboard.setContatados(
                clientes.stream()
                        .filter(cliente -> cliente.getStatus() == StatusLead.CONTATADO)
                        .count());

        dashboard.setNegociacao(
                clientes.stream()
                        .filter(cliente -> cliente.getStatus() == StatusLead.NEGOCIACAO)
                        .count());

        dashboard.setProposta(
                clientes.stream()
                        .filter(cliente -> cliente.getStatus() == StatusLead.PROPOSTA)
                        .count());

        dashboard.setGanhos(
                clientes.stream()
                        .filter(cliente -> cliente.getStatus() == StatusLead.GANHO)
                        .count());

        dashboard.setPerdidos(
                clientes.stream()
                        .filter(cliente -> cliente.getStatus() == StatusLead.PERDIDO)
                        .count());

        return dashboard;
    }
}