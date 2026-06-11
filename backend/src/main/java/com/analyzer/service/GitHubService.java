package com.analyzer.service;

import com.analyzer.dto.*;
import com.analyzer.dto.ContributionDTO.DayContribution;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GitHubService {

    private final GitHubApiClient apiClient;

    public GitHubService(GitHubApiClient apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Fetch a GitHub user profile and map it to GitHubUserDTO.
     */
    public GitHubUserDTO getProfile(String username) {
        Map<String, Object> raw = apiClient.getUser(username);
        if (raw == null) {
            throw new GitHubApiClient.UserNotFoundException("User not found: " + username);
        }

        return new GitHubUserDTO(
                str(raw, "login"),
                str(raw, "name"),
                str(raw, "avatar_url"),
                str(raw, "bio"),
                str(raw, "company"),
                str(raw, "location"),
                str(raw, "email"),
                str(raw, "blog"),
                str(raw, "html_url"),
                str(raw, "twitter_username"),
                intVal(raw, "public_repos"),
                intVal(raw, "public_gists"),
                intVal(raw, "followers"),
                intVal(raw, "following"),
                str(raw, "created_at"),
                str(raw, "updated_at")
        );
    }

    /**
     * Aggregate language byte-counts across all non-fork repos (up to 30)
     * and compute percentages.
     */
    public LanguageBreakdownDTO getLanguageBreakdown(String username) {
        List<Map<String, Object>> repos = apiClient.getRepos(username);

        // Filter out forks, limit to 30
        List<Map<String, Object>> nonForkRepos = repos.stream()
                .filter(r -> !boolVal(r, "fork"))
                .limit(30)
                .toList();

        Map<String, Long> aggregatedBytes = new LinkedHashMap<>();

        for (Map<String, Object> repo : nonForkRepos) {
            String repoName = str(repo, "name");
            String owner = extractOwner(repo);
            if (owner == null || repoName == null) continue;

            try {
                Map<String, Long> langs = apiClient.getRepoLanguages(owner, repoName);
                for (Map.Entry<String, Long> entry : langs.entrySet()) {
                    aggregatedBytes.merge(entry.getKey(), entry.getValue(), Long::sum);
                }
            } catch (Exception e) {
                // Skip repos where language fetch fails
            }
        }

        long totalBytes = aggregatedBytes.values().stream().mapToLong(Long::longValue).sum();

        // Calculate percentages, sorted by bytes descending
        Map<String, Double> percentages = new LinkedHashMap<>();
        if (totalBytes > 0) {
            aggregatedBytes.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .forEach(entry -> {
                        double pct = Math.round(entry.getValue() * 10000.0 / totalBytes) / 100.0;
                        percentages.put(entry.getKey(), pct);
                    });
        }

        // Sort bytes map the same way
        Map<String, Long> sortedBytes = new LinkedHashMap<>();
        aggregatedBytes.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(entry -> sortedBytes.put(entry.getKey(), entry.getValue()));

        return new LanguageBreakdownDTO(percentages, sortedBytes, totalBytes);
    }

    /**
     * Fetch contribution data — prefers GraphQL calendar if token is available,
     * otherwise falls back to the Events API.
     */
    @SuppressWarnings("unchecked")
    public ContributionDTO getContributionData(String username) {
        // Try GraphQL first
        if (apiClient.isTokenConfigured()) {
            Map<String, Object> calendar = apiClient.getContributionCalendar(username);
            if (calendar != null) {
                return parseGraphQLContributions(calendar);
            }
        }

        // Fallback: Events API
        return parseEventsContributions(username);
    }

    /**
     * Score every non-fork repo on quality metrics and return sorted list.
     */
    @SuppressWarnings("unchecked")
    public List<RepoScoreDTO> getRepoScores(String username) {
        List<Map<String, Object>> repos = apiClient.getRepos(username);

        return repos.stream()
                .filter(r -> !boolVal(r, "fork"))
                .map(this::scoreRepo)
                .sorted(Comparator.comparingDouble(RepoScoreDTO::overallScore).reversed())
                .collect(Collectors.toList());
    }

    // =====================================================================
    //  Private helpers
    // =====================================================================

    @SuppressWarnings("unchecked")
    private ContributionDTO parseGraphQLContributions(Map<String, Object> calendar) {
        int total = intVal(calendar, "totalContributions");
        List<DayContribution> contributions = new ArrayList<>();

        List<Map<String, Object>> weeks = (List<Map<String, Object>>) calendar.get("weeks");
        if (weeks != null) {
            for (Map<String, Object> week : weeks) {
                List<Map<String, Object>> days = (List<Map<String, Object>>) week.get("contributionDays");
                if (days != null) {
                    for (Map<String, Object> day : days) {
                        contributions.add(new DayContribution(
                                str(day, "date"),
                                intVal(day, "contributionCount"),
                                str(day, "color")
                        ));
                    }
                }
            }
        }

        return new ContributionDTO(total, contributions, "graphql");
    }

    private ContributionDTO parseEventsContributions(String username) {
        List<Map<String, Object>> events = apiClient.getEvents(username);

        // Group PushEvent counts by date
        Map<String, Integer> dateCounts = new TreeMap<>();

        for (Map<String, Object> event : events) {
            String type = str(event, "type");
            if (!"PushEvent".equals(type)) continue;

            String createdAt = str(event, "created_at");
            if (createdAt == null) continue;

            String date = extractDate(createdAt);
            if (date == null) continue;

            // Each PushEvent may contain multiple commits
            int commitCount = 1;
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = (Map<String, Object>) event.get("payload");
            if (payload != null) {
                Object commits = payload.get("commits");
                if (commits instanceof List<?> commitList) {
                    commitCount = Math.max(1, commitList.size());
                }
            }

            dateCounts.merge(date, commitCount, Integer::sum);
        }

        int total = dateCounts.values().stream().mapToInt(Integer::intValue).sum();

        List<DayContribution> contributions = dateCounts.entrySet().stream()
                .map(entry -> new DayContribution(
                        entry.getKey(),
                        entry.getValue(),
                        contributionColor(entry.getValue())
                ))
                .collect(Collectors.toList());

        return new ContributionDTO(total, contributions, "events");
    }

    @SuppressWarnings("unchecked")
    private RepoScoreDTO scoreRepo(Map<String, Object> repo) {
        int stars = intVal(repo, "stargazers_count");
        int forks = intVal(repo, "forks_count");
        int watchers = intVal(repo, "watchers_count");
        int size = intVal(repo, "size");
        String description = str(repo, "description");
        Object license = repo.get("license");
        String pushedAt = str(repo, "pushed_at");

        // --- Factor scores ---
        double starScore = Math.min(100, log2(stars + 1) * 15);
        double forkScore = Math.min(100, log2(forks + 1) * 20);
        double descScore = (description != null && !description.isBlank()) ? 100 : 0;
        double licenseScore = (license != null && license instanceof Map) ? 100 : 0;
        double recencyScore = calculateRecencyScore(pushedAt);
        double sizeActivityScore = Math.min(100, log2(size + 1) * 10 + watchers * 5);

        // Weighted overall
        double overall = starScore * 0.25
                + forkScore * 0.15
                + descScore * 0.10
                + licenseScore * 0.10
                + recencyScore * 0.20
                + sizeActivityScore * 0.20;

        overall = Math.round(overall * 100.0) / 100.0;

        Map<String, Double> breakdown = new LinkedHashMap<>();
        breakdown.put("stars", Math.round(starScore * 100.0) / 100.0);
        breakdown.put("forks", Math.round(forkScore * 100.0) / 100.0);
        breakdown.put("hasDescription", descScore);
        breakdown.put("hasLicense", licenseScore);
        breakdown.put("recency", recencyScore);
        breakdown.put("sizeActivity", Math.round(sizeActivityScore * 100.0) / 100.0);

        String grade = calculateGrade(overall);

        return new RepoScoreDTO(
                str(repo, "name"),
                description,
                str(repo, "html_url"),
                str(repo, "language"),
                stars,
                forks,
                overall,
                breakdown,
                grade
        );
    }

    private double calculateRecencyScore(String pushedAt) {
        if (pushedAt == null || pushedAt.isBlank()) return 10;

        try {
            Instant pushed = Instant.parse(pushedAt);
            long daysSincePush = ChronoUnit.DAYS.between(pushed, Instant.now());

            if (daysSincePush <= 7) return 100;
            if (daysSincePush <= 30) return 80;
            if (daysSincePush <= 90) return 60;
            if (daysSincePush <= 180) return 40;
            if (daysSincePush <= 365) return 20;
            return 10;
        } catch (DateTimeParseException e) {
            return 10;
        }
    }

    private String calculateGrade(double score) {
        if (score >= 80) return "A";
        if (score >= 65) return "B";
        if (score >= 50) return "C";
        if (score >= 35) return "D";
        return "F";
    }

    private double log2(double x) {
        return x <= 0 ? 0 : Math.log(x) / Math.log(2);
    }

    private String contributionColor(int count) {
        if (count == 0) return "#ebedf0";
        if (count <= 3) return "#9be9a8";
        if (count <= 6) return "#40c463";
        if (count <= 9) return "#30a14e";
        return "#216e39";
    }

    private String extractDate(String isoTimestamp) {
        if (isoTimestamp == null) return null;
        try {
            Instant instant = Instant.parse(isoTimestamp);
            return instant.atZone(ZoneOffset.UTC)
                    .toLocalDate()
                    .format(DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException e) {
            // Try just taking first 10 chars (yyyy-MM-dd)
            if (isoTimestamp.length() >= 10) {
                return isoTimestamp.substring(0, 10);
            }
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String extractOwner(Map<String, Object> repo) {
        Object ownerObj = repo.get("owner");
        if (ownerObj instanceof Map) {
            return str((Map<String, Object>) ownerObj, "login");
        }
        // Fallback: extract from full_name
        String fullName = str(repo, "full_name");
        if (fullName != null && fullName.contains("/")) {
            return fullName.split("/")[0];
        }
        return null;
    }

    private String str(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private int intVal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number num) {
            return num.intValue();
        }
        return 0;
    }

    private boolean boolVal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Boolean b) {
            return b;
        }
        return false;
    }
}
