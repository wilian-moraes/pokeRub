import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
} from 'react-native';

import FavoriteToggleButton from './FavoriteToggleButton';

const { height } = Dimensions.get('window')

interface ContainerProps {
  title: string;
  style?: ViewStyle;
  children: React.ReactNode;
  showFavoriteButton?: boolean;
  isFavorited?: boolean;
  onFavoriteToggle?: (newStatus: boolean) => void;
}

const Container: React.FC<ContainerProps> = ({
  title,
  style,
  children,
  showFavoriteButton = false,
  isFavorited = false,
  onFavoriteToggle,
}) => {
  return (
    <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.containerTitle, style]}>{title}</Text>
          {showFavoriteButton && onFavoriteToggle && (
            <FavoriteToggleButton
              isFavorited={isFavorited}
              onToggle={onFavoriteToggle}
              style={styles.favoriteButton}
            />
          )}
        </View>
        {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#efffff',
    padding: 25,
    margin: 20,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: height * 0.8,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', 
  },
  containerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B4CCA',
    paddingBottom: 15,
    textAlign: 'center',
    flex: 1,
  },
  favoriteButton: {
    bottom: 6,
    position: 'absolute',
    right: 0
  },
});

export default Container;