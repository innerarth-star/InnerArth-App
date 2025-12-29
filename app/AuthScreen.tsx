import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification 
} from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons'; // Necesitaremos los iconos

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ESTADO PARA MOSTRAR/OCULTAR

  // FUNCIÓN PARA LOGIN
const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor llena todos los campos.");
      return;
    }
    setLoading(true);
    try {
      if (isRegistering) {
        // --- FLUJO DE REGISTRO ---
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        // Enviamos verificación inmediatamente
        await sendEmailVerification(userCredential.user);
        
        Alert.alert(
          "Registro exitoso", 
          "Hemos enviado un enlace a tu email. Por favor verifícalo para poder iniciar sesión."
        );
        setIsRegistering(false);
        setPassword(''); // Limpiamos contraseña por seguridad
      } else {
        // --- FLUJO DE LOGIN ---
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        
        // RECARGA CRUCIAL: Forzamos a Firebase a consultar el estado del email al servidor
        await userCredential.user.reload();
        
        // Obtenemos la referencia actualizada del usuario después del reload
        const userActualizado = auth.currentUser;

        if (userActualizado && !userActualizado.emailVerified) {
          Alert.alert(
            "Correo no verificado", 
            "Aún no has verificado tu cuenta. Revisa tu bandeja de entrada o spam."
          );
          // Opcional: Cerrar sesión para que no entre si no está verificado
          // await auth.signOut();
        }
      }
    } catch (error: any) {
      console.log("Error Firebase:", error.code);
      let mensaje = "Ocurrió un error inesperado.";
      
      if (error.code === 'auth/email-already-in-use') mensaje = "Este correo ya está registrado.";
      if (error.code === 'auth/invalid-email') mensaje = "El formato del correo no es válido.";
      if (error.code === 'auth/weak-password') mensaje = "La contraseña debe tener al menos 6 caracteres.";
      if (error.code === 'auth/user-not-found') mensaje = "El usuario no existe.";
      if (error.code === 'auth/wrong-password') mensaje = "Contraseña incorrecta.";
      if (error.code === 'auth/network-request-failed') mensaje = "Error de red. Revisa tu conexión.";
      
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
      
      {/* CONTENEDOR DE CONTRASEÑA CON OJO */}
      <View style={styles.passwordContainer}>
        <TextInput 
          style={styles.inputPassword} 
          placeholder="Contraseña" 
          value={password} 
          onChangeText={setPassword}
          secureTextEntry={!showPassword} // SE OCULTA SI showPassword ES FALSE
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f1f5f9' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#1e293b' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  
  // ESTILOS PARA EL BUSCADOR CON OJO
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputPassword: {
    flex: 1,
    padding: 15,
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },

  button: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: { marginTop: 20, alignItems: 'center' },
  secondaryText: { color: '#3b82f6', fontWeight: '500' },
  forgotBtn: { marginTop: 15, alignItems: 'center' },
  forgotText: { color: '#64748b', fontSize: 14, textDecorationLine: 'underline' }
});