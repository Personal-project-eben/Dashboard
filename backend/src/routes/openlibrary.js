import { Router } from "express";
import { chargerUtilisateur, exigerAuth } from "../middlewares/auth.js";
import { bookInfo, authorBooks } from "../services/openlibrary.js";

export const openlibraryRouter = Router();

openlibraryRouter.use(chargerUtilisateur, exigerAuth);

// GET /services/openlibrary/widgets/book_info/data — retourne les infos d'un livre par son titre.
openlibraryRouter.get("/widgets/book_info/data", async (req, res) => {
    const { title } = req.query;

    if (!title) {
        return res.status(400).json({ error: "Query parameter 'title' is required" });
    }

    try {
        const data = await bookInfo({ title });
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});

// GET /services/openlibrary/widgets/author_books/data — retourne les livres d'un auteur.
openlibraryRouter.get("/widgets/author_books/data", async (req, res) => {
    const { author, number } = req.query;

    if (!author) {
        return res.status(400).json({ error: "Query parameter 'author' is required" });
    }

    try {
        const data = await authorBooks({ author, number: number ?? 5 });
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});
