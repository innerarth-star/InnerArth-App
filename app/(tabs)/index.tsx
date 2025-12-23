import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, LayoutAnimation, Modal, ActivityIndicator, StatusBar } from 'react-native';
import { db, auth } from '../../firebaseConfig'; 
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { FontAwesome5, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';
import AuthScreen from '../AuthScreen'; 

// IMPORTANTE: Asegúrate de que este archivo exista en app/coach.tsx
import CoachPanel from '../coach'; 

const ENFERMEDADES_BASE = ["Diabetes", "Hipertensión", "Obesidad", "Hipotiroidismo", "Cáncer", "Cardiopatías", "Asma", "Ninguna", "Otra"];
const ANTICONCEPTIVOS = ["Pastillas", "Inyección", "DIU", "Implante", "Parche", "Ninguno"];
const TIPOS_CICLO = ["Regular", "Irregular", "Menopausia"];
const OPCIONES_FRECUENCIA = ["Nunca", "1-3 al mes", "1 a la semana", "2-4 a la semana", "5-6 a la semana", "Diario"];
const LISTA_ALIMENTOS_FRECUENCIA = ["Frutas", "Verduras", "Leche", "Yogurt", "Quesos", "Embutidos", "Huevo", "Carnes", "Pescado", "Leguminosas"];

export default function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'coach' | 'alumno' | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  // --- CONFIGURACIÓN DE TU CORREO ---
  const CORREO_COACH = "inner.arth@gmail.com"; 

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        setUser(usuario);
        // Verificamos si el que entró eres tú
        if (usuario.email?.toLowerCase() === CORREO_COACH.toLowerCase()) {
          setRole('coach');
        } else {
          setRole('alumno');
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setCargandoAuth(false);
    });
    return unsub;
  }, []);

  if (cargandoAuth) {
    return (
      <View style={styles.esperaContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!user) return <AuthScreen />;

  // Muestra el Panel de Control si eres tú
  if (role === 'coach') {
    return <CoachPanel />;
  }

  // Muestra el Formulario si es un alumno
  return <ClienteScreen user={user} />;
}

// --- COMPONENTE DEL FORMULARIO (CLIENTES) ---
function ClienteScreen({ user }: { user: any }) {
  const [paso, setPaso] = useState<'formulario' | 'espera'>('formulario');
  const [seccionActiva, setSeccionActiva] = useState<number | null>(1);
  const [modalFirma, setModalFirma] = useState(false);
  const [firma, setFirma] = useState<string | null>(null);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [fechaHoy] = useState(new Date().toLocaleDateString());

  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState<'hombre' | 'mujer' | null>(null);
  const [medidas, setMedidas] = useState({ cuello: '', cintura: '', brazoR: '', brazoF: '', muslo: '', pierna: '' });
  const [ciclo, setCiclo] = useState('');
  const [anticonceptivo, setAnticonceptivo] = useState('');
  const [ipaq, setIpaq] = useState({ vigorosaDias: '', vigorosaMin: '', vigorosaNada: false, moderadaDias: '', moderadaMin: '', moderadaNada: false, caminataDias: '', caminataMin: '', caminataNada: false, sentadoHoras: '' });
  const [enfFamiliares, setEnfFamiliares] = useState<string[]>([]);
  const [otrosFam, setOtrosFam] = useState('');
  const [enfPersonales, setEnfPersonales] = useState<string[]>([]);
  const [otrosPers, setOtrosPers] = useState('');
  const [alergiaMedicamento, setAlergiaMedicamento] = useState('');
  const [numComidas, setNumComidas] = useState<number | null>(null);
  const [alergiaAlimento, setAlergiaAlimento] = useState('');
  const [diasEntreno, setDiasEntreno] = useState<number | null>(null);
  const [tuvoLesion, setTuvoLesion] = useState<string | null>(null);
  const [detalleLesion, setDetalleLesion] = useState('');
  const [tuvoOperacion, setTuvoOperacion] = useState<string | null>(null);
  const [detalleOperacion, setDetalleOperacion] = useState('');
  const [objetivoDeseado, setObjetivoDeseado] = useState('');
  const [frecuenciasAlimentos, setFrecuenciasAlimentos] = useState<any>({});

  useEffect(() => {
    const verificar = async () => {
      const q = query(collection(db, "revisiones_pendientes"), where("uid", "==", user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) setPaso('espera');
    };
    verificar();
  }, [user]);

  const siguienteSeccion = (actual: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (actual === 2 && genero === 'hombre') setSeccionActiva(4);
    else setSeccionActiva(actual + 1);
  };

  const toggleChip = (lista: string[], setLista: Function, valor: string) => {
    lista.includes(valor) ? setLista(lista.filter(item => item !== valor)) : setLista([...lista, valor]);
  };

  const enviarAlCoach = async () => {
    if (!nombre || !firma || !aceptarTerminos || !genero) {
      Alert.alert("Atención", "Es obligatorio completar nombre, género, aceptar términos y firmar.");
      return;
    }
    setPaso('espera');
    try {
      await addDoc(collection(db, "revisiones_pendientes"), {
        uid: user.uid,
        nombre, telefono, emailUsuario: user.email, peso, altura, edad, genero, medidas,
        salud: { enfFamiliares, otrosFam, enfPersonales, otrosPers, alergiaMedicamento, ciclo: genero === 'mujer' ? { tipo: ciclo, anticonceptivo } : 'N/A' },
        actividadFisica: ipaq,
        plan: { numComidas, alergiaAlimento, diasEntreno, tuvoLesion, detalleLesion, tuvoOperacion, detalleOperacion, objetivoDeseado },
        frecuenciaAlimentos: frecuenciasAlimentos,
        firmaCliente: firma,
        fechaConsentimiento: fechaHoy,
        status: 'pendiente',
        timestamp: serverTimestamp()
      });
    } catch (e) { console.log(e); }
  };

  if (paso === 'espera') {
    return (
      <View style={styles.esperaContainer}>
        <FontAwesome5 name="check-circle" size={100} color="#10b981" />
        <Text style={styles.esperaTitle}>¡Enviado!</Text>
        <Text style={styles.esperaSub}>Tu Coach Arturo (inner.arth@gmail.com) está revisando tu información.</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={{marginTop: 30}}>
          <Text style={{color: '#ef4444'}}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.userEmail}>{user.email}</Text>
        <TouchableOpacity onPress={() => signOut(auth)}><MaterialCommunityIcons name="logout" size={20} color="#ef4444" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Check-in FitTech</Text>
        
        {/* Aquí rellenas con los 9 bloques de SectionHeader que ya tienes */}
        <View style={styles.card}>
          <SectionHeader num={1} title="Datos Personales" color="#3b82f6" icon="user-alt" activa={seccionActiva} setActiva={setSeccionActiva} />
          {seccionActiva === 1 && (
            <View style={styles.content}>
              <TextInput style={styles.input} placeholder="Nombre Completo" value={nombre} onChangeText={setNombre} />
              <TextInput style={styles.input} placeholder="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
              <TouchableOpacity style={styles.btnNext} onPress={() => siguienteSeccion(1)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* ... (Agrega el resto de bloques 2 al 9 aquí) */}

      </ScrollView>
      
      <Modal visible={modalFirma} animationType="slide">
        <View style={{flex: 1, backgroundColor: '#fff', paddingTop: 50}}>
          <SignatureScreen onOK={(s) => { setFirma(s); setModalFirma(false); }} descriptionText="Firma" clearText="Borrar" confirmText="Guardar" />
          <TouchableOpacity onPress={() => setModalFirma(false)} style={{padding: 20, alignItems: 'center'}}><Text style={{color: 'red'}}>Cancelar</Text></TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// Estilos y SectionHeader (Mantener los que ya tienes abajo)
// ...