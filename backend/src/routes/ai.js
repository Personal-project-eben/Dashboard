import { Router } from "express";
import { chargerUtilisateur, exigerAuth } from "../middlewares/auth.js";
import { prisma } from "../db.js";
import { derniersArticles } from "../services/rss.js";
import { trouverVille, temperatureActuelle } from "../services/weather.js";

export const aiRouter = Router();

aiRouter.use(chargerUtilisateur, exigerAuth);

// Helper to call Gemini REST API
async function askGemini(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return "Clé API Gemini manquante. Configurez GEMINI_API_KEY dans votre fichier .env pour activer cette fonctionnalité !";
    }

    const candidateModels = [
        process.env.GEMINI_MODEL,
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
        "gemini-3.8-flash"
    ].filter(Boolean);

    let lastError = null;

    for (const model of candidateModels) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                const errBody = await response.text();
                console.warn(`Tentative Gemini avec modèle ${model} échouée (${response.status}) :`, errBody);
                lastError = new Error(`Erreur Gemini (${response.status}) [${model}] : ${errBody}`);
                continue;
            }

            const data = await response.json();
            const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text)?.text 
                          || data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (textPart) {
                return textPart;
            }
        } catch (err) {
            console.warn(`Erreur réseau/parse Gemini pour ${model}:`, err.message);
            lastError = err;
        }
    }

    console.error("askGemini échec sur tous les modèles:", lastError);
    return `Désolé, une erreur est survenue lors de la génération par l'IA : ${lastError?.message || "Modèles indisponibles"}`;
}

aiRouter.get("/widgets/smart_summary/data", async (req, res) => {
    try {
        const widgets = await prisma.widgetInstance.findMany({
            where: { userId: req.user.id }
        });

        const rssWidget = widgets.find(w => w.service === 'rss' && w.widget === 'article_list');
        
        let contextData = "";
        
        if (rssWidget && rssWidget.config.link) {
            try {
                const articles = await derniersArticles(rssWidget.config.link, 5);
                contextData += `\nFlux RSS (${rssWidget.config.link}):\n` + articles.map(a => `- ${a.title}`).join("\n");
            } catch (e) {
                // Ignore error
            }
        }
        
        const githubWidget = widgets.find(w => w.service === 'github' && w.widget === 'recent_commits');
        if (githubWidget && githubWidget.config.repo) {
            // For simplicity, we just mention the repo they are working on
            contextData += `\nDépôt GitHub actif: ${githubWidget.config.repo}`;
        }

        const weatherWidget = widgets.find(w => w.service === 'weather');
        if (weatherWidget && weatherWidget.config.city) {
            try {
                const ville = await trouverVille(weatherWidget.config.city);
                const temp = await temperatureActuelle(ville);
                contextData += `\nMétéo actuelle à ${weatherWidget.config.city}: ${temp.temperature}${temp.unite}`;
            } catch {
                contextData += `\nVille configurée pour la météo: ${weatherWidget.config.city}`;
            }
        }

        const prompt = `Tu es l'assistant IA d'un tableau de bord (dashboard).
Voici les informations extraites des widgets de l'utilisateur :
${contextData || "Aucun widget RSS ou GitHub n'est configuré."}

Génère un résumé automatique, chaleureux et direct en 2 phrases maximum, du type : "Aujourd'hui, vous vous concentrez sur [projet] et l'actualité parle principalement de [sujet]". Si les données manquent, invente un message encourageant.`;

        const summary = await askGemini(prompt);
        res.json({ summary });
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});

aiRouter.post("/chat", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message requis" });

    try {
        // We get their config to answer contextual questions
        const widgets = await prisma.widgetInstance.findMany({
            where: { userId: req.user.id }
        });

        const configContext = widgets.map(w => `- ${w.service}/${w.widget}: ${JSON.stringify(w.config)}`).join("\n");

        let liveExtra = "";
        const weatherWidget = widgets.find(w => w.service === 'weather');
        if (weatherWidget && weatherWidget.config.city) {
            try {
                const ville = await trouverVille(weatherWidget.config.city);
                const temp = await temperatureActuelle(ville);
                liveExtra += `\nMétéo en direct dans la ville du dashboard (${weatherWidget.config.city}): ${temp.temperature}${temp.unite}`;
            } catch {}
        }

        // Détection si l'utilisateur demande la météo d'une ville spécifique
        const matchVille = message.match(/(?:temps|météo|meteo|temperature|température)\s+(?:à|a|de|pour)?\s*([a-zA-ZÀ-ÿ\s-]+)/i);
        if (matchVille && matchVille[1]) {
            const cityName = matchVille[1].replace(/[?!.]/g, '').trim();
            if (cityName && (!weatherWidget || weatherWidget.config?.city?.toLowerCase() !== cityName.toLowerCase())) {
                try {
                    const ville = await trouverVille(cityName);
                    const temp = await temperatureActuelle(ville);
                    liveExtra += `\nMétéo en direct pour ${ville.nom}: ${temp.temperature}${temp.unite}`;
                } catch {}
            }
        }

        const prompt = `Tu es l'assistant intelligent du dashboard de l'utilisateur. 
L'utilisateur te demande : "${message}"
Pour contexte, voici les widgets actuellement sur son dashboard :
${configContext || "Aucun widget configuré"}
${liveExtra ? `Données en temps réel extraites du dashboard :${liveExtra}` : ""}
Réponds de manière très concise (2-3 lignes maximum), chaleureuse et utile.`;

        const reply = await askGemini(prompt);
        res.json({ reply });
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});
