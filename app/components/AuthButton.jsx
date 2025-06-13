import React from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { Button, ActivityIndicator, Text } from 'react-native-paper';

export default function AuthButton({
  children,
  onPress,
  loading = false,
  disabled = false,
  mode = 'contained',
  style,
  icon,
  ...rest
}) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const buttonStyle = [
    styles.button,
    mode === 'contained' && styles.containedButton,
    mode === 'outlined' && styles.outlinedButton,
    mode === 'text' && styles.textButton,
    style,
  ];

  const isDisabled = disabled || loading;

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        isDisabled && styles.disabledContainer,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={buttonStyle}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          {loading ? (
            <ActivityIndicator 
              size="small" 
              color={mode === 'contained' ? '#ffffff' : '#f59e0b'} 
              style={styles.loadingIndicator}
            />
          ) : (
            icon && <Button.Icon icon={icon} size={20} />
          )}
          <Text 
            style={[
              styles.buttonText,
              mode === 'contained' && styles.containedButtonText,
              mode === 'outlined' && styles.outlinedButtonText,
              mode === 'text' && styles.textButtonText,
            ]}
          >
            {children}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    minHeight: 56,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  containedButton: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#000',
    shadowOpacity: 0.08,
  },
  textButton: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  containedButtonText: {
    color: '#ffffff',
  },
  outlinedButtonText: {
    color: '#f59e0b',
  },
  textButtonText: {
    color: '#f59e0b',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  disabledContainer: {
    opacity: 0.6,
  },
});