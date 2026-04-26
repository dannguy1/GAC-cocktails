import Fuse from 'fuse.js';
import cocktails from '../data/cocktails.js';

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

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

const STYLES = `
  :host {
    display: block;
    position: relative;
    width: 100%;
  }

  .search-wrapper {
    position: relative;
    width: 100%;
  }

  input {
    width: 100%;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 1rem;
    padding: 10px var(--spacing-md);
    outline: none;
    transition: border-color 0.2s ease;
    min-height: var(--touch-target-min);
  }

  input::placeholder {
    color: var(--color-text-muted);
  }

  input:focus {
    border-color: var(--color-brand-gold);
  }

  .results {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: var(--color-surface);
    border: 1px solid var(--color-brand-gold);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    z-index: 100;
    overflow: hidden;
  }

  .results.hidden {
    display: none;
  }

  .result-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 0 var(--spacing-md);
    min-height: var(--touch-target-min);
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .result-item:not(:last-child) {
    border-bottom: 1px solid var(--color-border);
  }

  .result-item.highlighted,
  .result-item:hover {
    background: rgba(198, 137, 63, 0.1);
    border-left-color: var(--color-brand-gold);
  }

  .result-item img {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }

  .result-name {
    font-family: var(--font-sans);
    font-size: var(--font-size-body);
    color: var(--color-text);
  }

  .no-results {
    padding: var(--spacing-md);
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: var(--font-size-body);
    text-align: center;
  }
`;

export class SearchBar extends HTMLElement {
  #debounceTimer = null;
  #results = [];
  #highlightedIndex = 0;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.#setupListeners();
    this.shadowRoot.querySelector('input').focus();
  }

  disconnectedCallback() {
    clearTimeout(this.#debounceTimer);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <div class="search-wrapper">
        <input
          type="search"
          placeholder="Search drinks..."
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label="Search cocktails"
          aria-autocomplete="list"
          aria-expanded="false"
        >
        <div class="results hidden" role="listbox" aria-label="Search results"></div>
      </div>
    `;
  }

  #setupListeners() {
    const input = this.shadowRoot.querySelector('input');
    const results = this.shadowRoot.querySelector('.results');

    input.addEventListener('input', () => {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = setTimeout(() => this.#search(input.value.trim()), 100);
    });

    input.addEventListener('keydown', (e) => {
      if (this.#results.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.#highlightedIndex = Math.min(this.#highlightedIndex + 1, this.#results.length - 1);
        this.#updateHighlight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.#highlightedIndex = Math.max(this.#highlightedIndex - 1, 0);
        this.#updateHighlight();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.#selectResult(this.#results[this.#highlightedIndex]);
      } else if (e.key === 'Escape') {
        this.#clearResults();
        input.blur();
      }
    });

    results.addEventListener('click', (e) => {
      const item = e.target.closest('.result-item');
      if (!item) return;
      const idx = parseInt(item.dataset.index, 10);
      this.#selectResult(this.#results[idx]);
    });

    document.addEventListener('click', (e) => {
      if (!this.contains(e.target) && !this.shadowRoot.contains(e.target)) {
        this.#clearResults();
      }
    });
  }

  #search(query) {
    const input = this.shadowRoot.querySelector('input');
    const resultsEl = this.shadowRoot.querySelector('.results');

    if (!query) {
      this.#clearResults();
      return;
    }

    const found = fuse.search(query, { limit: 5 });
    this.#results = found.map(r => r.item);
    this.#highlightedIndex = 0;

    if (this.#results.length === 0) {
      resultsEl.innerHTML = `<div class="no-results">No matches found</div>`;
      resultsEl.classList.remove('hidden');
      input.setAttribute('aria-expanded', 'true');
      return;
    }

    resultsEl.innerHTML = this.#results.map((c, i) => `
      <div class="result-item ${i === 0 ? 'highlighted' : ''}" data-index="${i}" role="option">
        <img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy">
        <span class="result-name">${esc(c.name)}</span>
      </div>
    `).join('');

    resultsEl.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
  }

  #updateHighlight() {
    const items = this.shadowRoot.querySelectorAll('.result-item');
    items.forEach((el, i) => {
      el.classList.toggle('highlighted', i === this.#highlightedIndex);
    });
  }

  #selectResult(cocktail) {
    if (!cocktail) return;
    this.#clearResults();
    this.shadowRoot.querySelector('input').value = '';
    this.dispatchEvent(new CustomEvent('cocktail-selected', {
      detail: { cocktail },
      bubbles: true,
      composed: true,
    }));
  }

  #clearResults() {
    const input = this.shadowRoot.querySelector('input');
    const resultsEl = this.shadowRoot.querySelector('.results');
    this.#results = [];
    resultsEl.classList.add('hidden');
    resultsEl.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
  }
}

customElements.define('gac-search-bar', SearchBar);
