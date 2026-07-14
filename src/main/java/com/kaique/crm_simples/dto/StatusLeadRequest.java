package com.kaique.crm_simples.dto;

import com.kaique.crm_simples.model.StatusLead;

public class StatusLeadRequest {

    private StatusLead status;

    public StatusLead getStatus() {
        return status;
    }

    public void setStatus(StatusLead status) {
        this.status = status;
    }
}