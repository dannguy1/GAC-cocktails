import { OrderService } from '../services/order-service.js';

const STYLES = `
  :host {
    display: block;
  }

  .order-panel {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    max-height: 400px;
    overflow-y: auto;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-md);
  }

  .panel-title {
    font-family: var(--font-sans);
    font-weight: 600;
    color: var(--color-brand-gold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: var(--font-size-label);
  }

  .order-count {
    background: var(--color-brand-gold);
    color: #fff;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    min-width: 22px;
    height: 22px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
  }

  .customer-group {
    margin-bottom: var(--spacing-md);
  }

  .customer-group:last-child {
    margin-bottom: 0;
  }

  .customer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);
    padding-bottom: var(--spacing-xs);
    border-bottom: 1px solid var(--color-border);
  }

  .customer-name {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-family: var(--font-sans);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .customer-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-brand-gold);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.7rem;
    flex-shrink: 0;
  }

  .customer-total {
    font-family: var(--font-sans);
    font-size: 0.8rem;
    color: var(--color-brand-gold-light);
    font-weight: 600;
  }

  .btn-close-tab {
    background: var(--color-brand-green);
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    padding: 4px 10px;
    font-family: var(--font-sans);
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    min-height: 28px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-left: var(--spacing-sm);
  }

  .btn-close-tab:hover {
    background: var(--color-brand-green-dark);
  }

  .order-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .order-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 6px var(--spacing-md);
    gap: var(--spacing-sm);
  }

  .order-name {
    font-family: var(--font-sans);
    font-size: 0.85rem;
    color: var(--color-text);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .order-price {
    font-family: var(--font-sans);
    font-size: 0.8rem;
    color: var(--color-brand-gold-light);
    font-weight: 600;
    white-space: nowrap;
  }

  .order-time {
    font-family: var(--font-sans);
    font-size: 0.7rem;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .btn-remove {
    background: transparent;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 4px 8px;
    font-family: var(--font-sans);
    font-size: 0.7rem;
    cursor: pointer;
    min-height: 28px;
  }

  .btn-remove:hover {
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .empty-orders {
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: 0.9rem;
    text-align: center;
    padding: var(--spacing-md);
    font-style: italic;
  }

  .order-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border);
    font-family: var(--font-sans);
    font-weight: 600;
    color: var(--color-text);
  }

  .total-amount {
    color: var(--color-brand-gold-light);
    font-size: 1.1rem;
  }
`;

export class OrderPanel extends HTMLElement {
  #orders = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.#handleOrderUpdate = this.#handleOrderUpdate.bind(this);
  }

  connectedCallback() {
    this.#orders = OrderService.getActiveOrders();
    this.#render();
    document.addEventListener('order-updated', this.#handleOrderUpdate);
  }

  disconnectedCallback() {
    document.removeEventListener('order-updated', this.#handleOrderUpdate);
  }

  #handleOrderUpdate(e) {
    this.#orders = e.detail.orders;
    this.#render();
  }

  #formatTime(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  #groupByCustomer() {
    const groups = {};
    for (const order of this.#orders) {
      const key = order.customerId || '_unknown';
      if (!groups[key]) {
        groups[key] = {
          customerId: order.customerId,
          customerName: order.customerName || 'Unknown',
          orders: []
        };
      }
      groups[key].orders.push(order);
    }
    return Object.values(groups);
  }

  #render() {
    const total = this.#orders.reduce((sum, o) => sum + (o.price || 0), 0);
    const groups = this.#groupByCustomer();

    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <div class="order-panel">
        <div class="panel-header">
          <span class="panel-title">Orders</span>
          ${this.#orders.length ? `<span class="order-count">${this.#orders.length}</span>` : ''}
        </div>
        ${this.#orders.length === 0
          ? `<div class="empty-orders">No active orders</div>`
          : `
            ${groups.map(g => {
              const groupTotal = g.orders.reduce((s, o) => s + (o.price || 0), 0);
              return `
                <div class="customer-group">
                  <div class="customer-header">
                    <span class="customer-name">
                      <span class="customer-avatar">${this.#esc(g.customerName.charAt(0).toUpperCase())}</span>
                      ${this.#esc(g.customerName)}
                    </span>
                    <span>
                      ${groupTotal > 0 ? `<span class="customer-total">$${groupTotal.toFixed(2)}</span>` : ''}
                      <button class="btn-close-tab" data-customer-id="${g.customerId}" aria-label="Close tab for ${this.#esc(g.customerName)}">Close Tab</button>
                    </span>
                  </div>
                  <ul class="order-list">
                    ${g.orders.map(o => `
                      <li class="order-item" data-id="${o.id}">
                        <span class="order-name">${this.#esc(o.cocktailName)}</span>
                        ${o.price ? `<span class="order-price">$${o.price.toFixed(2)}</span>` : ''}
                        <span class="order-time">${this.#formatTime(o.timestamp)}</span>
                        <button class="btn-remove" data-id="${o.id}" aria-label="Remove ${this.#esc(o.cocktailName)}">✕</button>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              `;
            }).join('')}
            ${total > 0 ? `
              <div class="order-total">
                <span>Total (all)</span>
                <span class="total-amount">$${total.toFixed(2)}</span>
              </div>
            ` : ''}
          `
        }
      </div>
    `;

    // Close tab buttons — complete all orders for a customer
    this.shadowRoot.querySelectorAll('.btn-close-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const customerId = e.currentTarget.dataset.customerId;
        OrderService.completeCustomerOrders(customerId);
      });
    });

    // Remove individual order
    this.shadowRoot.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderId = e.currentTarget.dataset.id;
        OrderService.removeOrder(orderId);
      });
    });
  }

  #esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
}

customElements.define('gac-order-panel', OrderPanel);
