import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAKoDK75yj6Bn_5mIP8cHwrHPFnKwk6brI',
  authDomain: 'trip-globe.firebaseapp.com',
  projectId: 'trip-globe',
  storageBucket: 'trip-globe.firebasestorage.app',
  messagingSenderId: '422147164148',
  appId: '1:422147164148:web:128ad6c3a6d99a55abdba1',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
