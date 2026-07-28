package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.StatusLead;
import jakarta.validation.constraints.NotNull;

public class StatusLeadRequest {

    @NotNull(message = "Status é obrigatório")
    private StatusLead status;

    public StatusLead getStatus() {
        return status;
    }

    public void setStatus(StatusLead status) {
        this.status = status;
    }
}
