import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface FavoriteToggleButtonProps {
  isFavorited: boolean;
  onToggle: (newStatus: boolean) => void;
  style?: ViewStyle; 
}

const FavoriteToggleButton: React.FC<FavoriteToggleButtonProps> = ({
  isFavorited,
  onToggle,
  style,
}) => {
  const [currentFavoritedStatus, setCurrentFavoritedStatus] = useState(isFavorited);

  useEffect(() => {
    setCurrentFavoritedStatus(isFavorited);
  }, [isFavorited]);

  const handlePress = () => {
    const newStatus = !currentFavoritedStatus;
    setCurrentFavoritedStatus(newStatus);
    onToggle(newStatus);
  };

  const iconName = currentFavoritedStatus ? 'heart' : 'heart-outline';
  const iconColor = currentFavoritedStatus ? 'red' : 'gray';

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.button, style]}
      activeOpacity={0.7}
    >
      <Icon name={iconName} size={30} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FavoriteToggleButton;