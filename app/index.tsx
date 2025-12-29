import { Redirect } from 'expo-router';
import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function EntryPoint() {
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsCoach(user.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim());
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Usamos 'as any' para saltar la validación de TypeScript que te da error
  return isCoach 
    ? <Redirect href={"/(admin)/coach" as any} /> 
    : <Redirect href={"/(client)/" as any} />;
}