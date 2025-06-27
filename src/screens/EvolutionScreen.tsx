import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackActions } from '@react-navigation/native';

import CustomButton from '../components/CustomButton';
import Container from '../components/Container';
import BaseScreen from '../components/BaseScreen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Root } from '../../App';

interface EvolutionChainNode {
  species: { name: string; url: string };
  evolves_to: EvolutionChainNode[];
  evolution_details: any[];
}

interface EvolutionChainApi {
  chain: EvolutionChainNode;
  id: number;
}

interface EvolutionPokemon {
  name: string;
  id: number;
  imageUrl: string;
  isCurrent: boolean;
  canEvolve: boolean;
  evolutionDetails?: string;
  evolvesTo?: EvolutionPokemon[];
}

const FAVORITES_STORAGE_KEY = '@PokemonFavorites';

type EvolutionScreenProps = NativeStackScreenProps<Root, 'Evolution'>;

function EvolutionScreen({ route, navigation }: EvolutionScreenProps): React.JSX.Element {
    const {pokemonName, pokemonId} = route.params;
    const [evolutionChainData, setEvolutionChainData] = useState<EvolutionPokemon[]>([]);
    const [currentPokemonInChain, setCurrentPokemonInChain] = useState<EvolutionPokemon | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvolutionChainUrl = async (name: string): Promise<string | null> => {
        try {
        const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${name.toLowerCase()}/`);
        if (!speciesResponse.ok) {
            throw new Error(`Erro ${speciesResponse.status} ao buscar espécie de ${name}`);
        }
        const speciesData = await speciesResponse.json();
        return speciesData.evolution_chain?.url || null;
        } catch (e) {
        Alert.alert("Erro", `Erro ao obter URL da cadeia de evolução para ${name}:`);
        return null;
        }
    };

    const parseEvolutionChain = (
        chainNode: EvolutionChainNode,
        allPokemonEvolutions: EvolutionPokemon[] = [],
    ): EvolutionPokemon[] => {
        const currentSpeciesName = chainNode.species.name;
        const currentSpeciesId = parseInt(chainNode.species.url.split('/').slice(-2, -1)[0]);

        const evoDetails = chainNode.evolution_details
            .map(detail => {
                if (detail.min_level) return `Lv. ${detail.min_level}`;
                if (detail.item) return `Item: ${detail.item.name}`;
                if (detail.trigger) return `(${detail.trigger.name.replace(/-/g, ' ')})`;
                return null;
            })
            .filter(Boolean)
            .join(', ') || 'N/A';

        const pokemonInChain: EvolutionPokemon = {
        name: currentSpeciesName,
        id: currentSpeciesId,
        imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${currentSpeciesId}.png`,
        isCurrent: currentSpeciesId === pokemonId,
        canEvolve: chainNode.evolves_to.length > 0,
        evolutionDetails: evoDetails,
        };
        allPokemonEvolutions.push(pokemonInChain);

        pokemonInChain.evolvesTo = chainNode.evolves_to.map(nextEvolution => ({
            name: nextEvolution.species.name,
            id: parseInt(nextEvolution.species.url.split('/').slice(-2, -1)[0]),
            imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${parseInt(nextEvolution.species.url.split('/').slice(-2, -1)[0])}.png`,
            isCurrent: false,
            canEvolve: nextEvolution.evolves_to.length > 0,
            evolutionDetails: nextEvolution.evolution_details
                .map(detail => {
                    if (detail.min_level) return `Lv. ${detail.min_level}`;
                    if (detail.item) return `Item: ${detail.item.name}`;
                    if (detail.trigger) return `(${detail.trigger.name.replace(/-/g, ' ')})`;
                    return null;
                })
                .filter(Boolean)
                .join(', ') || 'N/A',
        }));

        chainNode.evolves_to.forEach(nextEvolution => {
            parseEvolutionChain(nextEvolution, allPokemonEvolutions);
        });

        return allPokemonEvolutions;
    };

    useEffect(() => {
        const fetchEvolutionData = async () => {
        try {
            setLoading(true);
            setError(null);

            const evolutionChainUrl = await fetchEvolutionChainUrl(pokemonName);
            if (!evolutionChainUrl) {
            throw new Error(`Cadeia de evolução não encontrada para ${pokemonName}.`);
            }

            const evolutionResponse = await fetch(evolutionChainUrl);
            if (!evolutionResponse.ok) {
            throw new Error(`Erro ${evolutionResponse.status} ao buscar cadeia de evolução.`);
            }
            const evolutionData: EvolutionChainApi = await evolutionResponse.json();

            const parsedChain = parseEvolutionChain(evolutionData.chain);

            const current = parsedChain.find(p => p.id === pokemonId);
            if (current) {
                setCurrentPokemonInChain(current);
            }

            setEvolutionChainData(parsedChain);

        } catch (e: any) {
            setError(e.message || "Não foi possível carregar a cadeia de evolução.");
        } finally {
            setLoading(false);
        }
        };

        fetchEvolutionData();
    }, [pokemonName, pokemonId]);

    const handleEvolvePokemon = async (originalPokemonId: number, evolvedPokemon: EvolutionPokemon) => {
        try {
        const storedFavoritesString = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        let favorites: { id: number; name: string; url: string }[] = storedFavoritesString ? JSON.parse(storedFavoritesString) : [];

        const originalPokemonIndex = favorites.findIndex(fav => fav.id === originalPokemonId);

        if (originalPokemonIndex !== -1) {
            favorites.splice(originalPokemonIndex, 1, {
                id: evolvedPokemon.id,
                name: evolvedPokemon.name,
                url: `https://pokeapi.co/api/v2/pokemon/${evolvedPokemon.name}/`
            });
            await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
            Alert.alert(
            "Evolução Concluída!",
            `${pokemonName.toUpperCase()} evoluiu para ${evolvedPokemon.name.toUpperCase()} e foi atualizado em seus favoritos!`
            );

            navigation.dispatch(StackActions.pop()); 

            navigation.dispatch(
                StackActions.replace('PokemonDetail', {
                    pokemonName: evolvedPokemon.name,
                    pokemonId: evolvedPokemon.id
                })
            )
        } else {
            Alert.alert(
            "Não Encontrado",
            `${pokemonName.toUpperCase()} não está nos seus favoritos para ser evoluído.`,
            );
        }
        } catch (e) {
        Alert.alert("Erro", "Não foi possível evoluir o Pokémon.");
        }
    };


    const handleBackPage = () => {
        navigation.goBack()
    };

    if (loading) {
        return (
            <BaseScreen>
                <Container title={`Carregando ${pokemonName}...`}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.statusText}>Buscando cadeia de evolução</Text>
                </Container>
            </BaseScreen>
        );
    }

    if (error) {
        return (
        <BaseScreen>
            <Container title="Erro!">
            <Text style={styles.errorText}>Erro: {error}</Text>
            <CustomButton
                title="Voltar"
                onPress={handleBackPage}
                buttonStyle={{ marginTop: 10, minWidth: 150 }}
            />
            </Container>
        </BaseScreen>
        );
    }

    return (
        <BaseScreen>
            <Container title={`Evolução de ${pokemonName.toUpperCase()}`}>
                {currentPokemonInChain && (
                <View style={styles.currentPokemonContainer}>
                    <Image source={{ uri: currentPokemonInChain.imageUrl }} style={styles.currentPokemonImage} />
                    <Text style={styles.currentPokemonName}>
                        {currentPokemonInChain.name.toUpperCase()} (Atual)
                    </Text>

                    {currentPokemonInChain.evolvesTo && currentPokemonInChain.evolvesTo.length > 0 && (
                        <>
                            <Text style={styles.evolvesToTitle}>Pode evoluir para:</Text>
                            <FlatList
                                data={currentPokemonInChain.evolvesTo}
                                keyExtractor={(item) => `evolvesTo-${item.id}`}
                                horizontal={true}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.evolvesToList}
                                renderItem={({ item: evolvedForm }) => (
                                    <View style={styles.evolvedFormCard}>
                                        <Image source={{ uri: evolvedForm.imageUrl }} style={styles.evolvedFormImage} />
                                        <Text style={styles.evolvedFormName}>{evolvedForm.name.toUpperCase()}</Text>
                                        <Text style={styles.evolutionCondition}>{evolvedForm.evolutionDetails}</Text>
                                        <CustomButton
                                            title={`Evoluir para ${evolvedForm.name.toUpperCase()}`}
                                            onPress={() => handleEvolvePokemon(pokemonId, evolvedForm)}
                                            buttonStyle={styles.evolveButton}
                                            textStyle={styles.evolveButtonText}
                                        />
                                    </View>
                                )}
                            />
                        </>
                    )}
                    
                    {!currentPokemonInChain.canEvolve && (
                        <Text style={styles.noMoreEvolutionText}>Este Pokémon não possui mais evoluções.</Text>
                    )}
                </View>
                )}
                <CustomButton
                title="Voltar"
                onPress={handleBackPage}
                buttonStyle={{ marginTop: 10, minWidth: 150}}
                />
            </Container>
        </BaseScreen>
    );
}

const styles = StyleSheet.create({
  statusText: {
    fontSize: 18,
    color: '#555',
    marginTop: 15,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginTop: 15,
    textAlign: 'center',
  },
  currentPokemonContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  currentPokemonImage: {
    width: 150, 
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  currentPokemonName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B4CCA',
    textTransform: 'capitalize',
    marginBottom: 5,
  },
  evolvesToTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  evolvesToList: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  evolvedFormCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 8,
    width: 150,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  evolvedFormImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 5,
  },
  evolvedFormName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
    textAlign: 'center',
    marginBottom: 5,
  },
  evolutionCondition: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    marginBottom: 10,
  },
  evolveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginTop: 5,
  },
  evolveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  },
  noMoreEvolutionText: {
    fontSize: 16,
    color: '#777',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default EvolutionScreen;