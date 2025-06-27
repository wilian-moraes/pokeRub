import React from 'react';
import {
  StyleSheet,
} from 'react-native';

import CustomButton from '../components/CustomButton';
import Container from '../components/Container';
import BaseScreen from '../components/BaseScreen';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Root } from '../../App'; 

type HomeScreenProps = NativeStackScreenProps<Root, 'Home'>;

function HomeScreen({ navigation }: HomeScreenProps): React.JSX.Element {
  const handleViewAllPress = () => {
    navigation.navigate('View');
  };

  const handleFavoritesPress = () => {
    navigation.navigate('Favorite');
  };

  return (
    <BaseScreen style={styles.boxAdjustment}>
      <Container title="Pokemons" style={styles.containerFlex}>
        <CustomButton
          title="Ver todos"
          onPress={handleViewAllPress}
          buttonStyle={{ marginTop: 10, minWidth: 150 }}
        />
        <CustomButton
          title="Favoritos"
          onPress={handleFavoritesPress}
          buttonStyle={{ marginTop: 15, minWidth: 150 }}
        />
      </Container>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  boxAdjustment: {
    marginBottom: 50,
  },
  containerFlex: {
    flex: 0
  },
})

export default HomeScreen;