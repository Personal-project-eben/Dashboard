import { Router } from "express";
import crypto from "node:crypto";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword } from "../password.js";
import {
    creerSession, detruireSession, poserCookieSession,
    effacerCookieSession, lireSidDepuisRequete
} from "../session.js";
import { chargerUtilisateur, exigerAuth } from "../middlewares/auth.js";
import { sendConfirmationEmail } from "../email.js";

export const authRouter = Router();

// POST /auth/signup — crée un compte non confirmé et retourne le token de confirmation.
authRouter.post("/signup", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || password.length < 8) {
        return res.status(400).json({
            error: "email and password (8+ chars) are required",
        });
    }

    const existant = await prisma.user.findUnique({ where: { email } });
    if (existant) {
        return res.status(409).json({ error: "Email already registered" });
    }

    const confirmToken = crypto.randomBytes(32).toString("hex");

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: hashPassword(password),
            confirmToken,
            confirmed: false,
        },
    });

    // Envoi de l'email de confirmation via Nodemailer
    try {
        await sendConfirmationEmail(email, confirmToken);
    } catch (err) {
        console.error("[email] Error sending confirmation email:", err);
    }

    res.status(201).json({ id: user.id, email: user.email, message: "Un email de confirmation vous a été envoyé." });
});

// GET /auth/confirm — valide le token et marque le compte comme confirmé.
authRouter.get("/confirm", async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const user = await prisma.user.findUnique({ where: { confirmToken: token } });
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    await prisma.user.update({
        where: { id: user.id },
        data: { confirmed: true, confirmToken: null },
    });

    res.json({ message: "Account confirmed, you can now log in" });
});

// POST /auth/login — authentifie l'utilisateur et pose le cookie de session.
authRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;

    // Message identique pour email inconnu et mauvais mot de passe (anti-énumération).
    if (!user || !verifyPassword(password ?? "", user.passwordHash)) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.confirmed) {
        return res.status(403).json({ error: "Account not confirmed yet" });
    }

    poserCookieSession(res, creerSession(user.id));
    res.json({ id: user.id, email: user.email, isAdmin: user.isAdmin });
});

// POST /auth/logout — détruit la session et efface le cookie.
authRouter.post("/logout", (req, res) => {
    const sid = lireSidDepuisRequete(req);
    if (sid) detruireSession(sid);
    effacerCookieSession(res);
    res.status(204).end();
});

// GET /auth/me — retourne l'utilisateur connecté, utilisé pour la garde de route React.
authRouter.get("/me", chargerUtilisateur, exigerAuth, async (req, res) => {
    const subscriptions = await prisma.serviceSubscription.findMany({
        where: { userId: req.user.id },
        select: { service: true }
    });
    res.json({ 
        id: req.user.id, 
        email: req.user.email, 
        isAdmin: req.user.isAdmin,
        subscriptions: subscriptions.map(sub => sub.service)
    });
});