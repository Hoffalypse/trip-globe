import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Text style={styles.heading}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.muted}>
          Sign-in and account sync will be added when Firebase is wired up.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  heading: { fontSize: 28, fontWeight: '700', marginTop: 16, marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  muted: { color: '#64748b', lineHeight: 20 },
});
