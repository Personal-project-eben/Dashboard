import { Router } from "express";

export const inspirationRouter = Router();

// Cache simple pour éviter le spam
let cachedQuote = null;
let lastFetch = 0;

inspirationRouter.get("/random_quote", async (req, res) => {
    try {
        const now = Date.now();
        if (cachedQuote && now - lastFetch < 60000) {
            return res.json(cachedQuote);
        }
        
        // Dummy API call or fallback
        const response = await fetch("https://api.quotable.io/random");
        if (response.ok) {
            const data = await response.json();
            cachedQuote = { quote: data.content, author: data.author };
            lastFetch = now;
        } else {
            cachedQuote = { quote: "L'innovation, c'est ce qui distingue un leader d'un suiveur.", author: "Steve Jobs" };
        }
        res.json(cachedQuote);
    } catch (err) {
        res.json({ quote: "Le code est comme l'humour. Quand on doit l'expliquer, c'est mauvais.", author: "Cory House" });
    }
});
