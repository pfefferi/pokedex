let cardsArray = [];
let currentLast = 12;

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
    let id = pokemon['id'];
    const name = pokemon['species']['name'];
    // const height = pokemon['height'];
    // const weight = pokemon['weight'];
    const type1 = pokemon['types']['0']['type']['name'];
    let type2 = '';
    if (pokemon['types']['1']) {
        type2 = pokemon['types']['1']['type']['name'];
    }
    if (id < 10) {
        id = `00${id}`;
    } else if (id < 100) {
        id = `0${id}`;
    } else {
    }

    const card = `
        <div class="card" id="${id}">
            <img
            src="https://assets.pokemon.com/assets/cms2/img/pokedex/full/${id}.png"
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
        type2: type2,
    };
    cardsArray.push(cardObject);
}

function showCard(cardObject) {
    const $container = $('.container');
    $container.append(cardObject['cardHTML']);
    if (!cardObject['type2']) {
        $(`#${cardObject['cardID']}-type`).addClass('hidden');
    }
}

function hideType2(id, type2) {
    if (!type2) {
        $(`#${id}-type`).addClass('hidden');
    }
}

function sortArray(array) {
    array.sort((first, second) => {
        const firstID = first['cardID'];
        const secondID = second['cardID'];
        if (firstID < secondID) return -1;
        if (firstID > secondID) return 1;
        return 0;
    });
}

function showCards(array) {
    array.forEach((card) => {
        showCard(card);
    });
}

function createArray(start, end) {
    return Array(end - start + 1)
        .fill()
        .map((_, i) => start + i);
}

const $button = $('.button');
$button.on('click', () => {
    sortArray(cardsArray);
    showCards(cardsArray);
    cardsArray = [];
    loadRemainingPokemon();
});

///////////////////////////////////////////////////////////////////////////////////

function loadFirstPokemon() {
    [...Array(12).keys()].forEach((key) => {
        pokemonID = key + 1;
        getPokemon(pokemonID);
    });
}

function loadRemainingPokemon() {
    let currentArray = createArray(currentLast + 1, currentLast + 12);
    currentArray.forEach((key) => {
        pokemonID = key + 1;
        getPokemon(pokemonID);
    });
    currentLast = currentLast + 12;
    // setTimeout(pokemonArray, 3000);
}

window.onload = () => {
    $('.loading').removeClass('hidden');
    loadFirstPokemon();
    setTimeout(() => {
        $('.loading').addClass('hidden');
        sortArray(cardsArray);
        showCards(cardsArray);
        cardsArray = [];
        loadRemainingPokemon();
    }, 3000);
    setTimeout(() => {
        $button.removeClass('hidden');
    }, 3100);
};
