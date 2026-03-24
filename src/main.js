/**
 * Layer 2: Orchestration - Main application logic.
 */

import {
    getPokemonList,
    getPokemon,
    getPokemonSpecies,
    getAllPokemonNames,
    getTypes,
    getGenerations,
    getColors,
    getDataByUrl
} from './api.js';
import { renderPokemon, showDetailModal, toggleLoading } from './ui.js';
import { initGame } from './game.js';

let offset = 0;
const LIMIT = 12;
let isLoading = false;
let isFilterMode = false;

// Search & Filter State
let pokemonIndex = [];
let currentFilteredList = [];
let filterOffset = 0;
const FILTER_LIMIT = 48;
let filterMaps = {
    types: {},
    generations: {},
    colors: {}
};

let activeFilters = {
    query: '',
    types: [],
    generations: [],
    color: null,
    stats: {
        type: 'hp', // hp, attack, defense, special-attack, special-defense, speed
        operator: '>=', // >=, <=, ===
        value: 0
    },
    sortBy: 'id' // id, name, hp, attack, defense, sp-attack, sp-defense, speed
};

function initThemes() {
    const dots = document.querySelectorAll('.theme-dot');
    const body = document.body;

    // Load saved theme
    const savedTheme = localStorage.getItem('pokedex-theme') || 'cyber-cyan';
    applyTheme(savedTheme);

    dots.forEach(dot => {
        dot.onclick = () => {
            const theme = dot.dataset.theme;
            applyTheme(theme);
        };
    });

    function applyTheme(theme) {
        // Remove all possible theme classes
        body.classList.remove('theme-cyber-cyan', 'theme-rocket-red', 'theme-leaf-green', 'theme-electric-yellow');

        // Add the new theme class
        body.classList.add(`theme-${theme}`);

        dots.forEach(d => {
            d.classList.toggle('active', d.dataset.theme === theme);
        });

        localStorage.setItem('pokedex-theme', theme);
    }
}

const container = document.querySelector('.container');

async function handleCardClick(pokemon) {
    try {
        toggleLoading(true);
        const species = await getPokemonSpecies(pokemon.id);
        showDetailModal(pokemon, species);
    } catch (error) {
        console.error('Failed to open pokemon details:', error);
    } finally {
        toggleLoading(false);
    }
}

async function loadMore() {
    if (isLoading || isFilterMode) return;
    isLoading = true;
    toggleLoading(true);

    const pokemonList = await getPokemonList(LIMIT, offset);
    renderPokemon(container, pokemonList, handleCardClick);

    offset += LIMIT;
    isLoading = false;
    toggleLoading(false);
}

// Roman numeral helper
function romanize(num) {
    const lookup = { m: 1000, cm: 900, d: 500, cd: 400, c: 100, xc: 90, l: 50, xl: 40, x: 10, ix: 9, v: 5, iv: 4, i: 1 };
    let roman = '';
    for (let i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman.toUpperCase();
}

// Advanced Indexing
async function initIndex() {
    toggleLoading(true);

    // 1. Basic Name/ID Index
    const allPokemon = await getAllPokemonNames();
    pokemonIndex = allPokemon.map(p => {
        const id = parseInt(p.url.split('/').filter(Boolean).pop());
        return { name: p.name, id, stats: {} };
    });

    // 2. Fetch Category Mappings and parallel Stat fetching
    // NOTE: Fetching ALL stats (1000+) can be slow. 
    // We'll fetch them in batches to not overwhelm the API.
    const [types, gens, colors] = await Promise.all([getTypes(), getGenerations(), getColors()]);

    // Background stat fetching (optional: only fetch when stat filter is used, 
    // but for "instant" feel we'll start fetching now)
    fetchStatsInBackground();

    // Process mappings
    await Promise.all([
        ...types.map(async t => {
            const data = await getDataByUrl(t.url);
            filterMaps.types[t.name] = new Set(data.pokemon.map(p => parseInt(p.pokemon.url.split('/').filter(Boolean).pop())));
        }),
        ...gens.map(async g => {
            const data = await getDataByUrl(g.url);
            filterMaps.generations[g.name] = new Set(data.pokemon_species.map(p => parseInt(p.url.split('/').filter(Boolean).pop())));
        }),
        ...colors.map(async c => {
            const data = await getDataByUrl(c.url);
            filterMaps.colors[c.name] = new Set(data.pokemon_species.map(p => parseInt(p.url.split('/').filter(Boolean).pop())));
        })
    ]);

    renderFilterUI(types, gens, colors);
    window.pokemonIndex = pokemonIndex;
    toggleLoading(false);
}

async function fetchStatsInBackground() {
    const batchSize = 50;
    for (let i = 0; i < pokemonIndex.length; i += batchSize) {
        const batch = pokemonIndex.slice(i, i + batchSize);
        await Promise.all(batch.map(async p => {
            try {
                const data = await getPokemon(p.id);
                if (data) {
                    data.stats.forEach(s => {
                        p.stats[s.stat.name] = s.base_stat;
                    });
                }
            } catch (e) { console.error(`Failed to fetch stats for ${p.id}`); }
        }));
    }
}

function renderFilterUI(types, gens, colors) {
    const filterHud = document.querySelector('.filter-hud');
    if (!filterHud) return;

    filterHud.innerHTML = `
        <div class="filter-group">
            <label>Filter by Type (Max 2)</label>
            <div class="filter-options">
                ${types.map(t => `<button class="filter-chip" data-category="types" data-value="${t.name}">${t.name}</button>`).join('')}
            </div>
        </div>
        
        <div class="filter-row">
            <div class="filter-group">
                <label>Generation</label>
                <div class="gen-container">
                    ${gens.sort((a, b) => {
        const numA = parseInt(a.name.split('-').pop());
        const numB = parseInt(b.name.split('-').pop());
        return numA - numB;
    }).map((g, index) => `
                        <button class="gen-circle" data-value="${g.name}">
                            ${romanize(index + 1)}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="filter-group">
                <label>Sort By</label>
                <select id="sort-select">
                    <option value="id">ID (Ascending)</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="hp">HP</option>
                    <option value="attack">Attack</option>
                    <option value="defense">Defense</option>
                    <option value="special-attack">Sp. Attack</option>
                    <option value="special-defense">Sp. Defense</option>
                    <option value="speed">Speed</option>
                </select>
            </div>
        </div>

        <div class="filter-group">
            <label>Advanced Stat Filter</label>
            <div class="stat-filter-row">
                <select id="stat-type">
                    <option value="hp">HP</option>
                    <option value="attack">Attack</option>
                    <option value="defense">Defense</option>
                    <option value="special-attack">Sp. Attack</option>
                    <option value="special-defense">Sp. Defense</option>
                    <option value="speed">Speed</option>
                </select>
                <select id="stat-operator">
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                    <option value="===">=</option>
                </select>
                <div class="stat-slider-container">
                    <input type="range" id="stat-range" min="0" max="255" value="0">
                    <span class="stat-value" id="stat-val-display">0</span>
                </div>
            </div>
        </div>

        <div class="filter-group">
            <label>Color</label>
            <select id="color-select">
                <option value="">All Colors</option>
                ${colors.map(c => `<option value="${c.name}">${c.name.charAt(0).toUpperCase() + c.name.slice(1)}</option>`).join('')}
            </select>
        </div>
    `;

    // ... listeners (existing ones and new ones)
    setupFilterListeners(filterHud);
}

function setupFilterListeners(filterHud) {
    // Type chips listeners (restored)
    filterHud.querySelectorAll('.filter-chip').forEach(btn => {
        btn.onclick = () => {
            const val = btn.dataset.value;
            if (activeFilters.types.includes(val)) {
                activeFilters.types = activeFilters.types.filter(t => t !== val);
                btn.classList.remove('active');
            } else if (activeFilters.types.length < 2) {
                activeFilters.types.push(val);
                btn.classList.add('active');
            }
            applyFilters();
        };
    });

    // Generation circles listeners (restored)
    filterHud.querySelectorAll('.gen-circle').forEach(btn => {
        btn.onclick = () => {
            const val = btn.dataset.value;
            if (activeFilters.generations.includes(val)) {
                activeFilters.generations = activeFilters.generations.filter(g => g !== val);
                btn.classList.remove('active');
            } else {
                activeFilters.generations.push(val);
                btn.classList.add('active');
            }
            applyFilters();
        };
    });

    document.getElementById('color-select').onchange = (e) => {
        activeFilters.color = e.target.value || null;
        applyFilters();
    };

    // New listeners for stats and sorting
    document.getElementById('sort-select').onchange = (e) => {
        activeFilters.sortBy = e.target.value;
        applyFilters();
    };

    document.getElementById('stat-type').onchange = (e) => {
        activeFilters.stats.type = e.target.value;
        applyFilters();
    };

    document.getElementById('stat-operator').onchange = (e) => {
        activeFilters.stats.operator = e.target.value;
        applyFilters();
    };

    const statRange = document.getElementById('stat-range');
    const statValDisplay = document.getElementById('stat-val-display');
    statRange.oninput = (e) => {
        const val = parseInt(e.target.value);
        statValDisplay.textContent = val;
        activeFilters.stats.value = val;
        applyFilters();
    };
}

async function applyFilters() {
    const { query, types, generations, color, stats, sortBy } = activeFilters;

    // Check if we have enough stat data for filtering if used
    const usingStats = stats.value > 0;

    if (!query && types.length === 0 && generations.length === 0 && !color && !usingStats && sortBy === 'id') {
        isFilterMode = false;
        offset = 0;
        container.innerHTML = '';
        loadMore();
        return;
    }

    isFilterMode = true;
    toggleLoading(true);

    // Initial Filter by name search
    let filteredList = pokemonIndex.filter(p => p.name.includes(query));

    // Filter by Types
    if (types.length > 0) {
        types.forEach(type => {
            const typeSet = filterMaps.types[type];
            filteredList = filteredList.filter(p => typeSet.has(p.id));
        });
    }

    // Filter by Generations
    if (generations.length > 0) {
        const combinedGenSet = new Set();
        generations.forEach(gen => {
            filterMaps.generations[gen].forEach(id => combinedGenSet.add(id));
        });
        filteredList = filteredList.filter(p => combinedGenSet.has(p.id));
    }

    // Filter by Color
    if (color) {
        const colorSet = filterMaps.colors[color];
        filteredList = filteredList.filter(p => colorSet.has(p.id));
    }

    // Filter by Stats
    if (usingStats) {
        filteredList = filteredList.filter(p => {
            const val = p.stats[stats.type] || 0;
            switch (stats.operator) {
                case '>=': return val >= stats.value;
                case '<=': return val <= stats.value;
                case '===': return val === stats.value;
                default: return true;
            }
        });
    }

    // Sort Results
    filteredList.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'id') return a.id - b.id;

        // Stat sorting (Descending by default for stats)
        const valA = a.stats[sortBy] || 0;
        const valB = b.stats[sortBy] || 0;
        return valB - valA;
    });

    currentFilteredList = filteredList;
    filterOffset = 0;
    container.innerHTML = '';
    
    await loadMoreFiltered();
}

async function loadMoreFiltered() {
    if (isLoading) return;
    isLoading = true;
    toggleLoading(true);

    const results = currentFilteredList.slice(filterOffset, filterOffset + FILTER_LIMIT);
    if (results.length > 0) {
        const pokemonData = await Promise.all(results.map(p => getPokemon(p.id)));
        // Append results
        renderPokemon(container, pokemonData.filter(Boolean), handleCardClick, true);
        filterOffset += FILTER_LIMIT;
    } else if (filterOffset === 0) {
        container.innerHTML = `<div class="info-message">No results found matching your criteria.</div>`;
    }

    isLoading = false;
    toggleLoading(false);
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Event Listeners for search and search toggle
const searchInput = document.getElementById('pokemon-search');
if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
        activeFilters.query = e.target.value.trim().toLowerCase();
        applyFilters();
    }, 300));
}

const toggleBtn = document.getElementById('toggle-filter');
const filterHud = document.querySelector('.filter-hud');
if (toggleBtn && filterHud) {
    // Hidden by default
    filterHud.classList.add('hidden');

    toggleBtn.addEventListener('click', () => {
        const isHidden = filterHud.classList.toggle('hidden');
        toggleBtn.textContent = isHidden ? 'Advanced Filters' : 'Hide Filters';
        toggleBtn.classList.toggle('active', !isHidden);
    });
}

const setupInfiniteScroll = () => {
    const sentinel = document.createElement('div');
    sentinel.id = 'infinite-scroll-sentinel';
    sentinel.style.height = '10px';
    document.body.appendChild(sentinel);

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading) {
            if (isFilterMode) {
                loadMoreFiltered();
            } else {
                loadMore();
            }
        }
    }, {
        rootMargin: '400px'
    });

    observer.observe(sentinel);
};

window.onload = async () => {
    initThemes();
    await initIndex();
    initGame(pokemonIndex);
    loadMore();
    setupInfiniteScroll();
};
