---
description: 'Use when creating or modifying Web Components, custom elements, or component templates. Covers Shadow DOM, lifecycle callbacks, event patterns, and the gac- prefix convention.'
applyTo: 'src/components/**/*.js'
---
# Web Component Standards

## Naming

- All custom elements use the `gac-` prefix: `<gac-search-bar>`, `<gac-recipe-card>`
- File names match element names without prefix: `search-bar.js` → `<gac-search-bar>`

## Structure

```js
export class SearchBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    // Clean up event listeners
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>/* component styles or @import */</style>
      <div class="container">...</div>
    `;
  }
}

customElements.define('gac-search-bar', SearchBar);
```

## Patterns

- Use Shadow DOM for style encapsulation
- Import shared CSS custom properties from `../../styles/theme.css` via `@import`
- Communicate upward via `CustomEvent` with `bubbles: true` and `composed: true`
- Accept data via properties (not attributes) for complex objects
- Use `observedAttributes` + `attributeChangedCallback` only for simple string/boolean attributes
- Keep templates in the component file using template literals
- No external template engines or JSX

## Events

```js
this.dispatchEvent(new CustomEvent('cocktail-selected', {
  detail: { cocktailId: 'margarita' },
  bubbles: true,
  composed: true
}));
```

## Accessibility

- All interactive elements must have `role` or semantic HTML equivalent
- Minimum touch target: 48x48px
- Support keyboard navigation (Tab, Enter, Escape)
- Use `aria-label` on icon-only buttons
