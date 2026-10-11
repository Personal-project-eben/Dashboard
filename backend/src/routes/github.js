import { Router } from "express";
import { prisma } from "../db.js";
import { chargerUtilisateur, exigerAuth } from "../middlewares/auth.js";
import { chiffrer, dechiffrer } from "../encryption.js";
import { recentCommits, securityAlerts } from "../services/github.js";

export const githubRouter = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;

// Scopes demandés à GitHub : accès aux commits et aux alertes de sécurité.
const GITHUB_SCOPES = "repo,security_events";

// Récupère et déchiffre le token GitHub stocké pour l'utilisateur, lève une erreur si absent.
async function obtenirTokenGitHub(userId) {
    const sub = await prisma.serviceSubscription.findUnique({
        where: { userId_service: { userId, service: "github" } },
    });

    if (!sub || !sub.credentialsEncrypted) {
        throw new Error("GitHub account not linked — please connect via /services/github/auth");
    }

    return dechiffrer(sub.credentialsEncrypted);
}

// GET /services/github/auth — redirige l'utilisateur vers l'autorisation OAuth GitHub.
githubRouter.get("/auth", chargerUtilisateur, exigerAuth, (req, res) => {
    if (!GITHUB_CLIENT_ID || !GITHUB_REDIRECT_URI) {
        return res.status(503).json({
            error: "GitHub OAuth is not configured on this server",
        });
    }

    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: GITHUB_REDIRECT_URI,
        scope: GITHUB_SCOPES,
        // Encode l'userId dans le state pour le retrouver au callback.
        state: Buffer.from(JSON.stringify({ userId: req.user.id })).toString("base64url"),
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// GET /services/github/callback — échange le code OAuth contre un token, le chiffre et le stocke.
githubRouter.get("/callback", async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        return res.status(400).json({ error: `GitHub authorization denied: ${error}` });
    }

    if (!code || !state) {
        return res.status(400).json({ error: "Missing 'code' or 'state' from GitHub" });
    }

    // Décode l'userId depuis le state.
    let userId;
    try {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
        userId = decoded.userId;
    } catch {
        return res.status(400).json({ error: "Invalid state parameter" });
    }

    if (!userId) {
        return res.status(400).json({ error: "Could not identify user from state" });
    }

    // Échange le code contre un access_token auprès de GitHub.
    let tokenReponse;
    try {
        const reponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: GITHUB_REDIRECT_URI,
            }),
            signal: AbortSignal.timeout(10_000),
        });

        tokenReponse = await reponse.json();
    } catch (err) {
        return res.status(502).json({ error: `GitHub token exchange failed: ${err.message}` });
    }

    if (tokenReponse.error) {
        return res.status(400).json({
            error: `GitHub returned an error: ${tokenReponse.error_description ?? tokenReponse.error}`,
        });
    }

    const accessToken = tokenReponse.access_token;
    if (!accessToken) {
        return res.status(502).json({ error: "GitHub did not return an access token" });
    }

    // Chiffre le token avant de le stocker en base.
    const tokenChiffre = chiffrer(accessToken);

    await prisma.serviceSubscription.upsert({
        where: { userId_service: { userId, service: "github" } },
        update: { credentialsEncrypted: tokenChiffre },
        create: { userId, service: "github", credentialsEncrypted: tokenChiffre },
    });

    // Redirige vers le dashboard après la liaison du compte GitHub.
    const frontendOrigin = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    res.redirect(`${frontendOrigin}/dashboard`);
});

githubRouter.use(chargerUtilisateur, exigerAuth);

// GET /services/github/widgets/recent_commits/data — retourne les N derniers commits d'un dépôt.
githubRouter.get("/widgets/recent_commits/data", async (req, res) => {
    const { repo, number } = req.query;

    if (!repo) {
        return res.status(400).json({ error: "Query parameter 'repo' is required (format: owner/repo)" });
    }

    try {
        const token = await obtenirTokenGitHub(req.user.id);
        const commits = await recentCommits({ repo, number: Number(number) || 5 }, token);
        res.json({ repo, commits });
    } catch (err) {
        const estNonLie = err.message.includes("not linked");
        res.status(estNonLie ? 403 : 502).json({ error: err.message });
    }
});

// GET /services/github/widgets/security_alerts/data — retourne les alertes Dependabot actives d'un dépôt.
githubRouter.get("/widgets/security_alerts/data", async (req, res) => {
    const { repo } = req.query;

    if (!repo) {
        return res.status(400).json({ error: "Query parameter 'repo' is required (format: owner/repo)" });
    }

    try {
        const token = await obtenirTokenGitHub(req.user.id);
        const alerts = await securityAlerts({ repo }, token);
        res.json({ repo, alerts, count: alerts.length });
    } catch (err) {
        const estNonLie = err.message.includes("not linked");
        res.status(estNonLie ? 403 : 502).json({ error: err.message });
    }
});
