import { Router } from "express";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword } from "../password.js";

export const profileRouter = Router();

profileRouter.patch("/password", async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: "Invalid input" });
    }
    
    if (!verifyPassword(currentPassword, req.user.passwordHash)) {
        return res.status(403).json({ error: "Mot de passe actuel incorrect" });
    }
    
    await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash: hashPassword(newPassword) }
    });
    
    res.json({ success: true });
});

profileRouter.delete("/services/:serviceName", async (req, res) => {
    const { serviceName } = req.params;
    await prisma.serviceSubscription.deleteMany({
        where: { userId: req.user.id, service: serviceName }
    });
    // Aussi supprimer les widgets liés à ce service
    await prisma.widgetInstance.deleteMany({
        where: { userId: req.user.id, service: serviceName }
    });
    res.json({ success: true });
});
