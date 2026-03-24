/**
 * Who's That Pokemon? Game Module
 */
import { getPokemon } from './api.js';

let currentPokemon = null;
let streak = 0;
let soundsEnabled = true;

const overlay = document.getElementById('game-overlay');
const img = document.getElementById('game-pokemon-img');
const input = document.getElementById('guess-input');
const feedback = document.getElementById('game-feedback');
const streakDisplay = document.getElementById('streak-val');

export function initGame(pokemonIndex) {
    document.getElementById('toggle-game').onclick = () => showGame(pokemonIndex);
    document.getElementById('exit-game').onclick = hideGame;
    document.getElementById('submit-guess').onclick = () => checkGuess();
    document.getElementById('skip-round').onclick = () => startRound(pokemonIndex);

    input.onkeypress = (e) => {
        if (e.key === 'Enter') checkGuess();
    };
}

function showGame(pokemonIndex) {
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    startRound(pokemonIndex);
}

function hideGame() {
    overlay.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

async function startRound(pokemonIndex) {
    feedback.textContent = '';
    feedback.className = 'game-feedback';
    input.value = '';
    input.disabled = false;
    img.classList.remove('revealed');

    // Pick a random pokemon from the first 898 (classic era +)
    // or just use the current index length
    const randomEntry = pokemonIndex[Math.floor(Math.random() * pokemonIndex.length)];

    try {
        currentPokemon = await getPokemon(randomEntry.id);
        const idStr = String(currentPokemon.id).padStart(3, '0');
        img.src = `https://assets.pokemon.com/assets/cms2/img/pokedex/full/${idStr}.png`;
        input.focus();
    } catch (e) {
        console.error("Game round start failed", e);
        startRound(pokemonIndex); // retry
    }
}

function checkGuess() {
    if (!currentPokemon || input.disabled) return;

    const guess = input.value.trim().toLowerCase();
    const actual = currentPokemon.name.toLowerCase();

    if (guess === actual) {
        reveal(true);
    } else {
        feedback.textContent = 'Incorrect name. Try again!';
        feedback.className = 'game-feedback feedback-wrong';
        input.value = '';
        input.focus();
    }
}

function reveal(correct) {
    input.disabled = true;
    img.classList.add('revealed');

    if (correct) {
        streak++;
        feedback.textContent = `Correct! It's ${currentPokemon.name.toUpperCase()}!`;
        feedback.className = 'game-feedback feedback-correct';

        // Play cry
        if (currentPokemon.cries?.latest) {
            new Audio(currentPokemon.cries.latest).play();
        }

        setTimeout(() => {
            streakDisplay.textContent = streak;
            // Provide a small delay before next round
            setTimeout(() => {
                // We'll pass the index back or use a closure. 
                // For simplicity, we'll trigger a "Next" state if needed.
                // But for now, just auto-restart after 2s
                startRound(window.pokemonIndex);
            }, 1000);
        }, 1500);
    } else {
        streak = 0;
        streakDisplay.textContent = streak;
        feedback.textContent = `It was ${currentPokemon.name.toUpperCase()}.`;
        feedback.className = 'game-feedback feedback-wrong';
    }
}
