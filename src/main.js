function getPokemon(pokemonID) {
    $.ajax({
        method: 'GET',
        url: `https://pokeapi.co/api/v2/pokemon/${pokemonID}`,
        success: (pokemon) => {
            createCard(pokemon);
        },
    });
}

[...Array(9).keys()].forEach((key) => {
    pokemonID = key + 1;
    getPokemon(pokemonID);

    // showCard();
    // getImage(pokemonID);
});

function createCard(pokemon) {
    getInfo(pokemon);
}

function getInfo(pokemon) {
    const ID = pokemon['id'];
    const name = pokemon['species']['name'];
    const height = pokemon['height'];
    const weight = pokemon['weight'];
    const type0 = pokemon['types']['0']['type']['name'];
    let type1 = '';
    if (pokemon['types']['1']) {
        type1 = pokemon['types']['1']['type']['name'];
    }
    const $container = $('.container');
    $container.append(
        `<div class='pokemon' id='${name}' > ${name} - #${ID} </br> ${type0} ${type1} </br> Height: ${height} </br> Weight: ${weight} </div>`
    );
    // getDescription(pokemon);
    // getType(pokemon);
    // getHeight(pokemon);
    // getWeight(pokemon);
    // getAbilities(pokemon);
    // getStats(pokemon);
}

arceus = {
    id: 493,
    species: {
        name: 'arceus',
    },
    stats: {
        0: {
            stat: {
                name: 'hp',
            },
            base_stat: 120,
        },
    },
    height: 32,
    weight: 3200,
    types: {
        0: {
            slot: 1,
            type: {
                name: 'normal',
            },
        },
    },
};
