package com.melodyvault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * MelodyVault Backend Application
 * Java 25 & Spring Boot 3.4.2 REST API Server
 *
 * Provides genuine backend services:
 * - Public Music Catalogue Service (Authorized tracks)
 * - Playlist Management Service (CRUD operations)
 * - Listening Statistics & History Service
 * - Centralized Anti-Farming XP & Level Engine
 * - User Profile & Achievement Service
 */
@SpringBootApplication
public class MelodyVaultApplication {

    public static void main(String[] args) {
        SpringApplication.run(MelodyVaultApplication.class, args);
    }
}

