import Fuse from 'fuse.js';
import cocktails from '../data';

const fuse = new Fuse(cocktails, {
    keys: [
        { name: 'name', weight: 1.0 },
        { name: 'aliases', weight: 0.8 },
        { name: 'ingredients.raw', weight: 0.3 },
    ],
    threshold: 0.5,
    includeScore: true,
    minMatchCharLength: 1,
});

export function searchCocktails(query, limit = 8) {
    if (!query || !query.trim()) return [];
    return fuse.search(query.trim(), { limit }).map(r => r.item);
}

export function getCocktailById(id) {
    return cocktails.find(c => c.id === id) || null;
}

export function getAllCocktails() {
    return cocktails;
}
