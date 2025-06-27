import React, {useState, useMemo, useCallback } from 'react';
import {
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Dimensions,
    TextInput,
    TouchableOpacity,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import CustomButton from '../components/CustomButton';
import Container from '../components/Container';
import BaseScreen from '../components/BaseScreen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Root } from '../../App';

const { width } = Dimensions.get('window')

interface PokemonResult {
    id: number;
    name: string;
    url: string;
}

const FAVORITES_STORAGE_KEY = '@PokemonFavorites';

type FavoriteScreenProps = NativeStackScreenProps<Root, 'Favorite'>;

function FavoriteScreen({ navigation }: FavoriteScreenProps): React.JSX.Element {
    const [pokemons, setPokemons] = useState<PokemonResult[]>([]);
    const [searchPokemon, setSearchPokemon] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFavorites = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const storedFavoritesString = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
            const favoriteIds: PokemonResult[] = storedFavoritesString ? JSON.parse(storedFavoritesString) : [];

            setPokemons(favoriteIds);


        } catch (e) {
            setError("Não foi possível carregar seus Pokemons favoritos.");
        } finally{
            setLoading(false)
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadFavorites();
            return () => {};
        }, [loadFavorites])
    );

    const filteredPokemons = useMemo(() => {
        if (!searchPokemon) {
            return pokemons;
        }
        const lowercasedSearchText = searchPokemon.toLowerCase();
        return pokemons.filter(pokemon =>
            pokemon.name.toLowerCase().includes(lowercasedSearchText)
        );
    }, [pokemons, searchPokemon]);

    const handleBackPage = () => {
        navigation.navigate('Home')
    };

    const handlePokemonPress = (pokemon: PokemonResult) => {
        navigation.navigate('PokemonDetail', { 
            pokemonName: pokemon.name,
            pokemonId: pokemon.id 
        });
    };

    if (loading) {
        return (
            <BaseScreen>
                <Container title="Carregando...">
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.statusText}>Carregando seus pokemons favoritos, por favor aguarde...</Text>
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
                        title="Tentar Novamente"
                        onPress={() => {
                            setLoading(true);
                            setError(null);
                            setTimeout(() => { 
                                setLoading(false);
                            }, 1000);
                        }}
                        buttonStyle={{ marginTop: 10, minWidth: 150 }}
                    />
                </Container>
            </BaseScreen>
        );
    }

    return (
        <BaseScreen>
        <Container title='Pokemons Favoritos'>
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar Pokémon por nome..."
                placeholderTextColor="#888"
                value={searchPokemon}
                onChangeText={setSearchPokemon}
            />
            <FlatList
                data={filteredPokemons}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.pokemonItem}
                        onPress={() => handlePokemonPress(item)}
                    >
                        <Text style={styles.pokemonName}>{item.name}</Text>
                    </TouchableOpacity>
                )}
                style={styles.pokemonList}
            />
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
    searchInput: {
        width: '90%',
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    pokemonList: {
        width: '100%',
        marginTop: 10,
        padding: 10,
        marginVertical: 5,
        minWidth: width * 0.75,
    },
    pokemonItem: {
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
        width: '100%',
        alignItems: 'center',
    },
    pokemonName: {
        fontSize: 16,
        color: '#333',
        textTransform: 'capitalize',
    },
});

export default FavoriteScreen;