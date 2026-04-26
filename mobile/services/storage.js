import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_KEY = 'recent-drinks';
const CHECKLIST_PREFIX = 'checklist-';
const HOST_KEY = 'web-host';
const MAX_RECENT = 8;

// Default: the Vite preview/dev server on the local network
let webHost = 'http://192.168.10.3:8510';

export function getWebHost() {
    return webHost;
}

export async function loadWebHost() {
    try {
        const saved = await AsyncStorage.getItem(HOST_KEY);
        if (saved) webHost = saved;
    } catch { /* ignore */ }
    return webHost;
}

export async function saveWebHost(host) {
    webHost = host;
    try {
        await AsyncStorage.setItem(HOST_KEY, host);
    } catch { /* ignore */ }
}

/**
 * Resolve an image path (e.g. "/images/Foo.jpg") to a full URL
 * by prepending the web host.
 */
export function resolveImageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${webHost}${path}`;
}

export async function loadRecentDrinks() {
    try {
        const saved = await AsyncStorage.getItem(RECENT_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

export async function saveRecentDrink(cocktailId, currentRecents) {
    const updated = [cocktailId, ...currentRecents.filter(id => id !== cocktailId)].slice(0, MAX_RECENT);
    try {
        await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch { /* ignore */ }
    return updated;
}

export async function loadChecklist(cocktailId) {
    try {
        const saved = await AsyncStorage.getItem(CHECKLIST_PREFIX + cocktailId);
        return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
        return new Set();
    }
}

export async function saveChecklist(cocktailId, checkedSet) {
    try {
        await AsyncStorage.setItem(CHECKLIST_PREFIX + cocktailId, JSON.stringify([...checkedSet]));
    } catch { /* ignore */ }
}
