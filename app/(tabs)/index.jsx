import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { getColors } from "../../constants/Colors";

export default function Home() {
  const { userProfile } = useAuth();
  const { theme } = useSettings();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.white, borderBottomColor: colors.gray200 },
        ]}
      >
        <Text style={[styles.title, { color: colors.gray900 }]}>
          Beranda
        </Text>
        {userProfile && (
          <Text style={[styles.subtitle, { color: colors.gray600 }]}>
            Selamat datang, {userProfile.nama}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.welcomeText, { color: colors.gray700 }]}>
          Aplikasi sedang dalam tahap pengembangan
        </Text>
        <Text style={[styles.comingSoonText, { color: colors.primary }]}>
          Coming Soon...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
