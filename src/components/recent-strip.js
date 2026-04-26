import cocktails from '../data/cocktails.js';

const STORAGE_KEY = 'recent-drinks';
const MAX_RECENT = 5;

const cocktailMap = new Map(cocktails.map(c => [c.id, c]));

const STYLES = `
  :host {
    display: block;
    width: 100%;
  }

  .strip-label {
    font-family: var(--font-sans);
    font-size: var(--font-size-label);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: var(--spacing-sm) var(--spacing-sm) 0;
  }

  .strip {
    display: flex;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .strip::-webkit-scrollbar {
    height: 4px;
  }

  .strip::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 10px;
  }

  .strip-card {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 6px;
    background: var(--color-surface);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    width: 88px;
    -webkit-tap-highlight-color: transparent;
  }

  .strip-card:hover,
  .strip-card:focus {
    border-color: var(--color-brand-gold);
    box-shadow: 0 0 0 2px rgba(198, 137, 63, 0.3);
    outline: none;
  }

  .strip-card img {
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: var(--radius-md);
    display: block;
  }

  .strip-card-name {
    font-family: var(--font-sans);
    font-size: var(--font-size-label);
    color: var(--color-text-muted);
    text-align: center;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
  }

  .empty {
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: var(--font-size-label);
    padding: var(--spacing-sm);
    text-align: center;
    font-style: italic;
  }
`;

export class RecentStrip extends HTMLElement {
  #recentIds = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.#loadFromStorage();
    this.#render();
  }

  addRecent(cocktailId) {
    this.#recentIds = [cocktailId, ...this.#recentIds.filter(id => id !== cocktailId)].slice(0, MAX_RECENT);
    this.#saveToStorage();
    this.#render();
  }

  #loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.#recentIds = saved ? JSON.parse(saved) : [];
    } catch {
      this.#recentIds = [];
    }
  }

  #saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#recentIds));
    } catch {
      // ignore
    }
  }

  #render() {
    const recents = this.#recentIds.map(id => cocktailMap.get(id)).filter(Boolean);

    this.shadowRoot.innerHTML = `<style>${STYLES}</style>`;

    if (recents.length === 0) return;

    const label = document.createElement('div');
    label.className = 'strip-label';
    label.textContent = 'Recent';
    this.shadowRoot.appendChild(label);

    const strip = document.createElement('div');
    strip.className = 'strip';
    strip.setAttribute('role', 'list');

    for (const c of recents) {
      const imageSrc = c.image;
      const card = document.createElement('div');
      card.className = 'strip-card';
      card.setAttribute('role', 'listitem');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', c.name);
      card.innerHTML = `
        <img src="${imageSrc}" alt="${c.name}" loading="lazy">
        <span class="strip-card-name">${c.name}</span>
      `;
      card.addEventListener('click', () => this.#select(c));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.#select(c);
        }
      });
      strip.appendChild(card);
    }

    this.shadowRoot.appendChild(strip);
  }

  #select(cocktail) {
    this.dispatchEvent(new CustomEvent('cocktail-selected', {
      detail: { cocktail },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('gac-recent-strip', RecentStrip);
