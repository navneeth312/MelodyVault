package com.melodyvault.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

/**
 * Global Cross-Origin Resource Sharing (CORS) Configuration
 * Only explicitly configured frontend origins are allowed (no wildcards).
 * Allows credentials and HttpOnly cookie authentication for ports 3000, 3001, and 5173.
 */
@Configuration
public class CorsConfig {

    private final String[] allowedOrigins;

    public CorsConfig(@Value("${melodyvault.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173}") String allowedOriginsStr) {
        if (allowedOriginsStr != null && !allowedOriginsStr.isBlank()) {
            this.allowedOrigins = Arrays.stream(allowedOriginsStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toArray(String[]::new);
        } else {
            this.allowedOrigins = new String[]{
                    "http://localhost:3000", "http://127.0.0.1:3000",
                    "http://localhost:3001", "http://127.0.0.1:3001"
            };
        }
    }

    public String[] getAllowedOrigins() {
        return allowedOrigins;
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(allowedOrigins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD")
                        .allowedHeaders("*")
                        .exposedHeaders("Authorization", "Content-Disposition", "Set-Cookie")
                        .allowCredentials(true)
                        .maxAge(3600);

                // Static audio streams CORS (read-only)
                registry.addMapping("/audio/**")
                        .allowedOrigins(allowedOrigins)
                        .allowedMethods("GET", "HEAD", "OPTIONS")
                        .maxAge(3600);
            }
        };
    }
}
