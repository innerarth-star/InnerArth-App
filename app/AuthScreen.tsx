import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification 
} from 'firebase/auth';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  // FUNCIÓN PARA LOGIN
  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor llena todos los campos.");
      return;
    }
    setLoading(true);
    try {
      if (isRegistering) {
        // REGISTRO
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        // ENVIAR VERIFICACIÓN DE EMAIL AL REGISTRARSE
        await sendEmailVerification(userCredential.user);
        Alert.alert(
          "Verifica tu correo", 
          "Hemos enviado un enlace a tu email. Por favor verifícalo para poder entrar."
        );
        setIsRegistering(false);
      } else {
        // LOGIN
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        
        // VALIDAR SI EL CORREO EXISTE Y ESTÁ VERIFICADO
        if (!userCredential.user.emailVerified) {
          Alert.alert(
            "Correo no verificado", 
            "Por favor revisa tu bandeja de entrada y verifica tu cuenta antes de entrar."
          );
          // Opcional: reenviar correo si no lo ha verificado
          // await sendEmailVerification(userCredential.user);
        }
      }
    } catch (error: any) {
      let mensaje = "Ocurrió un error.";
      if (error.code === 'auth/user-not-found') mensaje = "El correo no está registrado.";
      if (error.code === 'auth/wrong-password') mensaje = "Contraseña incorrecta.";
      if (error.code === 'auth/email-already-in-use') mensaje = "Este correo ya está en uso.";
      Alert.alert("Error", mensaje);
    }
    setLoading(false);
  };

  // FUNCIÓN PARA RESTABLECER CONTRASEÑA
  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Atención", "Escribe tu correo en el campo de arriba para enviarte el enlace de recuperación.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert("Enviado", "Revisa tu correo para restablecer tu contraseña.");
    } catch (error: any) {
      Alert.alert("Error", "Asegúrate de que el correo sea válido.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</Text>
      
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

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={handleAuth}>
            <Text style={styles.buttonText}>{isRegistering ? 'Registrarse' : 'Entrar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.secondaryText}>
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </Text>
          </TouchableOpacity>

          {!isRegistering && (
            <TouchableOpacity style={styles.forgotBtn} onPress={handleResetPassword}>
              <Text style={styles.forgotText}>Olvidé mi contraseña</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f1f5f9' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#1e293b' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  button: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: { marginTop: 20, alignItems: 'center' },
  secondaryText: { color: '#3b82f6', fontWeight: '500' },
  forgotBtn: { marginTop: 15, alignItems: 'center' },
  forgotText: { color: '#64748b', fontSize: 14, textDecorationLine: 'underline' }
});