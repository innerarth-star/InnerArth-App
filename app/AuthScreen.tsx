import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Image } from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password) {
      if (Platform.OS === 'web') alert("Por favor llena todos los campos.");
      else Alert.alert("Error", "Por favor llena todos los campos.");
      return;
    }
    setLoading(true);
    Keyboard.dismiss();

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(userCredential.user);
        const msg = "Verifica tu email antes de iniciar sesión.";
        Platform.OS === 'web' ? alert(msg) : Alert.alert("Registro exitoso", msg);
        setIsRegistering(false);
        setPassword('');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        await userCredential.user.reload();
        const userActualizado = auth.currentUser;

        if (userActualizado && !userActualizado.emailVerified) {
          const msg = "Por favor revisa tu bandeja de entrada.";
          Platform.OS === 'web' ? alert(msg) : Alert.alert("Correo no verificado", msg);
          setLoading(false);
          return;
        }
        router.replace('/' as any);
      }
    } catch (error: any) {
      let mensaje = "Ocurrió un error inesperado.";
      if (error.code === 'auth/email-already-in-use') mensaje = "Este correo ya está registrado.";
      if (error.code === 'auth/invalid-email') mensaje = "El formato del correo no es válido.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') mensaje = "Credenciales incorrectas.";
      
      Platform.OS === 'web' ? alert(mensaje) : Alert.alert("Error", mensaje);
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert("Escribe tu correo arriba.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      alert("Enviado. Revisa tu correo.");
    } catch (error: any) {
      alert("Error: Asegúrate de que el correo sea válido.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* TARJETA DE LOGIN CENTRAL */}
        <View style={styles.card}>
          {/* Logo para impacto visual */}
          <Image 
            source={require('../assets/images/splash-icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          
          <Text style={styles.title}>{isRegistering ? 'Crear Cuenta' : 'Bienvenido'}</Text>
          <Text style={styles.subtitle}>Ingresa tus datos para continuar</Text>
          
          <TextInput
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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
                size={22} 
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000000' // Fondo oscuro para impacto visual
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', // Centra la tarjeta en Web
    padding: 20 
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 20,
    width: '100%',
    // MAGIA DE LA WEB: Ancho máximo para que no se estire
    maxWidth: 420,
    alignSelf: 'center'
    // Sombra para efecto de elevación
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 5 },
      web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.2)', marginTop: 50 }
    })
  },
  logo: {
    width: Platform.OS === 'web' ? 150 : 100,
    height: Platform.OS === 'web' ? 150 : 100,
    alignSelf: 'center',
    marginBottom: 20
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 25, marginTop: 5 },
  input: { 
    backgroundColor: '#f8fafc', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    fontSize: 16
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputPassword: { flex: 1, padding: 15, fontSize: 16 },
  eyeIcon: { position: 'absolute', right: 0, height: '100%', justifyContent: 'center', paddingHorizontal: 15, zIndex: 10, },
  button: { 
    backgroundColor: '#3b82f6', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10,
    // Efecto de brillo en el botón
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: { marginTop: 20, alignItems: 'center' },
  secondaryText: { color: '#3b82f6', fontWeight: '600' },
  forgotBtn: { marginTop: 15, alignItems: 'center' },
  forgotText: { color: '#94a3b8', fontSize: 13, textDecorationLine: 'underline' }
});