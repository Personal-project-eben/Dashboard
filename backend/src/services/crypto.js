const COINGECKO_API = "https://api.coingecko.com/api/v3";
const REQUEST_TIMEOUT_MS = 10_000;

// Effectue un GET vers l'API CoinGecko et retourne le JSON, ou lève une erreur lisible.
async function getJson(url) {
    let reponse;
    try {
        reponse = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (err) {
        throw new Error(err.name === "TimeoutError" ? "request timed out" : err.message);
    }

    if (reponse.status === 429) {
        throw new Error("CoinGecko rate limit exceeded — please wait a moment");
    }
    if (!reponse.ok) {
        throw new Error(`CoinGecko API error: HTTP ${reponse.status} ${reponse.statusText}`);
    }

    try {
        return await reponse.json();
    } catch {
        throw new Error("the CoinGecko API response was not valid JSON");
    }
}

// Retourne le prix actuel d'une crypto dans une devise donnée.
export async function coinPrice({ coin, currency }) {
    const id = String(coin).toLowerCase().trim();
    const vs = String(currency).toLowerCase().trim() || "usd";

    const url = new URL(`${COINGECKO_API}/simple/price`);
    url.searchParams.set("ids", id);
    url.searchParams.set("vs_currencies", vs);
    url.searchParams.set("include_24hr_change", "true");
    url.searchParams.set("include_market_cap", "true");

    const donnees = await getJson(url);

    if (!donnees[id]) {
        throw new Error(`Cryptocurrency "${coin}" not found — check the CoinGecko ID (e.g. bitcoin, ethereum)`);
    }

    const data = donnees[id];
    return {
        coin: id,
        currency: vs.toUpperCase(),
        price: data[vs] ?? null,
        marketCap: data[`${vs}_market_cap`] ?? null,
        change24h: data[`${vs}_24h_change`] ?? null,
    };
}

// Retourne le classement des N premières cryptos par market cap.
export async function topCoins({ number }) {
    const n = Number(number);
    const count = Number.isFinite(n) && n > 0 ? Math.min(n, 25) : 10;

    const url = new URL(`${COINGECKO_API}/coins/markets`);
    url.searchParams.set("vs_currency", "usd");
    url.searchParams.set("order", "market_cap_desc");
    url.searchParams.set("per_page", String(count));
    url.searchParams.set("page", "1");
    url.searchParams.set("sparkline", "false");

    const donnees = await getJson(url);

    if (!Array.isArray(donnees)) {
        throw new Error("unexpected response format from CoinGecko markets API");
    }

    return donnees.map((coin, index) => ({
        rank: index + 1,
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol?.toUpperCase() ?? "???",
        price: coin.current_price ?? null,
        marketCap: coin.market_cap ?? null,
        change24h: coin.price_change_percentage_24h ?? null,
        image: coin.image ?? null,
    }));
}
