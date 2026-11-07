package com.melodyvault.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CorsConfigTest {

    @Test
    @DisplayName("CORS Configuration: Default allowed origins include localhost:3000, 3001 and 127.0.0.1:3000, 3001 without wildcards")
    void testDefaultAllowedOrigins() {
        CorsConfig corsConfig = new CorsConfig(null);
        String[] origins = corsConfig.getAllowedOrigins();
        assertNotNull(origins);

        List<String> originList = Arrays.asList(origins);
        assertTrue(originList.contains("http://localhost:3000"));
        assertTrue(originList.contains("http://127.0.0.1:3000"));
        assertTrue(originList.contains("http://localhost:3001"));
        assertTrue(originList.contains("http://127.0.0.1:3001"));

        // No wildcard origins
        assertFalse(originList.contains("*"));
        assertFalse(originList.stream().anyMatch(o -> o.contains("*")));
    }

    @Test
    @DisplayName("CORS Configuration: Custom origins are correctly parsed from property")
    void testCustomAllowedOrigins() {
        CorsConfig corsConfig = new CorsConfig("http://localhost:3001, https://melodyvault.com");
        String[] origins = corsConfig.getAllowedOrigins();
        assertEquals(2, origins.length);
        assertEquals("http://localhost:3001", origins[0]);
        assertEquals("https://melodyvault.com", origins[1]);
    }
}

