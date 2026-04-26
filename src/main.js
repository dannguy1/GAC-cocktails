import './components/search-bar.js';
import './components/recipe-card.js';
import './components/recent-strip.js';

const app = document.getElementById('app');

// Header bar with branding and search
const header = document.createElement('header');
header.className = 'app-header';
header.innerHTML = `
  <div class="app-brand">
    <span class="brand-icon">🍸</span>
    <h1 class="brand-title">GAC Bartender</h1>
  </div>
`;
const searchBar = document.createElement('gac-search-bar');
header.appendChild(searchBar);
app.appendChild(header);

// Main content area — split-screen recipe view
const content = document.createElement('div');
content.className = 'app-content';
const recipeCard = document.createElement('gac-recipe-card');
content.appendChild(recipeCard);
app.appendChild(content);

// Fixed footer with recent drinks
const footer = document.createElement('footer');
footer.className = 'app-footer';
const recentStrip = document.createElement('gac-recent-strip');
footer.appendChild(recentStrip);
app.appendChild(footer);

document.addEventListener('cocktail-selected', (e) => {
  const { cocktail } = e.detail;
  recipeCard.cocktail = cocktail;
  recentStrip.addRecent(cocktail.id);
});
