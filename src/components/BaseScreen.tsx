import React from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  SafeAreaView,
  Text,
  ImageBackground,
  ViewStyle,
} from 'react-native';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const backgroundImage = require('../../public/images/bg_main.png');

const Container: React.FC<ContainerProps> = ({
  children,
  style,
}) => {
    const isDarkMode = useColorScheme() === 'dark';
    

  return (
   <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerContainer}>
            <Text style={styles.mainText}>PokeRub</Text>
            <View style={styles.horizontalRule} />
          </View>
            <View style={[styles.innerContainer, style]}>
              {children}
            </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50, 
  },
  mainText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffde00',
    textShadowColor: '#3B4CCA',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  horizontalRule: {
    borderBottomColor: 'white',
    borderBottomWidth: 2,
    width: '100%',
    marginVertical: 10,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
    width: '100%',
  },
});

export default Container;