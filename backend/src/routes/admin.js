import { Router } from "express";
import { prisma } from "../db.js";

export const adminRouter = Router();

adminRouter.get("/users", async (req, res) => {
    const users = await prisma.user.findMany({
        select: { 
            id: true, 
            email: true, 
            confirmed: true, 
            isAdmin: true, 
            createdAt: true,
            _count: { select: { widgets: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(users);
});

adminRouter.patch("/users/:id/confirm", async (req, res) => {
    const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { confirmed: true, confirmToken: null }
    });
    res.json(updated);
});

adminRouter.patch("/users/:id/role", async (req, res) => {
    const { isAdmin } = req.body;
    const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { isAdmin }
    });
    res.json(updated);
});

adminRouter.delete("/users/:id", async (req, res) => {
    await prisma.widgetInstance.deleteMany({ where: { userId: req.params.id } });
    await prisma.serviceSubscription.deleteMany({ where: { userId: req.params.id } });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});
