import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import ViewScreen from './src/screens/ViewScreen';
import EvolutionScreen from './src/screens/EvolutionScreen';
import FavoriteScreen from './src/screens/FavoriteScreen';
import PokemonDetailScreen from './src/screens/PokemonDetailScreen';

const Stack = createNativeStackNavigator<Root>();

export type Root = {
  Home: undefined;
  View: undefined;
  Evolution: {pokemonName: string, pokemonId: number };
  Favorite: undefined;
  PokemonDetail: {pokemonName: string; pokemonId: number }
};

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="View"
          component={ViewScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Evolution"
          component={EvolutionScreen}
          options={({ route }) => ({ title: `Evolução de ${route.params.pokemonName.toUpperCase()}`, headerShown: false })}
        />
        <Stack.Screen
          name="Favorite"
          component={FavoriteScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PokemonDetail"
          component={PokemonDetailScreen}
          options={({ route }) => ({ title: route.params.pokemonName.toUpperCase(), headerShown: false })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;