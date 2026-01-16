import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Image } from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
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
        if (Platform.OS === 'web') alert(msg); else Alert.alert("Registro exitoso", msg);
        setIsRegistering(false);
        setPassword('');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        await userCredential.user.reload();
        const userActualizado = auth.currentUser;

        if (userActualizado && !userActualizado.emailVerified) {
          const msg = "Por favor revisa tu bandeja de entrada.";
          if (Platform.OS === 'web') alert(msg); else Alert.alert("Correo no verificado", msg);
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
      if (Platform.OS === 'web') alert(mensaje); else Alert.alert("Error", mensaje);
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
        <View style={styles.card}>
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
            autoCorrect={false}
            placeholderTextColor="#94a3b8"
            style={styles.input}
          />
          
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.inputPassword} 
              placeholder="Contraseña" 
              value={password} 
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              {Platform.OS === 'web' ? (
                showPassword ? (
                  /* SVG OJO CERRADO PARA WEB */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  /* SVG OJO ABIERTO PARA WEB */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )
              ) : (
                <Text style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>
                  {showPassword ? "OCULTAR" : "VER"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginVertical: 20 }} />
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
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    // Eliminamos flex: 1 aquí si existiera para que no se estire
  },
  logo: {
    width: Platform.OS === 'web' ? 120 : 90,
    height: Platform.OS === 'web' ? 120 : 90,
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
    fontSize: 16,
    color: '#000',
    height: 55 // Altura fija añadida
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    height: 55, // Altura fija añadida para evitar que ocupe toda la pantalla
  },
  inputPassword: { 
    flex: 1, 
    paddingHorizontal: 15, // Cambiado de padding general para no afectar la altura
    fontSize: 16,
    color: '#000',
    height: '100%', // Que ocupe solo el contenedor de 55
    ...Platform.select({
      web: { outlineStyle: 'none' } as any
    })
  },
  eyeIcon: { 
    paddingHorizontal: 15,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: { marginTop: 20, alignItems: 'center' },
  secondaryText: { color: '#3b82f6', fontWeight: '600' },
  forgotBtn: { marginTop: 15, alignItems: 'center' },
  forgotText: { color: '#94a3b8', fontSize: 13, textDecorationLine: 'underline' }
});