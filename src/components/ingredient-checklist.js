const esc = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

const STYLES = `
  :host {
    display: block;
    width: 100%;
  }

  .ingredient-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    min-height: var(--touch-target-min);
    padding: var(--spacing-sm) 0;
    cursor: pointer;
    border-bottom: 1px solid var(--color-border);
    transition: opacity 0.2s ease;
  }

  .ingredient-row:last-child {
    border-bottom: none;
  }

  .checkbox {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-brand-gold);
    border-radius: var(--radius-sm);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .ingredient-row.checked .checkbox {
    background: var(--color-success);
    border-color: var(--color-success);
  }

  .checkbox-mark {
    display: none;
    color: #fff;
    font-size: 14px;
    line-height: 1;
    font-weight: 700;
  }

  .ingredient-row.checked .checkbox-mark {
    display: block;
  }

  .ingredient-text {
    font-family: var(--font-sans);
    font-size: var(--font-size-body);
    color: var(--color-text);
    transition: opacity 0.2s ease, text-decoration 0.2s ease;
  }

  .ingredient-row.checked .ingredient-text {
    opacity: 0.4;
    text-decoration: line-through;
  }
`;

export class IngredientChecklist extends HTMLElement {
  #ingredients = [];
  #cocktailId = '';
  #checked = new Set();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set ingredients(val) {
    this.#ingredients = val || [];
    this.#loadState();
    this.#render();
  }

  set cocktailId(val) {
    this.#cocktailId = val || '';
    this.#loadState();
    this.#render();
  }

  connectedCallback() {
    this.#render();
  }

  #storageKey() {
    return `checklist-${this.#cocktailId}`;
  }

  #loadState() {
    this.#checked = new Set();
    if (!this.#cocktailId) return;
    try {
      const saved = localStorage.getItem(this.#storageKey());
      if (saved) {
        const arr = JSON.parse(saved);
        this.#checked = new Set(arr);
      }
    } catch {
      // ignore
    }
  }

  #saveState() {
    if (!this.#cocktailId) return;
    try {
      localStorage.setItem(this.#storageKey(), JSON.stringify([...this.#checked]));
    } catch {
      // ignore
    }
  }

  #toggle(index) {
    if (this.#checked.has(index)) {
      this.#checked.delete(index);
    } else {
      this.#checked.add(index);
    }
    this.#saveState();
    this.#render();
  }

  #render() {
    if (!this.#ingredients.length) {
      this.shadowRoot.innerHTML = `<style>${STYLES}</style>`;
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      ${this.#ingredients.map((ing, i) => `
        <div class="ingredient-row ${this.#checked.has(i) ? 'checked' : ''}" data-index="${i}" role="checkbox" aria-checked="${this.#checked.has(i)}" tabindex="0">
          <div class="checkbox" aria-hidden="true">
            <span class="checkbox-mark">✓</span>
          </div>
          <span class="ingredient-text">${esc(ing.raw)}</span>
        </div>
      `).join('')}
    `;

    this.shadowRoot.querySelectorAll('.ingredient-row').forEach(row => {
      row.addEventListener('click', () => this.#toggle(parseInt(row.dataset.index, 10)));
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.#toggle(parseInt(row.dataset.index, 10));
        }
      });
    });
  }
}

customElements.define('gac-ingredient-checklist', IngredientChecklist);
