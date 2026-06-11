package com.analyzer.dto;

import java.util.List;

public record ContributionDTO(
        int totalContributions,
        List<DayContribution> contributions,
        String source
) {
    public record DayContribution(
            String date,
            int count,
            String color
    ) {
    }
}
