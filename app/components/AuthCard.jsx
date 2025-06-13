import React from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { SvgXml } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function AuthCard({ 
  title, 
  subtitle, 
  illustration, 
  children,
  illustrationWidth = 180,
  illustrationHeight = 140 
}) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* Background Decoration */}
      <View style={styles.backgroundDecoration} />
      
      {illustration && (
        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationWrapper}>
            <SvgXml 
              xml={illustration} 
              width={illustrationWidth} 
              height={illustrationHeight} 
            />
          </View>
        </View>
      )}
      
      <Card style={styles.card} elevation={12}>
        <View style={styles.cardGradient}>
          <Card.Content style={styles.cardContent}>
            {title && (
              <Title style={styles.title}>{title}</Title>
            )}
            {subtitle && (
              <Paragraph style={styles.subtitle}>{subtitle}</Paragraph>
            )}
            <View style={styles.childrenContainer}>
              {children}
            </View>
          </Card.Content>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    zIndex: -1,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  illustrationWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#f59e0b',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.1)',
  },
  card: {
    borderRadius: 28,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.08)',
  },
  cardGradient: {
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.02)',
  },
  cardContent: {
    padding: 32,
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#6b7280',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  childrenContainer: {
    marginTop: 8,
  },
});