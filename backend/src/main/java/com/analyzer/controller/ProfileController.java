package com.analyzer.controller;

import com.analyzer.dto.*;
import com.analyzer.service.GitHubApiClient;
import com.analyzer.service.GitHubService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final GitHubService gitHubService;

    public ProfileController(GitHubService gitHubService) {
        this.gitHubService = gitHubService;
    }

    /**
     * GET /api/profile/{username}
     * Returns the GitHub user profile.
     */
    @GetMapping("/{username}")
    public ResponseEntity<GitHubUserDTO> getProfile(@PathVariable String username) {
        GitHubUserDTO profile = gitHubService.getProfile(username);
        return ResponseEntity.ok(profile);
    }

    /**
     * GET /api/profile/{username}/languages
     * Returns the aggregated language breakdown across all repos.
     */
    @GetMapping("/{username}/languages")
    public ResponseEntity<LanguageBreakdownDTO> getLanguages(@PathVariable String username) {
        LanguageBreakdownDTO breakdown = gitHubService.getLanguageBreakdown(username);
        return ResponseEntity.ok(breakdown);
    }

    /**
     * GET /api/profile/{username}/contributions
     * Returns contribution calendar data (GraphQL if token available, else Events API).
     */
    @GetMapping("/{username}/contributions")
    public ResponseEntity<ContributionDTO> getContributions(@PathVariable String username) {
        ContributionDTO contributions = gitHubService.getContributionData(username);
        return ResponseEntity.ok(contributions);
    }

    /**
     * GET /api/profile/{username}/repos
     * Returns scored and graded list of non-fork repositories.
     */
    @GetMapping("/{username}/repos")
    public ResponseEntity<List<RepoScoreDTO>> getRepos(@PathVariable String username) {
        List<RepoScoreDTO> scores = gitHubService.getRepoScores(username);
        return ResponseEntity.ok(scores);
    }

    // ---- Exception Handlers ----

    @ExceptionHandler(GitHubApiClient.UserNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUserNotFound(GitHubApiClient.UserNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(GitHubApiClient.RateLimitExceededException.class)
    public ResponseEntity<Map<String, String>> handleRateLimit(GitHubApiClient.RateLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericError(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An unexpected error occurred: " + ex.getMessage()));
    }
}
