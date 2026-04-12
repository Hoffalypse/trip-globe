import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Text style={styles.heading}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? '—'}</Text>
      </View>

      <Pressable
        onPress={handleSignOut}
        style={({ pressed }) => [
          styles.signOutButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0d23', paddingHorizontal: 16 },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 16,
    color: '#fff',
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: '#1c1a36',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d2b50',
    marginBottom: 16,
  },
  label: { fontSize: 13, color: '#8b8fa3', marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '600', color: '#fff' },
  signOutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  signOutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
