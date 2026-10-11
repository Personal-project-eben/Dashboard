import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`🚀 Serveur Dashboard démarré sur http://localhost:${PORT}`);
    console.log(`🩺 Santé : http://localhost:${PORT}/health`);
    console.log(`📋 Métadonnées : http://localhost:${PORT}/about.json`);
});