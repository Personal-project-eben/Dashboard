const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_API = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 10_000;

// Effectue un GET et retourne le JSON, ou lève une erreur lisible en cas d'échec.
async function getJson(url) {
    let reponse;
    try {
        reponse = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (err) {
        throw new Error(err.name === "TimeoutError" ? "request timed out" : err.message);
    }

    if (!reponse.ok) {
        throw new Error(`HTTP ${reponse.status} ${reponse.statusText}`);
    }

    try {
        return await reponse.json();
    } catch {
        throw new Error("the response was not valid JSON");
    }
}

// Résout un nom de ville en coordonnées géographiques via l'API Open-Meteo.
export async function trouverVille(nom) {
    const url = new URL(GEOCODING_API);
    url.searchParams.set("name", nom);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "fr");
    url.searchParams.set("format", "json");

    const donnees = await getJson(url);
    const ville = donnees.results?.[0];

    if (!ville) throw new Error(`no city named "${nom}" was found`);

    return { nom: ville.name, latitude: ville.latitude, longitude: ville.longitude };
}

// Retourne la température actuelle d'une ville à partir de ses coordonnées.
export async function temperatureActuelle({ latitude, longitude }) {
    const url = new URL(FORECAST_API);
    url.searchParams.set("latitude", latitude);
    url.searchParams.set("longitude", longitude);
    url.searchParams.set("current", "temperature_2m");

    const donnees = await getJson(url);
    const temperature = donnees.current?.temperature_2m;
    const unite = donnees.current_units?.temperature_2m;

    if (typeof temperature !== "number") {
        throw new Error("the API returned no temperature for this location");
    }

    return { temperature, unite };
}

// Retourne les prévisions min/max quotidiennes sur N jours (1-16).
export async function previsions({ latitude, longitude }, jours) {
    const n = Number(jours);
    const joursValides = Number.isFinite(n) ? Math.min(Math.max(n, 1), 16) : 3;

    const url = new URL(FORECAST_API);
    url.searchParams.set("latitude", latitude);
    url.searchParams.set("longitude", longitude);
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
    url.searchParams.set("forecast_days", String(joursValides));
    url.searchParams.set("timezone", "auto");

    const donnees = await getJson(url);
    const { time, temperature_2m_max, temperature_2m_min } = donnees.daily ?? {};

    if (!Array.isArray(time)) {
        throw new Error("the API returned no forecast data for this location");
    }

    return time.map((date, i) => ({
        date,
        tempMax: temperature_2m_max[i],
        tempMin: temperature_2m_min[i],
        unite: donnees.daily_units?.temperature_2m_max,
    }));
}