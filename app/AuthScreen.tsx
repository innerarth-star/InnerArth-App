import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // IMPORTANTE

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter(); // INICIALIZAMOS EL ROUTER

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor llena todos los campos.");
      return;
    }
    setLoading(true);
    Keyboard.dismiss(); // CIERRA EL TECLADO EN ANDROID AL DAR CLICK

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(userCredential.user);
        Alert.alert("Registro exitoso", "Verifica tu email antes de iniciar sesión.");
        setIsRegistering(false);
        setPassword('');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        await userCredential.user.reload();
        
        const userActualizado = auth.currentUser;

        if (userActualizado && !userActualizado.emailVerified) {
          Alert.alert("Correo no verificado", "Por favor revisa tu bandeja de entrada.");
          setLoading(false);
          return;
        }

        // --- LA PIEZA QUE FALTABA ---
        // Si el login es correcto y está verificado, lo mandamos al index raíz
        router.replace('/' as any);
      }
    } catch (error: any) {
      console.log("Error Firebase:", error.code);
      let mensaje = "Ocurrió un error inesperado.";
      if (error.code === 'auth/email-already-in-use') mensaje = "Este correo ya está registrado.";
      if (error.code === 'auth/invalid-email') mensaje = "El formato del correo no es válido.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') mensaje = "Credenciales incorrectas.";
      Alert.alert("Error", mensaje);
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Atención", "Escribe tu correo arriba.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert("Enviado", "Revisa tu correo.");
    } catch (error: any) {
      Alert.alert("Error", "Asegúrate de que el correo sea válido.");
    }
  };

  return (
    // KeyboardAvoidingView arregla que el teclado no tape los inputs en Android
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</Text>
        
    <TextInput
      placeholder="Correo electrónico"
      value={email}
      onChangeText={setEmail}
      keyboardType="email-address"
      autoCapitalize="none"
      // Añade esto para Android:
      disableFullscreenUI={true} 
      autoCorrect={false}
      style={styles.input}
    />
        
        <View style={styles.passwordContainer}>
          <TextInput 
            style={styles.inputPassword} 
            placeholder="Contraseña" 
            value={password} 
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={24} 
              color="#64748b" 
            />
          </TouchableOpacity>
        </View>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#1e293b' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputPassword: { flex: 1, padding: 15 },
  eyeIcon: { paddingHorizontal: 15 },
  button: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: { marginTop: 20, alignItems: 'center' },
  secondaryText: { color: '#3b82f6', fontWeight: '500' },
  forgotBtn: { marginTop: 15, alignItems: 'center' },
  forgotText: { color: '#64748b', fontSize: 14, textDecorationLine: 'underline' }
});