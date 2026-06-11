package com.analyzer.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record RepoDTO(
        String name,
        @JsonProperty("full_name") String fullName,
        String description,
        @JsonProperty("html_url") String htmlUrl,
        boolean fork,
        String language,
        @JsonProperty("stargazers_count") int stargazersCount,
        @JsonProperty("forks_count") int forksCount,
        @JsonProperty("watchers_count") int watchersCount,
        @JsonProperty("open_issues_count") int openIssuesCount,
        int size,
        @JsonProperty("pushed_at") String pushedAt,
        @JsonProperty("created_at") String createdAt,
        @JsonProperty("updated_at") String updatedAt,
        License license,
        List<String> topics
) {
    public record License(
            String key,
            String name,
            @JsonProperty("spdx_id") String spdxId
    ) {
    }
}
