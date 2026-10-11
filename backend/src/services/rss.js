import { XMLParser } from "fast-xml-parser";

const REQUEST_TIMEOUT_MS = 10_000;

// Force <item> à toujours être un tableau même s'il n'y a qu'un seul article dans le flux.
const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (nomBalise) => nomBalise === "item",
});

// Récupère et parse un flux RSS, retourne la liste brute des <item>.
async function recupererItems(lienFlux) {
    let reponse;
    try {
        reponse = await fetch(lienFlux, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (err) {
        throw new Error(err.name === "TimeoutError" ? "request timed out" : err.message);
    }

    if (!reponse.ok) {
        throw new Error(`HTTP ${reponse.status} ${reponse.statusText}`);
    }

    const xmlBrut = await reponse.text();

    let arbre;
    try {
        arbre = parser.parse(xmlBrut);
    } catch {
        throw new Error("the response was not valid RSS/XML");
    }

    const items = arbre.rss?.channel?.item;

    if (!Array.isArray(items)) {
        throw new Error("no items found in this feed (is the link a valid RSS feed?)");
    }

    return items;
}

// Normalise un <item> brut du XML vers une forme stable indépendante du flux source.
function normaliser(item) {
    return {
        title: typeof item.title === "string" ? item.title : (item.title?.["#text"] ?? ""),
        link: item.link ?? "",
        pubDate: item.pubDate ?? null,
    };
}

// Retourne les N derniers articles normalisés d'un flux RSS.
export async function derniersArticles(lienFlux, nombre) {
    const n = Number(nombre);
    const nombreValide = Number.isFinite(n) ? Math.min(Math.max(n, 1), 50) : 5;

    const items = await recupererItems(lienFlux);
    return items.slice(0, nombreValide).map(normaliser);
}

// Retourne le dernier article normalisé d'un flux RSS.
export async function dernierTitre(lienFlux) {
    const items = await recupererItems(lienFlux);

    if (items.length === 0) {
        throw new Error("this feed has no items");
    }

    return normaliser(items[0]);
}