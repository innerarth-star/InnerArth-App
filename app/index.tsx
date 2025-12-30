import { Redirect } from 'expo-router';
import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const CORREO_COACH = "inner.arth@gmail.com";

  useEffect(() => {
    // Escuchamos el cambio de estado de Firebase
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("Usuario detectado:", u?.email); // Verás esto en tu terminal de VS Code
      setUser(u);
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

  // SI NO HAY USUARIO: Manda al login
  if (!user) {
    return <Redirect href={"/AuthScreen" as any} />;
  }

  // SI HAY USUARIO: Decidimos a dónde va
  const isCoach = user.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim();

  if (isCoach) {
    return <Redirect href={"/(admin)/coach" as any} />;
  } else {
    return <Redirect href={"/(client)" as any} />;
  }
}