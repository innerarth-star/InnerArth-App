import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor rellena todos los campos.");
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        // Crear Usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Crear perfil base en Firestore
        await setDoc(doc(db, "usuarios", userCredential.user.uid), {
          email: email,
          rol: 'cliente',
          createdAt: new Date()
        });
      } else {
        // Iniciar Sesión
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      let mensaje = "Ocurrió un error.";
      if (error.code === 'auth/email-already-in-use') mensaje = "El correo ya está registrado.";
      if (error.code === 'auth/wrong-password') mensaje = "Contraseña incorrecta.";
      if (error.code === 'auth/user-not-found') mensaje = "No existe cuenta con este correo.";
      Alert.alert("Atención", mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <FontAwesome5 name="fire-alt" size={40} color="#3b82f6" />
        </View>
        <Text style={styles.title}>FitTech</Text>
        <Text style={styles.subtitle}>{isRegister ? 'Crea tu cuenta de atleta' : 'Bienvenido de nuevo'}</Text>

        <TextInput 
          style={styles.input} 
          placeholder="Correo electrónico" 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput 
          style={styles.input} 
          placeholder="Contraseña" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />

        <TouchableOpacity style={styles.btnPrimary} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isRegister ? 'REGISTRARME' : 'ENTRAR'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.switchBtn}>
          <Text style={styles.switchTxt}>
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿Eres nuevo? Crea una cuenta aquí'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 25, padding: 30, alignItems: 'center', elevation: 5 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 30 },
  input: { width: '100%', backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
  btnPrimary: { width: '100%', backgroundColor: '#3b82f6', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchBtn: { marginTop: 25 },
  switchTxt: { color: '#3b82f6', fontWeight: 'bold', fontSize: 14 }
});