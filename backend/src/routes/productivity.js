import { Router } from "express";

export const productivityRouter = Router();

productivityRouter.get("/pomodoro", (req, res) => {
    const focusTime = parseInt(req.query.focusTime, 10) || 25;
    const breakTime = parseInt(req.query.breakTime, 10) || 5;
    
    // Le widget n'a besoin que de valider que la configuration est bien transmise.
    // L'état du minuteur sera géré côté frontend pour être en temps réel.
    res.json({
        focusTime,
        breakTime,
        message: "Timer prêt",
        timestamp: Date.now()
    });
});
