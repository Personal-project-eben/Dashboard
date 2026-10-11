const GITHUB_API = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 10_000;

// Effectue un GET authentifié vers l'API GitHub et retourne le JSON, ou lève une erreur lisible.
async function getJson(url, token) {
    let reponse;
    try {
        reponse = await fetch(url, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });
    } catch (err) {
        throw new Error(err.name === "TimeoutError" ? "request timed out" : err.message);
    }

    if (reponse.status === 401) {
        throw new Error("GitHub token is invalid or expired — please re-link your account");
    }
    if (reponse.status === 403) {
        throw new Error("GitHub rate limit exceeded or insufficient permissions");
    }
    if (reponse.status === 404) {
        throw new Error("Repository not found or not accessible with this token");
    }
    if (!reponse.ok) {
        throw new Error(`GitHub API error: HTTP ${reponse.status} ${reponse.statusText}`);
    }

    try {
        return await reponse.json();
    } catch {
        throw new Error("the GitHub API response was not valid JSON");
    }
}

// Valide que le repo est au format "owner/repo".
function validerRepo(repo) {
    if (!repo || !repo.includes("/") || repo.startsWith("/") || repo.endsWith("/")) {
        throw new Error("'repo' must be in the format 'owner/repo'");
    }
}

// Retourne les N derniers commits d'un dépôt (max 30).
export async function recentCommits({ repo, number }, token) {
    validerRepo(repo);

    const n = Number(number);
    const count = Number.isFinite(n) && n > 0 ? Math.min(n, 30) : 5;

    const url = new URL(`${GITHUB_API}/repos/${repo}/commits`);
    url.searchParams.set("per_page", String(count));

    const donnees = await getJson(url, token);

    if (!Array.isArray(donnees)) {
        throw new Error("unexpected response format from GitHub commits API");
    }

    return donnees.map((item) => ({
        sha: item.sha?.slice(0, 7) ?? "unknown",
        message: item.commit?.message?.split("\n")[0] ?? "",
        author: item.commit?.author?.name ?? "unknown",
        date: item.commit?.author?.date ?? null,
        url: item.html_url ?? null,
    }));
}

// Retourne les alertes Dependabot actives d'un dépôt.
export async function securityAlerts({ repo }, token) {
    validerRepo(repo);

    const url = new URL(`${GITHUB_API}/repos/${repo}/dependabot/alerts`);
    url.searchParams.set("state", "open");
    url.searchParams.set("per_page", "30");

    const donnees = await getJson(url, token);

    if (!Array.isArray(donnees)) {
        throw new Error("unexpected response format from GitHub alerts API");
    }

    return donnees.map((alert) => ({
        number: alert.number,
        severity: alert.security_vulnerability?.severity ?? "unknown",
        packageName: alert.security_vulnerability?.package?.name ?? "unknown",
        summary: alert.security_advisory?.summary ?? "",
        url: alert.html_url ?? null,
        createdAt: alert.created_at ?? null,
    }));
}
