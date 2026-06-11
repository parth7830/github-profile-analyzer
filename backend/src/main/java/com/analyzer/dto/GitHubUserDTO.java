package com.analyzer.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GitHubUserDTO(
        String login,
        String name,
        @JsonProperty("avatar_url") String avatarUrl,
        String bio,
        String company,
        String location,
        String email,
        String blog,
        @JsonProperty("html_url") String htmlUrl,
        @JsonProperty("twitter_username") String twitterUsername,
        @JsonProperty("public_repos") int publicRepos,
        @JsonProperty("public_gists") int publicGists,
        int followers,
        int following,
        @JsonProperty("created_at") String createdAt,
        @JsonProperty("updated_at") String updatedAt
) {
}
