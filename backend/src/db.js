import { PrismaClient } from "@prisma/client";

// Instance PrismaClient unique partagée dans toute l'application.
export const prisma = new PrismaClient();