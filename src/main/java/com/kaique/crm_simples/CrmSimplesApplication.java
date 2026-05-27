package com.kaique.crm_simples;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CrmSimplesApplication {

	public static void main(String[] args) {
		// Carrega as variáveis do arquivo .env antes de iniciar o Spring
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
		dotenv.entries().forEach(entry ->
				System.setProperty(entry.getKey(), entry.getValue())
		);

		SpringApplication.run(CrmSimplesApplication.class, args);
	}
}