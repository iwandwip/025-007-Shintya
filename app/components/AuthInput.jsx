import React, { useState } from 'react';
import { TextInput, HelperText } from 'react-native-paper';
import { StyleSheet, Animated, View } from 'react-native';

export default function AuthInput({ 
  label, 
  value, 
  onChangeText, 
  icon,
  rightIcon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  helperText,
  ...rest 
}) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = React.useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(229, 231, 235, 1)', 'rgba(245, 158, 11, 1)'],
  });

  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(249, 250, 251, 1)', 'rgba(255, 255, 255, 1)'],
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor,
            shadowColor: isFocused ? '#f59e0b' : 'transparent',
          }
        ]}
      >
        <TextInput
          label={label}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          error={error}
          style={styles.input}
          contentStyle={styles.inputContent}
          outlineStyle={styles.inputOutline}
          left={icon && <TextInput.Icon icon={icon} iconColor={isFocused ? '#f59e0b' : '#9ca3af'} />}
          right={rightIcon}
          theme={{
            colors: {
              primary: '#f59e0b',
              outline: 'transparent',
              background: 'transparent',
            }
          }}
          {...rest}
        />
      </Animated.View>
      
      {(error || helperText) && (
        <HelperText 
          type={error ? 'error' : 'info'} 
          visible={!!(error || helperText)}
          style={styles.helperText}
        >
          {error || helperText}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputWrapper: {
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  inputContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputOutline: {
    borderWidth: 0,
  },
  helperText: {
    marginTop: 4,
    marginLeft: 16,
    fontSize: 14,
  },
});