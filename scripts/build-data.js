import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DATA_DIR = path.resolve(ROOT, process.env.COCKTAIL_DATA_DIR || '../GAC-Menu/cocktails');

function loadAliases() {
  const aliasPath = path.join(DATA_DIR, 'aliases.json');
  if (!fs.existsSync(aliasPath)) {
    console.warn('WARNING: aliases.json not found, no search aliases will be set');
    return {};
  }
  const aliases = JSON.parse(fs.readFileSync(aliasPath, 'utf-8'));
  console.log(`✓ Loaded aliases for ${Object.keys(aliases).length} cocktails`);
  return aliases;
}

function validateDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`ERROR: COCKTAIL_DATA_DIR not found: ${DATA_DIR}`);
    process.exit(1);
  }
  const required = ['cocktail_menu.json', 'recipes', 'images'];
  for (const item of required) {
    if (!fs.existsSync(path.join(DATA_DIR, item))) {
      console.error(`ERROR: Missing required item in data dir: ${item}`);
      process.exit(1);
    }
  }
}

function loadMenu() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'cocktail_menu.json'), 'utf-8');
  const data = JSON.parse(raw);
  const items = data.items || data;

  // Deduplicate by item_name — keep first occurrence
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    if (!seen.has(item.item_name)) {
      seen.add(item.item_name);
      deduped.push(item);
    }
  }

  console.log(`✓ Loaded ${deduped.length} unique cocktails from menu`);

  return deduped;
}

function parseRecipe(name) {
  const filename = name.replace(/ /g, '_') + '.md';
  const filepath = path.join(DATA_DIR, 'recipes', filename);

  if (!fs.existsSync(filepath)) {
    console.warn(`WARNING: Recipe not found for "${name}" (expected ${filename})`);
    return { ingredients: null, instructions: null, glass: null, garnish: null };
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');

  let section = null;
  const ingredientLines = [];
  const instructionLines = [];
  let glass = null;
  let garnish = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '## Ingredients') { section = 'ingredients'; continue; }
    if (trimmed === '## Instructions') { section = 'instructions'; continue; }
    if (trimmed === '## Serving') { section = 'serving'; continue; }
    if (trimmed.startsWith('## ')) { section = null; continue; }

    if (section === 'ingredients' && trimmed.startsWith('- ')) {
      ingredientLines.push({ raw: trimmed.slice(2) });
    } else if (section === 'instructions' && trimmed) {
      instructionLines.push(trimmed);
    } else if (section === 'serving') {
      const servingLine = trimmed.startsWith('- ') ? trimmed.slice(2) : trimmed;
      const glassMatch = servingLine.match(/^\*\*Glass:\*\*\s*(.+)/);
      const garnishMatch = servingLine.match(/^\*\*Garnish:\*\*\s*(.+)/);
      if (glassMatch) glass = glassMatch[1].trim();
      if (garnishMatch) garnish = garnishMatch[1].trim();
    }
  }

  return {
    ingredients: ingredientLines.length ? ingredientLines : null,
    instructions: instructionLines.length ? instructionLines.join(' ') : null,
    glass,
    garnish,
  };
}

function toId(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function buildCocktails(items, aliases) {
  return items.map(item => {
    const name = item.item_name;
    const recipe = parseRecipe(name);
    const imageName = path.basename(item.image_path);

    return {
      id: toId(name),
      name,
      price: item.price,
      description: item.description || '',
      image: `/images/${imageName}`,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      glass: recipe.glass,
      garnish: recipe.garnish,
      aliases: aliases[name] || [],
      category: item.category || '',
    };
  });
}

function copyImages() {
  const srcDir = path.join(DATA_DIR, 'images');
  const destDir = path.join(ROOT, 'public', 'images');
  fs.mkdirSync(destDir, { recursive: true });

  const files = fs.readdirSync(srcDir);
  let count = 0;
  for (const file of files) {
    if (file.toLowerCase() === 'readme.md') continue;
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    count++;
  }
  console.log(`✓ Copied ${count} image files to public/images/`);
}

function writeOutput(cocktails) {
  const outDir = path.join(ROOT, 'src', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'cocktails.js');
  const json = JSON.stringify(cocktails, null, 2);
  fs.writeFileSync(outPath, `export default ${json};\n`, 'utf-8');
  console.log(`✓ Wrote ${cocktails.length} cocktails to src/data/cocktails.js`);
}

// Main
validateDataDir();
const aliases = loadAliases();
const items = loadMenu();
const cocktails = buildCocktails(items, aliases);
copyImages();
writeOutput(cocktails);
console.log('✓ Build complete');
