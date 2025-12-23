import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, LayoutAnimation, Modal, ActivityIndicator, StatusBar } from 'react-native';
import { db, auth } from '../../firebaseConfig'; 
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { FontAwesome5, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';
import AuthScreen from '../AuthScreen'; 

// IMPORTANTE: Asegúrate de que el archivo app/(tabs)/coach.tsx existe
import CoachPanel from './coach'; 

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
        // Verificación exacta ignorando espacios y mayúsculas
        if (usuario.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase()) {
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

  if (role === 'coach') return <CoachPanel />;

  return <ClienteScreen user={user} />;
}

function ClienteScreen({ user }: { user: any }) {
  const [paso, setPaso] = useState<'formulario' | 'espera'>('formulario');
  const [seccionActiva, setSeccionActiva] = useState<number | null>(1);
  const [modalFirma, setModalFirma] = useState(false);
  const [firma, setFirma] = useState<string | null>(null);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [fechaHoy] = useState(new Date().toLocaleDateString());

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
        <Text style={styles.esperaSub}>Tu Coach Arturo está revisando tu información.</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={{marginTop: 30}}>
          <Text style={{color: '#ef4444'}}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <Text style={styles.userEmail}>{user.email}</Text>
        <TouchableOpacity onPress={() => signOut(auth)}><MaterialCommunityIcons name="logout" size={20} color="#ef4444" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Check-in FitTech</Text>
        
        {/* BLOQUE 1 */}
        <View style={styles.card}>
          <SectionHeader num={1} title="Datos Personales" color="#3b82f6" icon="user-alt" activa={seccionActiva} setActiva={setSeccionActiva} />
          {seccionActiva === 1 && (
            <View style={styles.content}>
              <TextInput style={styles.input} placeholder="Nombre Completo" value={nombre} onChangeText={setNombre} />
              <TextInput style={styles.input} placeholder="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="Peso (kg)" keyboardType="numeric" value={peso} onChangeText={setPeso} />
                <TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} placeholder="Altura (cm)" keyboardType="numeric" value={altura} onChangeText={setAltura} />
              </View>
              <TextInput style={styles.input} placeholder="Edad" keyboardType="numeric" value={edad} onChangeText={setEdad} />
              <View style={styles.row}>
                <TouchableOpacity style={[styles.btnG, genero === 'hombre' && styles.btnActive]} onPress={() => { setGenero('hombre'); siguienteSeccion(1); }}><Text style={genero === 'hombre' ? styles.txtW : styles.txtB}>HOMBRE</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.btnG, genero === 'mujer' && styles.btnActive]} onPress={() => { setGenero('mujer'); siguienteSeccion(1); }}><Text style={genero === 'mujer' ? styles.txtW : styles.txtB}>MUJER</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* BLOQUE 2 AL 7 (SIMPLIFICADO PARA ESTE EJEMPLO, RELLENA CON TUS INPUTS) */}
        <View style={styles.card}>
          <SectionHeader num={2} title="Medidas y Salud" color="#10b981" icon="ruler-combined" activa={seccionActiva} setActiva={setSeccionActiva} />
          {seccionActiva === 2 && (
            <View style={styles.content}>
               <Text style={styles.labelSub}>Introduce tus medidas y datos de salud para continuar.</Text>
               <TouchableOpacity style={styles.btnNext} onPress={() => siguienteSeccion(2)}><Text style={styles.txtW}>Continuar</Text></TouchableOpacity>
            </View>
          )}
        </View>

        {/* BLOQUE 8: FIRMA */}
        <View style={styles.card}>
          <SectionHeader num={8} title="Consentimiento y Firma" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva} />
          {seccionActiva === 8 && (
            <View style={styles.content}>
              <TouchableOpacity style={styles.rowCheck} onPress={() => setAceptarTerminos(!aceptarTerminos)}>
                <MaterialCommunityIcons name={aceptarTerminos ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color="#10b981" />
                <Text style={styles.checkTxt}>Acepto términos y condiciones.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnFirma} onPress={() => setModalFirma(true)}>
                <Text style={styles.btnFirmaText}>{firma ? "✓ Firmado" : "Tocar para firmar"}</Text>
              </TouchableOpacity>
              {firma && <TouchableOpacity style={styles.btnEnviar} onPress={enviarAlCoach}><Text style={styles.txtW}>ENVIAR TODO</Text></TouchableOpacity>}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalFirma} animationType="slide">
        <View style={{flex: 1, backgroundColor: '#fff', paddingTop: 50}}>
          <SignatureScreen onOK={(s) => { setFirma(s); setModalFirma(false); }} descriptionText="Firma aquí" />
          <TouchableOpacity onPress={() => setModalFirma(false)} style={{padding: 20, alignItems: 'center'}}><Text style={{color: 'red'}}>Cerrar</Text></TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const SectionHeader = ({ num, title, color, icon, lib = "FontAwesome5", activa, setActiva }: any) => (
  <TouchableOpacity style={styles.headerToggle} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiva(activa === num ? null : num); }}>
    <View style={styles.titleRow}>
      <View style={[styles.numCircle, {backgroundColor: color}]}><Text style={styles.numText}>{num}</Text></View>
      <FontAwesome5 name={icon} size={14} color={color} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <FontAwesome name={activa === num ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 50 },
  userEmail: { fontSize: 12, color: '#64748b' },
  scroll: { padding: 15 },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 15, overflow: 'hidden', marginBottom: 10 },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold' },
  content: { padding: 18, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  input: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 5 },
  btnG: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#3b82f6', alignItems: 'center', marginHorizontal: 5 },
  btnActive: { backgroundColor: '#3b82f6' },
  txtB: { color: '#3b82f6', fontWeight: 'bold' },
  txtW: { color: '#fff', fontWeight: 'bold' },
  labelSub: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  rowCheck: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  checkTxt: { marginLeft: 10, fontSize: 11 },
  btnFirma: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#3b82f6', borderStyle: 'dashed', alignItems: 'center' },
  btnFirmaText: { color: '#3b82f6', fontWeight: 'bold' },
  btnEnviar: { backgroundColor: '#10b981', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  btnNext: { padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#3b82f6' },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#f1f5f9' },
  esperaTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 25 },
  esperaSub: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 10 }
});