/**
 * Layer 1/3: UI Logic - Handles DOM manipulation and distinctive aesthetics.
 */

export function createCard(pokemon, onClick) {
    const id = String(pokemon.id).padStart(3, '0');
    const name = pokemon.name;
    const types = pokemon.types.map(t => t.type.name);

    const card = document.createElement('div');
    card.className = 'card';
    card.id = `pokemon-${id}`;
    card.innerHTML = `
        <div class="card-inner">
            <div class="scanline"></div>
            <div class="image-container">
                <img src="https://assets.pokemon.com/assets/cms2/img/pokedex/full/${id}.png" alt="${name}" loading="lazy">
            </div>
            <div class="card-stats">
                <div class="types">
                    ${types.map(type => `<span class="type ${type}">${type}</span>`).join('')}
                </div>
                <div class="name">
                    <span class="id">#${id}</span>
                    <h3>${name}</h3>
                </div>
            </div>
            <div class="glitch-overlay"></div>
        </div>
    `;

    if (onClick) {
        card.addEventListener('click', () => onClick(pokemon));
    }

    return card;
}

export function renderPokemon(container, pokemonList, onClick, append = true) {
    if (!append) container.innerHTML = '';

    pokemonList.forEach(pokemon => {
        const card = createCard(pokemon, onClick);
        container.appendChild(card);
    });
}

export function showDetailModal(pokemon, species) {
    const id = String(pokemon.id).padStart(3, '0');
    const name = pokemon.name;
    const description = species?.flavor_text_entries.find(e => e.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || 'No description available.';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-button">X</button>
            <div class="modal-left">
                <img src="https://assets.pokemon.com/assets/cms2/img/pokedex/full/${id}.png" alt="${name}">
                <div class="types">
                    ${pokemon.types.map(t => `<span class="type ${t.type.name}">${t.type.name.toUpperCase()}</span>`).join('')}
                </div>
                ${pokemon.cries?.latest ? `
                    <button class="cry-button" onclick="new Audio('${pokemon.cries.latest}').play()">
                        <span class="icon">🔊</span> Play Cry
                    </button>
                ` : ''}
            </div>
            <div class="modal-right">
                <div class="modal-header">
                    <h2>${name}</h2>
                    <span class="modal-id">#${id}</span>
                </div>
                
                <p class="description">${description}</p>
                
                <div class="modal-info-grid">
                    <div class="info-item">
                        <label>Height</label>
                        <span>${pokemon.height / 10} m</span>
                    </div>
                    <div class="info-item">
                        <label>Weight</label>
                        <span>${pokemon.weight / 10} kg</span>
                    </div>
                    <div class="info-item">
                        <label>Ability 1</label>
                        <span style="text-transform: capitalize;">${pokemon.abilities[0]?.ability.name || 'None'}</span>
                    </div>
                    <div class="info-item">
                        <label>Ability 2</label>
                        <span style="text-transform: capitalize;">${pokemon.abilities[1]?.ability.name || 'None'}</span>
                    </div>
                </div>
                
                <div class="modal-stats-grid">
                    ${pokemon.stats.map(s => `
                        <div class="stat-row">
                            <div class="stat-label">
                                <span>${s.stat.name.replace('-', ' ')}</span>
                                <span>${s.base_stat}</span>
                            </div>
                            <div class="stat-bar-container">
                                <div class="stat-bar" data-value="${(s.base_stat / 255) * 100}"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Animate bars
    setTimeout(() => {
        modal.querySelectorAll('.stat-bar').forEach(bar => {
            bar.style.width = bar.dataset.value + '%';
        });
    }, 100);

    // Close events
    const close = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.close-button').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };
}

export function toggleLoading(show) {
    const loader = document.querySelector('.loading');
    if (loader) loader.classList.toggle('hidden', !show);
}
