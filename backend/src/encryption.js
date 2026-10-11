import crypto from "node:crypto";

const ALGORITHME = "aes-256-gcm";

// Lit et valide la clé AES-256 depuis la variable d'environnement ENCRYPTION_KEY.
function lireCle() {
    const cle = process.env.ENCRYPTION_KEY;

    if (!cle) {
        throw new Error(
            "ENCRYPTION_KEY manquante dans les variables d'environnement. " +
            "Générez-en une avec: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        );
    }

    const buffer = Buffer.from(cle, "hex");
    if (buffer.length !== 32) {
        throw new Error(
            `ENCRYPTION_KEY doit représenter exactement 32 octets (64 caractères hexadécimaux). ` +
            `Longueur actuelle: ${buffer.length} octets.`
        );
    }

    return buffer;
}

// Chiffre un texte en clair en AES-256-GCM et retourne iv:authTag:ciphertext en hex.
export function chiffrer(texteClair) {
    const cle = lireCle();

    // IV aléatoire à chaque chiffrement pour éviter que deux valeurs identiques produisent le même résultat.
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(ALGORITHME, cle, iv);

    const chiffre = Buffer.concat([
        cipher.update(texteClair, "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [iv.toString("hex"), authTag.toString("hex"), chiffre.toString("hex")].join(":");
}

// Déchiffre une chaîne produite par chiffrer() et lève une erreur si le tag d'authentification échoue.
export function dechiffrer(valeurChiffree) {
    const cle = lireCle();
    const [ivHex, authTagHex, chiffreHex] = valeurChiffree.split(":");

    if (!ivHex || !authTagHex || !chiffreHex) {
        throw new Error("Format de donnée chiffrée invalide");
    }

    const decipher = crypto.createDecipheriv(ALGORITHME, cle, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    const clair = Buffer.concat([
        decipher.update(Buffer.from(chiffreHex, "hex")),
        decipher.final(),
    ]);

    return clair.toString("utf8");
}