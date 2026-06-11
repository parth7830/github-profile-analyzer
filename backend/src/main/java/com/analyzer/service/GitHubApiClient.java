package com.analyzer.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class GitHubApiClient {

    private final WebClient webClient;
    private final String token;

    public GitHubApiClient(
            @Value("${github.api.base-url}") String baseUrl,
            @Value("${github.api.token:}") String token) {
        this.token = token;

        WebClient.Builder builder = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github.v3+json")
                .defaultHeader(HttpHeaders.USER_AGENT, "GitHub-Profile-Analyzer")
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(10 * 1024 * 1024));

        if (isTokenConfigured()) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        }

        this.webClient = builder.build();
    }

    public boolean isTokenConfigured() {
        return token != null && !token.isBlank();
    }

    /**
     * GET /users/{username} — returns raw JSON as Map.
     */
    public Map<String, Object> getUser(String username) {
        try {
            return webClient.get()
                    .uri("/users/{username}", username)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response -> {
                        if (response.statusCode().value() == 404) {
                            return Mono.error(new UserNotFoundException("User not found: " + username));
                        }
                        if (response.statusCode().value() == 403) {
                            return Mono.error(new RateLimitExceededException("GitHub API rate limit exceeded"));
                        }
                        return response.createException().flatMap(Mono::error);
                    })
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
        } catch (WebClientResponseException.NotFound e) {
            throw new UserNotFoundException("User not found: " + username);
        } catch (WebClientResponseException.Forbidden e) {
            throw new RateLimitExceededException("GitHub API rate limit exceeded");
        }
    }

    /**
     * GET /users/{username}/repos?per_page=100&sort=pushed — paginated up to 3 pages.
     */
    public List<Map<String, Object>> getRepos(String username) {
        List<Map<String, Object>> allRepos = new ArrayList<>();

        for (int page = 1; page <= 3; page++) {
            final int currentPage = page;
            try {
                List<Map<String, Object>> pageRepos = webClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/users/{username}/repos")
                                .queryParam("per_page", 100)
                                .queryParam("sort", "pushed")
                                .queryParam("page", currentPage)
                                .build(username))
                        .retrieve()
                        .onStatus(HttpStatusCode::is4xxClientError, response -> {
                            if (response.statusCode().value() == 404) {
                                return Mono.error(new UserNotFoundException("User not found: " + username));
                            }
                            if (response.statusCode().value() == 403) {
                                return Mono.error(new RateLimitExceededException("GitHub API rate limit exceeded"));
                            }
                            return response.createException().flatMap(Mono::error);
                        })
                        .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                        .block();

                if (pageRepos == null || pageRepos.isEmpty()) {
                    break;
                }
                allRepos.addAll(pageRepos);

                if (pageRepos.size() < 100) {
                    break;
                }
            } catch (WebClientResponseException.NotFound e) {
                throw new UserNotFoundException("User not found: " + username);
            } catch (WebClientResponseException.Forbidden e) {
                throw new RateLimitExceededException("GitHub API rate limit exceeded");
            }
        }

        return allRepos;
    }

    /**
     * GET /repos/{owner}/{repo}/languages — returns Map of language → bytes.
     */
    public Map<String, Long> getRepoLanguages(String owner, String repo) {
        try {
            Map<String, Object> raw = webClient.get()
                    .uri("/repos/{owner}/{repo}/languages", owner, repo)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response -> {
                        if (response.statusCode().value() == 403) {
                            return Mono.error(new RateLimitExceededException("GitHub API rate limit exceeded"));
                        }
                        return response.createException().flatMap(Mono::error);
                    })
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            if (raw == null) {
                return Collections.emptyMap();
            }

            // Convert Number values to Long
            Map<String, Long> result = new java.util.LinkedHashMap<>();
            for (Map.Entry<String, Object> entry : raw.entrySet()) {
                if (entry.getValue() instanceof Number num) {
                    result.put(entry.getKey(), num.longValue());
                }
            }
            return result;
        } catch (WebClientResponseException.NotFound e) {
            return Collections.emptyMap();
        } catch (WebClientResponseException.Forbidden e) {
            throw new RateLimitExceededException("GitHub API rate limit exceeded");
        }
    }

    /**
     * GET /users/{username}/events?per_page=100 — returns list of event Maps.
     */
    public List<Map<String, Object>> getEvents(String username) {
        try {
            List<Map<String, Object>> events = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/users/{username}/events")
                            .queryParam("per_page", 100)
                            .build(username))
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response -> {
                        if (response.statusCode().value() == 404) {
                            return Mono.error(new UserNotFoundException("User not found: " + username));
                        }
                        if (response.statusCode().value() == 403) {
                            return Mono.error(new RateLimitExceededException("GitHub API rate limit exceeded"));
                        }
                        return response.createException().flatMap(Mono::error);
                    })
                    .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                    .block();

            return events != null ? events : Collections.emptyList();
        } catch (WebClientResponseException.NotFound e) {
            return Collections.emptyList();
        } catch (WebClientResponseException.Forbidden e) {
            throw new RateLimitExceededException("GitHub API rate limit exceeded");
        }
    }

    /**
     * POST https://api.github.com/graphql — contribution calendar query.
     * Only works when a token is configured.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getContributionCalendar(String username) {
        if (!isTokenConfigured()) {
            return null;
        }

        String query = """
                query($username: String!) {
                  user(login: $username) {
                    contributionsCollection {
                      contributionCalendar {
                        totalContributions
                        weeks {
                          contributionDays {
                            date
                            contributionCount
                            color
                          }
                        }
                      }
                    }
                  }
                }
                """;

        Map<String, Object> requestBody = Map.of(
                "query", query,
                "variables", Map.of("username", username)
        );

        try {
            Map<String, Object> response = webClient.post()
                    .uri("/graphql")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, resp -> {
                        if (resp.statusCode().value() == 403) {
                            return Mono.error(new RateLimitExceededException("GitHub API rate limit exceeded"));
                        }
                        return resp.createException().flatMap(Mono::error);
                    })
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            if (response == null) {
                return null;
            }

            // Check for GraphQL errors
            if (response.containsKey("errors")) {
                return null;
            }

            // Navigate: data -> user -> contributionsCollection -> contributionCalendar
            Map<String, Object> data = (Map<String, Object>) response.get("data");
            if (data == null) return null;

            Map<String, Object> user = (Map<String, Object>) data.get("user");
            if (user == null) return null;

            Map<String, Object> collection = (Map<String, Object>) user.get("contributionsCollection");
            if (collection == null) return null;

            return (Map<String, Object>) collection.get("contributionCalendar");
        } catch (Exception e) {
            // Fall back gracefully if GraphQL fails
            return null;
        }
    }

    // ---- Custom Exception Classes ----

    public static class UserNotFoundException extends RuntimeException {
        public UserNotFoundException(String message) {
            super(message);
        }
    }

    public static class RateLimitExceededException extends RuntimeException {
        public RateLimitExceededException(String message) {
            super(message);
        }
    }
}
