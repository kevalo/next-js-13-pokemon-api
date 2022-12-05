"use client"

import Image from "next/image";
import { useState, useEffect } from "react";
import styles from "./page.module.css";

const dataKey = "pokemons";

/**
 * Makes a request to the url received and return null if it's not a valid json object.
 * @param {String} url 
 * @returns {null|JSON} Endpoint result
 */
const callEndPoint = async (url) => {
    const r = await fetch(url, { cache: 'no-store' });
    if (r.status !== 200) {
        return null;
    }
    return r.json();
}

/**
 * Fetch the pokemon data from the pokemon api
 * @param {String} name 
 * @returns {null|json} object with the pokemon data
 */
const getPokemonData = async (name) => await callEndPoint(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);

/**
 * Get the pokemons list from localStorage
 * @returns {[]} the pokemons list
 */
const getPokemons = () => {
    const pokemons = localStorage.getItem(dataKey);
    if (pokemons) {
        return JSON.parse(pokemons);
    }
    return [];
}

/**
 * Add a pokemon to the localStorage list
 * @param {JSON} pokemon 
 */
const addPokemon = (pokemon) => {
    const pokemons = localStorage.getItem(dataKey);
    let list = [];
    if (pokemons) {
        list = JSON.parse(pokemons);
    }

    list.push(pokemon);
    localStorage.setItem(dataKey, JSON.stringify(list));
}

/**
 * Removes a pokemon and return the new list
 * @param {Number} index 
 * @returns {null|[]} new list
 */
const removePokemon = (index) => {
    let rawData = localStorage.getItem(dataKey);
    if (!rawData) {
        return null;
    }

    let list = JSON.parse(rawData);
    if (index > -1 && index < list.length) {
        list.splice(index, 1);
        localStorage.setItem(dataKey, JSON.stringify(list));
    }
    return list;
}

/**
 * Evolves a pokemon and return the new list
 * @param {Number} index 
 * @returns {null|[]} new list
 */
const evolvePokemon = async (index) => {
    let rawData = localStorage.getItem(dataKey);
    if (!rawData) {
        return null;
    }

    let list = JSON.parse(rawData);
    let evolution = null;

    if (index > -1 && index < list.length) {
        let pokemonData = list[index];

        const specieData = await callEndPoint(pokemonData.species.url);
        if (specieData) {
            let found = false;

            let evolutionChain = await callEndPoint(specieData.evolution_chain.url);

            if (evolutionChain.chain.evolves_to.length > 0) {

                let current = evolutionChain.chain;
                while (!found && current.evolves_to.length > 0) {

                    if (current.species.name === pokemonData.name) {
                        found = true;
                        evolution = await getPokemonData(current.evolves_to[0].species.name);
                    }
                    current = current.evolves_to[0];
                }
            }

            if (found && evolution) {
                list[index] = evolution;
                localStorage.setItem(dataKey, JSON.stringify(list));
            } else {
                return null;
            }
        }
    }
    return list;
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
                        <div className={styles.options}>
                            <button type="button" className={styles.evolve} onClick={async () => {
                                setLoading(true);
                                setError("");
                                const newList = await evolvePokemon(index);
                                if (newList) {
                                    setPokemons(newList);
                                    setError("");
                                } else {
                                    setError("Evolution not found!");
                                }
                                setLoading(false);
                            }}>Evolve</button>
                            <button type="button" className={styles.remove} onClick={() => {
                                const newList = removePokemon(index);
                                if (newList) {
                                    setPokemons(newList);
                                    setError("");
                                }
                            }}>Remove</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}