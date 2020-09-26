function getPokemon(pokemonID) {
    $.ajax({
        method: 'GET',
        url: `https://pokeapi.co/api/v2/pokemon/${pokemonID}`,
        success: (pokemon) => {
            createCard(pokemon);
        },
    });
}

function createCard(pokemon) {
    getInfo(pokemon);
}

function getInfo(pokemon) {
    const id = pokemon['id'];
    const name = pokemon['species']['name'];
    // const height = pokemon['height'];
    // const weight = pokemon['weight'];
    const type1 = pokemon['types']['0']['type']['name'];
    let type2 = '';
    if (pokemon['types']['1']) {
        type2 = pokemon['types']['1']['type']['name'];
    }
    let imageID = '';
    if (id < 10) {
        imageID = `00${id}`;
    } else if (id < 100) {
        imageID = `0${id}`;
    } else {
        imageID = id;
    }

    const card = `
        <div class="card" id="${id}">
            <img
            src="https://assets.pokemon.com/assets/cms2/img/pokedex/full/${imageID}.png"
            alt=""
            style="width: 200px; height: 200px"
            />

            <div class="card-stats">
                <div class="types">
                    <div class="type ${type1}">${type1.toUpperCase()}</div>
                    <div class="type ${type2}"  id="${id}-type" >${type2.toUpperCase()}</div>
                </div>
            
                <div class="name">
                    <br>#${id}</br>${
        name.charAt(0).toUpperCase() + name.slice(1)
    }</h3>
                    
                </div>
            </div>
        </div>`;
    const cardObject = {
        cardID: id,
        cardHTML: card,
    };
    showCard(cardObject);
    hideType2(id, type2);
    return cardObject;
}

function showCard(cardObject) {
    const $container = $('.container');
    $container.append(cardObject['cardHTML']);
}

function hideType2(id, type2) {
    if (!type2) {
        $(`#${id}-type`).addClass('hidden');
    }
}

[...Array(9).keys()].forEach((key) => {
    pokemonID = key + 1;
    getPokemon(pokemonID);
});
