import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';

import CustomButton from '../components/CustomButton';
import Container from '../components/Container';
import BaseScreen from '../components/BaseScreen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Root } from '../../App';

interface PokemonDetailApi {
  name: string;
  id: number;
  height: number;
  weight: number;
  sprites: {
    front_default: string | null;
  };
  types: { slot: number; type: { name: string; url: string } }[];
  abilities: { ability: { name: string; url: string } }[];
  species: { name: string; url: string };
}

interface PokemonSpeciesApi {
    genera: { genus: string; language: { name: string; url: string } }[];
    flavor_text_entries: { flavor_text: string; language: { name: string; url: string } }[];
}

interface FormattedPokemonDetail {
    id: number;
    name: string;
    imageUri: string | null;
    height: number;
    weight: number; 
    category: string;
    types: string[]; 
    abilities: string[];
    description: string;
}

interface StoredFavoritePokemon {
    id: number;
    name: string;
    url: string;
}

const FAVORITES_STORAGE_KEY = '@PokemonFavorites';

type PokemonDetailScreenProps = NativeStackScreenProps<Root, 'PokemonDetail'>;

function PokemonDetailScreen({ route, navigation }: PokemonDetailScreenProps): React.JSX.Element {
    const { pokemonName : initialPokemonName, pokemonId} = route.params;
    const [pokemonData, setPokemonData] = useState<FormattedPokemonDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPokemonFavorited, setIsPokemonFavorited] = useState(false);

    const loadFavoriteStatus = async (id: number) => {
        try {
            const storedFavoritesString = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
            let favorites: StoredFavoritePokemon[] = storedFavoritesString ? JSON.parse(storedFavoritesString) : [];
            setIsPokemonFavorited(favorites.some(fav => fav.id === id));

        }catch(e){
            Alert.alert("Erro", "Erro ao carregar os favoritos");
        }
    }

    const saveFavoriteStatus = async (pokemonToToggle: StoredFavoritePokemon, newStatus: boolean) => {
        try {
            const storedFavoritesString = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
            let favorites: StoredFavoritePokemon[] = storedFavoritesString ? JSON.parse(storedFavoritesString) : [];
            
            if (newStatus && !favorites.some(fav => fav.id === pokemonToToggle.id)) {
                favorites.push(pokemonToToggle);
            }else if(!newStatus && favorites.some(fav => fav.id === pokemonToToggle.id)){
                favorites = favorites.filter(fav => fav.id !== pokemonToToggle.id)
            }

            await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
            
        } catch (e) {
            Alert.alert("Erro", "Erro ao carregar os favoritos")
        }
    }

    const fetchPokemonDetails = useCallback (async () => {
        try{
            setLoading(true);
            setError(null);

            const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
            if(!pokemonResponse.ok) {
                throw new Error(`Erro ${pokemonResponse.status} ao buscar ${pokemonId}`);
            }
            const pokemonDetail: PokemonDetailApi = await pokemonResponse.json();

            const speciesResponse = await fetch(pokemonDetail.species.url);
            if(!speciesResponse.ok){
                throw new Error(`Erro ${speciesResponse.status} ao buscar detalhes da espécie de ${pokemonDetail.name}`);
            }
            const speciesDetail: PokemonSpeciesApi = await speciesResponse.json();

            const categoryEntry = speciesDetail.genera.find(g => g.language.name === 'en');
            const category = categoryEntry ? categoryEntry.genus : 'N/A';

            const descriptionEntry = speciesDetail.flavor_text_entries.find(
                (entry) => entry.language.name === 'en'
            );
            const description = descriptionEntry ? descriptionEntry.flavor_text.replace(/\n|\f/g, ' ') : 'N/A';

            const formattedData: FormattedPokemonDetail = {
                id: pokemonDetail.id,
                name: pokemonDetail.name,
                imageUri: pokemonDetail.sprites.front_default,
                height: pokemonDetail.height / 10, 
                weight: pokemonDetail.weight / 10, 
                category: category,
                types: pokemonDetail.types.map(t => t.type.name.toUpperCase()),
                abilities: pokemonDetail.abilities.map(a => a.ability.name.replace(/-/g, ' ').toUpperCase()),
                description: description,
            };

            setPokemonData(formattedData);
            await loadFavoriteStatus(pokemonDetail.id)

        }catch (e: any){
            setError(e.message || "Erro ao carregar os dados.")
            setPokemonData(null);
        }finally{
            setLoading(false);
        }
    }, [pokemonId])

    useFocusEffect(
      useCallback(() => {
          fetchPokemonDetails();
          return () => {};
      }, [fetchPokemonDetails])
    );

    const handleBackPage = () => {
        navigation.goBack()
    };

    const handleFavoriteToggle = (newStatus: boolean) => {
        setIsPokemonFavorited(newStatus);
        if (pokemonData) {
            const pokemonToSave: StoredFavoritePokemon = {
                id: pokemonData.id,
                name: pokemonData.name,
                url: `https://pokeapi.co/api/v2/pokemon/${pokemonData.name}/`,
            };
            saveFavoriteStatus(pokemonToSave, newStatus);
            Alert.alert(
                'Favorito',
                `${pokemonData.name.toUpperCase()} foi ${newStatus ? 'adicionado aos' : 'removido dos'} favoritos!`
            )
        }
    };

    const handleViewEvolutions = () => {
        if (pokemonData) {
            navigation.navigate('Evolution' , {
                pokemonName: pokemonData.name,
                pokemonId: pokemonData.id
            });
        }
    };

    if (loading) {
    return (
        <BaseScreen>
            <Container title={`Carregando ${initialPokemonName}...`}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.statusText}>Buscando detalhes de {initialPokemonName}...</Text>
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
                title="Voltar para a Lista"
                onPress={handleBackPage}
                buttonStyle={{ marginTop: 10, minWidth: 150 }}
            />
            </Container>
        </BaseScreen>
        );
    }

    if (!pokemonData) {
        return (
        <BaseScreen >
            <Container title="Pokemon não encontrado!">
            <Text style={styles.errorText}>Não foi possível carregar os detalhes do Pokémon.</Text>
            <CustomButton
                title="Voltar para a Lista"
                onPress={handleBackPage}
                buttonStyle={{ marginTop: 10, minWidth: 150}}
            />
            </Container>
        </BaseScreen>
        );
    }

    return (
        <BaseScreen>
            <Container 
            title={pokemonData.name.toUpperCase()} 
            showFavoriteButton={true}
            isFavorited={isPokemonFavorited}
            onFavoriteToggle={handleFavoriteToggle}
            >
                <FlatList
                data={[pokemonData]}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => (
                    <View style={styles.detailsContent}>
                        {item.imageUri && (
                            <Image
                            style={styles.pokemonImage}
                            source={{ uri: item.imageUri }}
                            />
                        )}

                        <Text style={styles.detailText}>
                            <Text style={styles.detailInfoText}>Altura: </Text>
                            {item.height} m
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.detailInfoText}>Peso: </Text>
                            {item.weight} kg
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.detailInfoText}>Categoria: </Text>
                            {item.category}
                        </Text>

                        <Text style={styles.detailTitle}>Tipos:</Text>
                        <View style={styles.typeContainer}>
                            {item.types.map((type, index) => (
                            <View key={index} style={styles.typePill}>
                                <Text style={styles.typeText}>{type}</Text>
                            </View>
                            ))}
                        </View>

                        <Text style={styles.detailTitle}>Habilidades:</Text>
                        <View style={styles.abilityContainer}>
                            {item.abilities.map((ability, index) => (
                            <Text key={index} style={styles.abilityText}>
                                • {ability}
                            </Text>
                            ))}
                        </View>

                        {item.description && (
                            <View style={styles.descriptionBox}>
                                <Text style={styles.descriptionText}>
                                    <Text style={styles.detailInfoText}>Descrição: </Text>
                                    {item.description}
                                </Text>
                            </View>
                        )}

                        <CustomButton
                            title="Ver Evoluções"
                            onPress={handleViewEvolutions}
                            buttonStyle={{ marginTop: 30}}
                        />
                    </View>
                )}
                style={styles.detailsFlatList}
                contentContainerStyle={styles.detailsFlatListContent}
                ListFooterComponent={
                    <View style={styles.footerButtonContainer}>
                    <CustomButton
                        title="Voltar"
                        onPress={handleBackPage}
                        buttonStyle={{ marginTop: 10, minWidth: 150}}
                    />
                    </View>
                }
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
    detailsFlatList: {
        flex: 1,
        width: '100%',
    },
    detailsFlatListContent: { 
        alignItems: 'center',
        paddingVertical: 20,
    },
    detailsContent: {
        width: '100%',
        alignItems: 'center', 
    },
    pokemonImage: {
        width: 150, 
        height: 150,
        resizeMode: 'contain',
        marginBottom: 20,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    detailText: {
        fontSize: 18,
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    detailInfoText: {
        fontWeight: 600,
    },
    detailTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3B4CCA',
        marginTop: 15,
        marginBottom: 10,
        textAlign: 'center',
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 10,
    },
    typePill: {
        backgroundColor: '#FFDE00', 
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 12,
        margin: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    typeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        textTransform: 'uppercase',
    },
    abilityContainer: {
        width: '80%',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    abilityText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 5,
    },
    descriptionBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        padding: 15,
        marginTop: 20,
        marginHorizontal: 10,
        width: '90%',
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    descriptionText: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#444',
        textAlign: 'justify',
        lineHeight: 22,
    },
    footerButtonContainer: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 10,
    },
});

export default PokemonDetailScreen;