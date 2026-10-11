// Source unique de vérité pour la liste des services et widgets supportés.
export const CATALOGUE_SERVICES = [
    {
        name: "weather",
        widgets: [
            {
                name: "city_temperature",
                description: "Affiche la température actuelle d'une ville",
                params: [{ name: "city", type: "string" }],
            },
            {
                name: "forecast",
                description: "Affiche les prévisions météo sur plusieurs jours",
                params: [
                    { name: "city", type: "string" },
                    { name: "days", type: "integer" },
                ],
            },
        ],
    },
    {
        name: "rss",
        widgets: [
            {
                name: "article_list",
                description: "Affiche les derniers articles d'un flux RSS",
                params: [
                    { name: "link", type: "string" },
                    { name: "number", type: "integer" },
                ],
            },
            {
                name: "feed_headline",
                description: "Affiche le dernier titre publié sur un flux",
                params: [{ name: "link", type: "string" }],
            },
        ],
    },
    {
        name: "github",
        widgets: [
            {
                name: "recent_commits",
                description: "Affiche les derniers commits d'un dépôt",
                params: [
                    { name: "repo", type: "string" },
                    { name: "number", type: "integer" },
                ],
            },
            {
                name: "security_alerts",
                description: "Affiche les alertes de sécurité d'un dépôt",
                params: [{ name: "repo", type: "string" }],
            },
        ],
    },
    {
        name: "crypto",
        widgets: [
            {
                name: "coin_price",
                description: "Affiche le prix actuel d'une crypto-monnaie",
                params: [
                    { name: "coin", type: "string" },
                    { name: "currency", type: "string" },
                ],
            },
            {
                name: "top_coins",
                description: "Affiche le classement des cryptos par capitalisation",
                params: [{ name: "number", type: "integer" }],
            },
        ],
    },
    {
        name: "openlibrary",
        widgets: [
            {
                name: "book_info",
                description: "Affiche les informations d'un livre par son titre",
                params: [{ name: "title", type: "string" }],
            },
            {
                name: "author_books",
                description: "Affiche les livres d'un auteur",
                params: [
                    { name: "author", type: "string" },
                    { name: "number", type: "integer" },
                ],
            },
        ],
    },
    {
        name: "inspiration",
        widgets: [
            {
                name: "random_quote",
                description: "Affiche une citation aléatoire",
                params: [],
            },
        ],
    },
    {
        name: "productivity",
        widgets: [
            {
                name: "pomodoro",
                description: "Minuteur Pomodoro (Focus / Pause)",
                params: [
                    { name: "focusTime", type: "integer" },
                    { name: "breakTime", type: "integer" },
                ],
            },
        ],
    },
    {
        name: "ai",
        widgets: [
            {
                name: "smart_summary",
                description: "Résumé IA (OpenAI/Gemini) de vos données",
                params: [],
            },
        ],
    },
];

// Retourne la définition d'un widget depuis le catalogue, ou null si inconnu.
export function trouverWidget(nomService, nomWidget) {
    const service = CATALOGUE_SERVICES.find((s) => s.name === nomService);
    if (!service) return null;

    return service.widgets.find((w) => w.name === nomWidget) ?? null;
}