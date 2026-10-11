import { Router } from "express";
import { chargerUtilisateur, exigerAuth } from "../middlewares/auth.js";
import { derniersArticles, dernierTitre } from "../services/rss.js";

export const rssRouter = Router();

rssRouter.use(chargerUtilisateur, exigerAuth);

// GET /services/rss/widgets/article_list/data — retourne les N derniers articles d'un flux RSS.
rssRouter.get("/widgets/article_list/data", async (req, res) => {
    const { link, number } = req.query;

    if (!link) {
        return res.status(400).json({ error: "Query parameter 'link' is required" });
    }

    try {
        const articles = await derniersArticles(link, number);
        res.json({ link, articles });
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});

// GET /services/rss/widgets/feed_headline/data — retourne le dernier article d'un flux RSS.
rssRouter.get("/widgets/feed_headline/data", async (req, res) => {
    const { link } = req.query;

    if (!link) {
        return res.status(400).json({ error: "Query parameter 'link' is required" });
    }

    try {
        const article = await dernierTitre(link);
        res.json({ link, article });
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});