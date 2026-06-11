package com.analyzer.dto;

import java.util.Map;

public record LanguageBreakdownDTO(
        Map<String, Double> languages,
        Map<String, Long> bytes,
        long totalBytes
) {
}
