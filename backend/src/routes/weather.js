import { Router } from "express";
import { chargerUtilisateur, exigerAuth } from "../middlewares/auth.js";
import { trouverVille, temperatureActuelle, previsions } from "../services/weather.js";

export const weatherRouter = Router();

weatherRouter.use(chargerUtilisateur, exigerAuth);

// GET /services/weather/widgets/city_temperature/data — retourne la température actuelle d'une ville.
weatherRouter.get("/widgets/city_temperature/data", async (req, res) => {
    const { city } = req.query;

    if (!city) {
        return res.status(400).json({ error: "Query parameter 'city' is required" });
    }

    try {
        const ville = await trouverVille(city);
        const { temperature, unite } = await temperatureActuelle(ville);
        res.json({ city: ville.nom, temperature, unit: unite });
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});

// GET /services/weather/widgets/forecast/data — retourne les prévisions météo sur plusieurs jours.
weatherRouter.get("/widgets/forecast/data", async (req, res) => {
    const { city, days } = req.query;

    if (!city) {
        return res.status(400).json({ error: "Query parameter 'city' is required" });
    }

    try {
        const ville = await trouverVille(city);
        const jours = await previsions(ville, days);
        res.json({ city: ville.nom, forecast: jours });
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});