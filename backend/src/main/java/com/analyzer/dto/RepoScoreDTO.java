package com.analyzer.dto;

import java.util.Map;

public record RepoScoreDTO(
        String name,
        String description,
        String htmlUrl,
        String language,
        int stars,
        int forks,
        double overallScore,
        Map<String, Double> breakdown,
        String grade
) {
}
