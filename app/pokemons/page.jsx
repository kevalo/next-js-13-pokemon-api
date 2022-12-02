"use client"

import Image from "next/image";
import { useState, useEffect } from "react";
import styles from "./page.module.css";

/**
 * Fetch the pokemon data from the pokemon api
 * @param {String} name 
 * @returns {null|json} object with the pokemon data
 */
async function getPokemonData(name) {
    const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`, { cache: 'no-store' });

    if (r.status !== 200) {
        return null;
    }
    return r.json();
}

/**
 * Get the pokemons list from localStorage
 * @returns {[]} the pokemons list
 */
function getPokemons() {
    const pokemons = localStorage.getItem('pokemons');
    if (pokemons) {
        return JSON.parse(pokemons);
    }
    return [];
}

/**
 * Add a pokemon to the localStorage list
 * @param {JSON} pokemon 
 */
function addPokemon(pokemon) {
    const pokemons = localStorage.getItem('pokemons');
    let list = [];
    if (pokemons) {
        list = JSON.parse(pokemons);
    }

    list.push(pokemon);
    localStorage.setItem('pokemons', JSON.stringify(list));
}



export default function Page() {

    const [pokemonName, setName] = useState("");
    const [pokemons, setPokemons] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => setPokemons(getPokemons()), []);

    const findPokemon = async (e) => {
        e.preventDefault();
        if (pokemonName.length === 0) {
            setError("Type a pokemon name");
            return;
        }
        setLoading(true);
        setError("");
        const pokemonData = await getPokemonData(pokemonName);
        if (pokemonData) {
            setPokemons([...pokemons, pokemonData]);
            addPokemon(pokemonData);
            setError("");
        } else {
            setError(`The pokemon ${pokemonName} was not found!`);
        }
        setLoading(false);
    }

    return (
        <div className={styles.page}>
            <form onSubmit={async (e) => findPokemon(e)}>
                <label htmlFor="pokemon">Add a new pokemon: </label>
                <input className={styles.input} type="text" name="pokemon" id="pokemon" placeholder="pokemon name" onKeyUp={(e) => { setName(e.target.value) }} />
                <button className={styles.add} type="submit" >Add</button>

                {loading && <span className={styles.loading}>Searching pokemon...</span>}
                {error.length > 0 && <span className={styles.error}>{error}</span>}

            </form>

            <div className={styles.list}>
                {pokemons.map((pk, index) => (
                    <div key={`${index}-·${pk.id}`} className={styles.pokemon}>
                        <div className={styles.picture}>
                            <h3 className={styles.name}>{pk.name}</h3>
                            <Image className={styles.image} src={pk.sprites.other.dream_world.front_default} width={169} height={169} alt={`Image of the pokemon ${pk.name}`} />
                        </div>
                        <ul className={styles.stats}>
                            {pk.stats.map((st, i) => (
                                <li key={`pk-${pk.id}-stat-${i}`}>{st.stat.name}: {st.base_stat}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}