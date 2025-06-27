import React, {useState, useEffect, useMemo } from 'react';
import {
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Dimensions,
    TextInput,
    TouchableOpacity,
} from 'react-native';

import CustomButton from '../components/CustomButton';
import Container from '../components/Container';
import BaseScreen from '../components/BaseScreen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Root } from '../../App';

const { width } = Dimensions.get('window')

interface PokemonResult {
    name: string;
    url: string;
    id?: number;
}

interface PokemonApiResponse {
    results: PokemonResult[];
}

type ViewScreenProps = NativeStackScreenProps<Root, 'View'>;

function ViewScreen({ navigation }: ViewScreenProps): React.JSX.Element {
    const [pokemons, setPokemons] = useState<PokemonResult[]>([]);
    const [searchPokemon, setSearchPokemon] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPokemons = async () => {
            try {
                const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1500');
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}`);
                }
                const data: PokemonApiResponse = await response.json();
                setPokemons(data.results)

            } catch (e: any) {
                setError(e.message || "Erro ao carregar os pokemons.")
            } finally {
                setLoading(false);
            }
        }

        fetchPokemons();
    }, []);

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
        const pokemonId = pokemon.id || parseInt(pokemon.url.split('/').slice(-2, -1)[0]);
        navigation.navigate('PokemonDetail', {
            pokemonName: pokemon.name,
            pokemonId: pokemonId
        });
    };

    if (loading) {
        return (
            <BaseScreen>
                <Container title="Carregando...">
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.statusText}>Carregando os dados, por favor aguarde...</Text>
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
                        buttonStyle={{ marginTop: 10 }}
                    />
                </Container>
            </BaseScreen>
        );
    }

    return (
        <BaseScreen>
        <Container title='Todos os pokemons'>
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

export default ViewScreen;