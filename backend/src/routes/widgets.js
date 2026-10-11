import { Router } from "express";
import { prisma } from "../db.js";
import { chargerUtilisateur, exigerAuth } from "../middlewares/auth.js";
import { trouverWidget } from "../catalog.js";

export const widgetsRouter = Router();

widgetsRouter.use(chargerUtilisateur, exigerAuth);

const REFRESH_RATE_MIN = 5;
const REFRESH_RATE_MAX = 3600;

// Vérifie que tous les paramètres requis du widget sont présents et du bon type.
function validerConfig(definitionWidget, config) {
    for (const param of definitionWidget.params) {
        const valeur = config?.[param.name];

        if (valeur === undefined || valeur === null) {
            return `Missing parameter '${param.name}'`;
        }

        if (param.type === "string" && typeof valeur !== "string") {
            return `Parameter '${param.name}' must be a string`;
        }

        if (param.type === "integer" && !Number.isInteger(valeur)) {
            return `Parameter '${param.name}' must be an integer`;
        }
    }
    return null;
}

// Vérifie que le taux de rafraîchissement est un entier dans les bornes autorisées.
function validerRefreshRate(refreshRate) {
    if (!Number.isInteger(refreshRate)) return "refreshRate must be an integer (seconds)";
    if (refreshRate < REFRESH_RATE_MIN || refreshRate > REFRESH_RATE_MAX) {
        return `refreshRate must be between ${REFRESH_RATE_MIN} and ${REFRESH_RATE_MAX} seconds`;
    }
    return null;
}

// GET /dashboard/widgets — liste toutes les instances de l'utilisateur connecté, triées par position.
widgetsRouter.get("/", async (req, res) => {
    const widgets = await prisma.widgetInstance.findMany({
        where: { userId: req.user.id },
        orderBy: { position: "asc" },
    });
    res.json(widgets);
});

// POST /dashboard/widgets — crée une nouvelle instance de widget pour l'utilisateur connecté.
widgetsRouter.post("/", async (req, res) => {
    const { service, widget, config, refreshRate } = req.body;

    if (!service || !widget) {
        return res.status(400).json({ error: "'service' and 'widget' are required" });
    }

    const definition = trouverWidget(service, widget);
    if (!definition) {
        return res.status(400).json({ error: `Unknown widget '${widget}' for service '${service}'` });
    }

    const erreurConfig = validerConfig(definition, config);
    if (erreurConfig) return res.status(400).json({ error: erreurConfig });

    const erreurRefresh = validerRefreshRate(refreshRate);
    if (erreurRefresh) return res.status(400).json({ error: erreurRefresh });

    // Place le widget en fin de dashboard (max position + 1).
    const { _max } = await prisma.widgetInstance.aggregate({
        where: { userId: req.user.id },
        _max: { position: true },
    });
    const position = (_max.position ?? -1) + 1;

    const instance = await prisma.widgetInstance.create({
        data: { userId: req.user.id, service, widget, config, refreshRate, position },
    });

    res.status(201).json(instance);
});

// PATCH /dashboard/widgets/:id — met à jour la config, le refreshRate ou la position d'un widget.
widgetsRouter.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const { config, refreshRate, position } = req.body;

    const existant = await prisma.widgetInstance.findUnique({ where: { id } });

    // Répond 404 même si le widget appartient à un autre utilisateur (ne pas révéler l'existence).
    if (!existant || existant.userId !== req.user.id) {
        return res.status(404).json({ error: "Widget instance not found" });
    }

    const donneesMiseAJour = {};

    if (config !== undefined) {
        const definition = trouverWidget(existant.service, existant.widget);
        const erreurConfig = validerConfig(definition, config);
        if (erreurConfig) return res.status(400).json({ error: erreurConfig });
        donneesMiseAJour.config = config;
    }

    if (refreshRate !== undefined) {
        const erreurRefresh = validerRefreshRate(refreshRate);
        if (erreurRefresh) return res.status(400).json({ error: erreurRefresh });
        donneesMiseAJour.refreshRate = refreshRate;
    }

    if (position !== undefined) {
        if (!Number.isInteger(position) || position < 0) {
            return res.status(400).json({ error: "position must be a non-negative integer" });
        }
        donneesMiseAJour.position = position;
    }

    if (Object.keys(donneesMiseAJour).length === 0) {
        return res.status(400).json({ error: "Nothing to update" });
    }

    const instance = await prisma.widgetInstance.update({
        where: { id },
        data: donneesMiseAJour,
    });

    res.json(instance);
});

// DELETE /dashboard/widgets/:id — supprime une instance de widget de l'utilisateur connecté.
widgetsRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const existant = await prisma.widgetInstance.findUnique({ where: { id } });

    if (!existant || existant.userId !== req.user.id) {
        return res.status(404).json({ error: "Widget instance not found" });
    }

    await prisma.widgetInstance.delete({ where: { id } });
    res.status(204).end();
});