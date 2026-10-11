const OPENLIBRARY_API = "https://openlibrary.org";
const REQUEST_TIMEOUT_MS = 10_000;

// Effectue un GET vers l'API Open Library et retourne le JSON, ou lève une erreur lisible.
async function getJson(url) {
    let reponse;
    try {
        reponse = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (err) {
        throw new Error(err.name === "TimeoutError" ? "request timed out" : err.message);
    }

    if (!reponse.ok) {
        throw new Error(`Open Library API error: HTTP ${reponse.status} ${reponse.statusText}`);
    }

    try {
        return await reponse.json();
    } catch {
        throw new Error("the Open Library API response was not valid JSON");
    }
}

// Retourne les informations du premier livre correspondant à un titre.
export async function bookInfo({ title }) {
    const query = String(title).trim();
    if (!query) throw new Error("'title' parameter must not be empty");

    const url = new URL(`${OPENLIBRARY_API}/search.json`);
    url.searchParams.set("title", query);
    url.searchParams.set("limit", "1");
    url.searchParams.set("fields", "title,author_name,first_publish_year,number_of_pages_median,cover_i,subject,edition_count");

    const donnees = await getJson(url);
    const book = donnees.docs?.[0];

    if (!book) {
        throw new Error(`No book found for title "${title}"`);
    }

    return {
        title: book.title ?? null,
        authors: book.author_name ?? [],
        firstPublished: book.first_publish_year ?? null,
        pages: book.number_of_pages_median ?? null,
        editions: book.edition_count ?? null,
        subjects: (book.subject ?? []).slice(0, 5),
        cover: book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : null,
    };
}

// Retourne la liste des N premiers livres d'un auteur.
export async function authorBooks({ author, number }) {
    const query = String(author).trim();
    if (!query) throw new Error("'author' parameter must not be empty");

    const n = Number(number);
    const count = Number.isFinite(n) && n > 0 ? Math.min(n, 20) : 5;

    const url = new URL(`${OPENLIBRARY_API}/search.json`);
    url.searchParams.set("author", query);
    url.searchParams.set("limit", String(count));
    url.searchParams.set("sort", "editions");
    url.searchParams.set("fields", "title,first_publish_year,cover_i,edition_count");

    const donnees = await getJson(url);

    if (!Array.isArray(donnees.docs) || donnees.docs.length === 0) {
        throw new Error(`No books found for author "${author}"`);
    }

    return {
        author: query,
        total: donnees.numFound ?? 0,
        books: donnees.docs.map((book) => ({
            title: book.title ?? null,
            firstPublished: book.first_publish_year ?? null,
            editions: book.edition_count ?? null,
            cover: book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`
                : null,
        })),
    };
}
