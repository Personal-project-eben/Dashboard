import { prisma } from "../db.js";
import { lireSession, lireSidDepuisRequete } from "../session.js";

// Charge req.user depuis la session si elle est valide, sinon null — ne bloque pas la requête.
export async function chargerUtilisateur(req, res, next) {
    const sid = lireSidDepuisRequete(req);
    const session = sid ? lireSession(sid) : null;

    req.user = session
        ? await prisma.user.findUnique({ where: { id: session.userId } })
        : null;

    next();
}

// Bloque la requête avec 401 si req.user est absent — à placer après chargerUtilisateur.
export function exigerAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
    }
    next();
}

export function exigerAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
}