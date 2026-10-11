import crypto from "node:crypto";

// Hash un mot de passe avec scrypt (lent et résistant à la force brute) + sel aléatoire par utilisateur.
export function hashPassword(password) {
    const sel = crypto.randomBytes(16);
    const derive = crypto.scryptSync(password, sel, 64);
    return `scrypt$${sel.toString("hex")}$${derive.toString("hex")}`;
}

// Vérifie un mot de passe contre son hash stocké, en comparaison en temps constant.
export function verifyPassword(password, stocke) {
    const [algo, selHex, hashHex] = stocke.split("$");
    if (algo !== "scrypt") return false;

    const attendu = Buffer.from(hashHex, "hex");
    const obtenu = crypto.scryptSync(password, Buffer.from(selHex, "hex"), attendu.length);

    return crypto.timingSafeEqual(attendu, obtenu);
}
