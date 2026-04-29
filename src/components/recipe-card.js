import './ingredient-checklist.js';
import { OrderService } from '../services/order-service.js';

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

const STYLES = `
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }

  /* ── Empty State ───────────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-muted);
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 1.25rem;
    text-align: center;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
  }

  .empty-icon {
    font-size: 4rem;
    opacity: 0.3;
  }

  /* ── Split Layout ──────────────────────────────────── */
  .split-view {
    display: flex;
    flex-direction: row;
    height: 100%;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Left Panel — Image & Description ──────────────── */
  .panel-left {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }

  .drink-image-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    flex-shrink: 0;
    overflow: hidden;
  }

  .drink-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .drink-badge {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    background: var(--color-brand-gold);
    color: #fff;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .drink-info {
    padding: var(--spacing-lg);
    flex: 1;
  }

  .drink-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
  }

  .drink-name {
    font-family: var(--font-serif);
    color: var(--color-brand-gold-light);
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-weight: 600;
    line-height: 1.2;
  }

  .drink-price {
    font-family: var(--font-sans);
    color: var(--color-brand-gold-light);
    font-weight: 700;
    font-size: 1.1rem;
    white-space: nowrap;
    padding-top: 4px;
  }

  .gold-divider {
    width: 60px;
    height: 2px;
    background: var(--color-brand-gold);
    margin: var(--spacing-sm) 0 var(--spacing-md);
  }

  .meta-row {
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: var(--font-size-label);
    margin-bottom: var(--spacing-xs);
  }

  .meta-row strong {
    color: var(--color-text-muted);
  }

  .drink-description {
    font-family: var(--font-sans);
    font-size: 0.95rem;
    color: var(--color-text-muted);
    line-height: 1.6;
    margin-top: var(--spacing-md);
  }

  /* ── Right Panel — Ingredients & Instructions ──────── */
  .panel-right {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }

  .panel-section {
    padding: var(--spacing-lg);
  }

  .panel-section:not(:last-child) {
    border-bottom: 1px solid var(--color-border);
  }

  .section-header {
    font-family: var(--font-sans);
    font-weight: 600;
    color: var(--color-brand-gold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: var(--font-size-label);
    margin-bottom: var(--spacing-sm);
  }

  .instructions {
    font-family: var(--font-sans);
    font-size: var(--font-size-body);
    color: var(--color-text);
    line-height: 1.8;
  }

  /* ── Portrait / Small Screens ──────────────────────── */
  @media (max-width: 768px), (orientation: portrait) {
    .split-view {
      flex-direction: column;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y;
    }

    .panel-left {
      border-right: none;
      border-bottom: 1px solid var(--color-border);
      overflow-y: visible;
      -webkit-overflow-scrolling: auto;
    }

    .panel-right {
      overflow-y: visible;
      -webkit-overflow-scrolling: auto;
    }

    .drink-image-wrap {
      max-height: 280px;
    }
  }

  /* ── Order Button ──────────────────────────────────── */
  .btn-order {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: 14px var(--spacing-lg);
    margin-top: var(--spacing-md);
    background: var(--color-brand-gold);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    min-height: var(--touch-target-min);
    transition: background 0.15s ease, transform 0.1s ease;
  }

  .btn-order:hover {
    background: var(--color-brand-gold-light);
  }

  .btn-order:active {
    transform: scale(0.97);
  }

  .btn-order.ordered {
    background: var(--color-brand-green);
    pointer-events: none;
  }

  .btn-order-icon {
    font-size: 1.2rem;
  }
`;

export class RecipeCard extends HTMLElement {
  #cocktail = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.#render();
  }

  set cocktail(val) {
    this.#cocktail = val;
    this.#render();
  }

  get cocktail() {
    return this.#cocktail;
  }

  #render() {
    if (!this.#cocktail) {
      this.shadowRoot.innerHTML = `
        <style>${STYLES}</style>
        <div class="empty-state">
          <span class="empty-icon">🍸</span>
          <span>Search for a drink above</span>
        </div>
      `;
      return;
    }

    const c = this.#cocktail;
    const price = c.price ? `$${c.price.toFixed(2)}` : '';

    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <div class="split-view">
        <div class="panel-left">
          <div class="drink-image-wrap">
            <img class="drink-image" src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy">
            ${c.category ? `<span class="drink-badge">${esc(c.category)}</span>` : ''}
          </div>
          <div class="drink-info">
            <div class="drink-header">
              <h2 class="drink-name">${esc(c.name)}</h2>
              ${price ? `<span class="drink-price">${price}</span>` : ''}
            </div>
            <div class="gold-divider"></div>
            ${c.glass ? `<div class="meta-row"><strong>Glass:</strong> ${esc(c.glass)}</div>` : ''}
            ${c.garnish ? `<div class="meta-row"><strong>Garnish:</strong> ${esc(c.garnish)}</div>` : ''}
            ${c.description ? `<p class="drink-description">${esc(c.description)}</p>` : ''}
            <button class="btn-order" aria-label="Order ${esc(c.name)}">
              <span class="btn-order-icon">🛒</span> Order
            </button>
          </div>
        </div>

        <div class="panel-right">
          ${c.ingredients ? `
            <div class="panel-section">
              <div class="section-header">Ingredients</div>
              <gac-ingredient-checklist></gac-ingredient-checklist>
            </div>
          ` : ''}

          ${c.instructions ? `
            <div class="panel-section">
              <div class="section-header">Steps</div>
              <p class="instructions">${esc(c.instructions)}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    if (c.ingredients) {
      const checklist = this.shadowRoot.querySelector('gac-ingredient-checklist');
      checklist.cocktailId = c.id;
      checklist.ingredients = c.ingredients;
    }

    const orderBtn = this.shadowRoot.querySelector('.btn-order');
    if (orderBtn) {
      orderBtn.addEventListener('click', () => {
        OrderService.addOrder(c);
        orderBtn.classList.add('ordered');
        orderBtn.innerHTML = `<span class="btn-order-icon">✓</span> Ordered`;
        setTimeout(() => {
          orderBtn.classList.remove('ordered');
          orderBtn.innerHTML = `<span class="btn-order-icon">🛒</span> Order`;
        }, 2000);
      });
    }
  }
}

customElements.define('gac-recipe-card', RecipeCard);
