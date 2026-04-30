import { OrderService } from '../services/order-service.js';

const STYLES = `
  :host {
    display: block;
  }

  .picker-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    animation: fadeIn 0.15s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .picker-dialog {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    width: 90%;
    max-width: 360px;
    box-shadow: var(--shadow-float);
  }

  .picker-title {
    font-family: var(--font-serif);
    color: var(--color-brand-gold-light);
    font-size: 1.25rem;
    margin-bottom: var(--spacing-md);
    text-align: center;
  }

  .customer-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    max-height: 200px;
    overflow-y: auto;
    margin-bottom: var(--spacing-md);
  }

  .customer-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 10px var(--spacing-md);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    min-height: var(--touch-target-min);
    transition: border-color 0.15s ease, background 0.15s ease;
  }

  .customer-item:hover {
    border-color: var(--color-brand-gold);
    background: rgba(198, 137, 63, 0.08);
  }

  .customer-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-brand-gold);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  .customer-name {
    font-family: var(--font-sans);
    font-size: 0.95rem;
    color: var(--color-text);
    flex: 1;
  }

  .add-form {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  .add-input {
    flex: 1;
    padding: 10px var(--spacing-md);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.95rem;
    min-height: var(--touch-target-min);
    outline: none;
  }

  .add-input:focus {
    border-color: var(--color-brand-gold);
  }

  .add-input::placeholder {
    color: var(--color-text-muted);
  }

  .btn-add {
    background: var(--color-brand-gold);
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    padding: 10px 16px;
    font-family: var(--font-sans);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  .btn-add:hover {
    background: var(--color-brand-gold-light);
  }

  .btn-cancel {
    display: block;
    width: 100%;
    padding: 12px;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: 0.9rem;
    cursor: pointer;
    min-height: var(--touch-target-min);
  }

  .btn-cancel:hover {
    border-color: var(--color-text-muted);
    color: var(--color-text);
  }

  .empty-msg {
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: 0.85rem;
    text-align: center;
    padding: var(--spacing-sm);
    font-style: italic;
  }
`;

export class CustomerPicker extends HTMLElement {
  #cocktail = null;
  #customers = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  show(cocktail) {
    this.#cocktail = cocktail;
    this.#customers = OrderService.getCustomers();
    this.#render();
  }

  hide() {
    this.shadowRoot.innerHTML = '';
    this.#cocktail = null;
  }

  #render() {
    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <div class="picker-overlay">
        <div class="picker-dialog" role="dialog" aria-label="Select customer">
          <h3 class="picker-title">Select Customer</h3>
          <div class="add-form">
            <input class="add-input" type="text" placeholder="New customer name…" aria-label="Customer name" maxlength="30">
            <button class="btn-add" aria-label="Add customer">+ Add</button>
          </div>
          ${this.#customers.length > 0
            ? `<ul class="customer-list">
                ${this.#customers.map(c => `
                  <li class="customer-item" data-id="${c.id}">
                    <span class="customer-avatar">${this.#esc(c.name.charAt(0).toUpperCase())}</span>
                    <span class="customer-name">${this.#esc(c.name)}</span>
                  </li>
                `).join('')}
              </ul>`
            : `<p class="empty-msg">Add a customer name above to start</p>`
          }
          <button class="btn-cancel">Cancel</button>
        </div>
      </div>
    `;

    this.#setupListeners();
  }

  #setupListeners() {
    const overlay = this.shadowRoot.querySelector('.picker-overlay');
    const cancelBtn = this.shadowRoot.querySelector('.btn-cancel');
    const addBtn = this.shadowRoot.querySelector('.btn-add');
    const input = this.shadowRoot.querySelector('.add-input');

    // Cancel
    cancelBtn.addEventListener('click', () => this.hide());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hide();
    });

    // Add new customer and immediately place order
    addBtn.addEventListener('click', () => this.#addAndOrder(input));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.#addAndOrder(input);
      if (e.key === 'Escape') this.hide();
    });

    // Select existing customer
    this.shadowRoot.querySelectorAll('.customer-item').forEach(item => {
      item.addEventListener('click', () => {
        const customerId = item.dataset.id;
        const customer = this.#customers.find(c => c.id === customerId);
        if (customer && this.#cocktail) {
          OrderService.addOrder(this.#cocktail, customer);
          this.#emitOrdered();
          this.hide();
        }
      });
    });

    // Focus the input
    setTimeout(() => input.focus(), 50);
  }

  #addAndOrder(input) {
    const name = input.value.trim();
    if (!name) return;
    const customer = OrderService.addCustomer(name);
    if (this.#cocktail) {
      OrderService.addOrder(this.#cocktail, customer);
      this.#emitOrdered();
    }
    this.hide();
  }

  #emitOrdered() {
    this.dispatchEvent(new CustomEvent('order-placed', {
      bubbles: true,
      composed: true
    }));
  }

  #esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
}

customElements.define('gac-customer-picker', CustomerPicker);
