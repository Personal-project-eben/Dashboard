import { Router } from "express";
import { chargerUtilisateur, exigerAuth } from "../middlewares/auth.js";
import { coinPrice, topCoins } from "../services/crypto.js";

export const cryptoRouter = Router();

cryptoRouter.use(chargerUtilisateur, exigerAuth);

// GET /services/crypto/widgets/coin_price/data — retourne le prix actuel d'une crypto.
cryptoRouter.get("/widgets/coin_price/data", async (req, res) => {
    const { coin, currency } = req.query;

    if (!coin) {
        return res.status(400).json({ error: "Query parameter 'coin' is required (e.g. bitcoin, ethereum)" });
    }

    try {
        const data = await coinPrice({ coin, currency: currency || "usd" });
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});

// GET /services/crypto/widgets/top_coins/data — retourne le top N des cryptos par market cap.
cryptoRouter.get("/widgets/top_coins/data", async (req, res) => {
    const { number } = req.query;

    try {
        const data = await topCoins({ number: number ?? 10 });
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});
