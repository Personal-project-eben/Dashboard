import crypto from "node:crypto";

// Sessions stockées en mémoire — perdues à chaque redémarrage du serveur.
const sessions = new Map();

const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000;

// Crée une nouvelle session pour l'utilisateur et retourne son identifiant.
export function creerSession(userId) {
    const sid = crypto.randomBytes(32).toString("hex");
    sessions.set(sid, { userId, expiresAt: Date.now() + SEPT_JOURS_MS });
    return sid;
}

// Retourne la session si elle existe et n'est pas expirée, sinon null.
export function lireSession(sid) {
    const session = sessions.get(sid);
    if (!session) return null;

    if (session.expiresAt <= Date.now()) {
        sessions.delete(sid);
        return null;
    }
    return session;
}

// Supprime une session par son identifiant.
export function detruireSession(sid) {
    sessions.delete(sid);
}

const COOKIE_NAME = "sid";

// Pose le cookie de session sécurisé (httpOnly, sameSite) sur la réponse.
export function poserCookieSession(res, sid) {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie(COOKIE_NAME, sid, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: SEPT_JOURS_MS,
    });
}

// Efface le cookie de session de la réponse.
export function effacerCookieSession(res) {
    res.clearCookie(COOKIE_NAME);
}

// Lit l'identifiant de session depuis le cookie de la requête.
export function lireSidDepuisRequete(req) {
    return req.cookies?.[COOKIE_NAME] ?? null;
}
