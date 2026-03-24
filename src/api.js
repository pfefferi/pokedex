/**
 * Layer 3: Execution - Data layer for PokeAPI interactions.
 */

const BASE_URL = 'https://pokeapi.co/api/v2';

export async function getPokemon(idOrName) {
    try {
        const response = await fetch(`${BASE_URL}/pokemon/${idOrName}`);
        if (!response.ok) throw new Error(`Pokemon ${idOrName} not found`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching pokemon:', error);
        return null;
    }
}

export async function getPokemonSpecies(idOrName) {
    try {
        const response = await fetch(`${BASE_URL}/pokemon-species/${idOrName}`);
        if (!response.ok) throw new Error(`Species for ${idOrName} not found`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching pokemon species:', error);
        return null;
    }
}

export async function getAllPokemonNames() {
    try {
        // Fetch up to 1302 pokemon (current total) to get all names/IDs
        const response = await fetch(`${BASE_URL}/pokemon?limit=1500`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching all pokemon names:', error);
        return [];
    }
}

export async function getTypes() {
    const response = await fetch(`${BASE_URL}/type`);
    const data = await response.json();
    return data.results;
}

export async function getGenerations() {
    const response = await fetch(`${BASE_URL}/generation`);
    const data = await response.json();
    return data.results;
}

export async function getColors() {
    const response = await fetch(`${BASE_URL}/pokemon-color`);
    const data = await response.json();
    return data.results;
}

export async function getDataByUrl(url) {
    const response = await fetch(url);
    return await response.json();
}

export async function getPokemonList(limit = 12, offset = 0) {
    try {
        const response = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
        const data = await response.json();

        // Fetch full details for each pokemon in the list
        const details = await Promise.all(
            data.results.map(p => getPokemon(p.name))
        );

        return details.filter(p => p !== null);
    } catch (error) {
        console.error('Error fetching pokemon list:', error);
        return [];
    }
}
