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

const OPCIONES_FRECUENCIA = ["Nunca", "1-3 al mes", "1 a la semana", "2-4 a la semana", "5-6 a la semana", "Diario"];
const LISTA_ALIMENTOS = ["Frutas", "Verduras", "Lácteos", "Carnes", "Leguminosas", "Azúcares"];

export default function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'coach' | 'alumno' | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  const CORREO_COACH = "inner.arth@gmail.com"; 

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        setUser(usuario);
        const emailLimpio = usuario.email?.toLowerCase().trim();
        if (emailLimpio === CORREO_COACH.toLowerCase().trim()) {
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

  if (cargandoAuth) return <View style={styles.esperaContainer}><ActivityIndicator size="large" color="#3b82f6" /></View>;
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
  
  // ESTADOS DEL FORMULARIO
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState<'hombre' | 'mujer' | null>(null);
  const [medidas, setMedidas] = useState({ cuello: '', cintura: '', brazoR: '', brazoF: '', muslo: '', pierna: '' });
  const [objetivo, setObjetivo] = useState('');
  const [lesion, setLesion] = useState({ tiene: '', detalle: '' });
  const [comidasDia, setComidasDia] = useState('');

  useEffect(() => {
    const verificar = async () => {
      const q = query(collection(db, "revisiones_pendientes"), where("uid", "==", user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) setPaso('espera');
    };
    verificar();
  }, [user]);

  const siguiente = (num: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSeccionActiva(num + 1);
  };

  const enviarAlCoach = async () => {
    if (!nombre || !firma || !aceptarTerminos || !genero) {
      Alert.alert("Atención", "Faltan datos obligatorios (Nombre, Género, Firma o Términos).");
      return;
    }
    try {
      await addDoc(collection(db, "revisiones_pendientes"), {
        uid: user.uid,
        nombre, telefono, emailUsuario: user.email, peso, altura, edad, genero,
        medidas, objetivo, lesion, comidasDia,
        firmaCliente: firma,
        fecha: new Date().toLocaleDateString(),
        status: 'pendiente',
        timestamp: serverTimestamp()
      });
      setPaso('espera');
    } catch (e) { Alert.alert("Error", "No se pudo conectar con el servidor."); }
  };

  if (paso === 'espera') {
    return (
      <View style={styles.esperaContainer}>
        <FontAwesome5 name="check-circle" size={100} color="#10b981" />
        <Text style={styles.esperaTitle}>¡Enviado!</Text>
        <Text style={styles.esperaSub}>Tu Coach Arturo está revisando tu información.</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={{marginTop: 30}}><Text style={{color: '#ef4444'}}>Cerrar Sesión</Text></TouchableOpacity>
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

        {/* 1. DATOS PERSONALES */}
        <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={styles.input} placeholder="Nombre Completo" value={nombre} onChangeText={setNombre} />
          <TextInput style={styles.input} placeholder="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Peso (kg)" keyboardType="numeric" value={peso} onChangeText={setPeso} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Altura (cm)" keyboardType="numeric" value={altura} onChangeText={setAltura} />
          </View>
          <TextInput style={styles.input} placeholder="Edad" keyboardType="numeric" value={edad} onChangeText={setEdad} />
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btnG, genero === 'hombre' && styles.btnActive]} onPress={() => setGenero('hombre')}><Text style={genero === 'hombre' ? styles.txtW : styles.txtB}>HOMBRE</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnG, genero === 'mujer' && styles.btnActive]} onPress={() => setGenero('mujer')}><Text style={genero === 'mujer' ? styles.txtW : styles.txtB}>MUJER</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(1)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 2. MEDIDAS */}
        <Section num={2} title="Medidas Corporales" color="#10b981" icon="ruler" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cintura" value={medidas.cintura} onChangeText={v=>setMedidas({...medidas, cintura:v})} keyboardType="numeric" />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Cuello" value={medidas.cuello} onChangeText={v=>setMedidas({...medidas, cuello:v})} keyboardType="numeric" />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Brazo Relaj." value={medidas.brazoR} onChangeText={v=>setMedidas({...medidas, brazoR:v})} keyboardType="numeric" />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Brazo Flex." value={medidas.brazoF} onChangeText={v=>setMedidas({...medidas, brazoF:v})} keyboardType="numeric" />
          </View>
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(2)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 3. SALUD */}
        <Section num={3} title="Salud y Lesiones" color="#f59e0b" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelSub}>¿Tienes alguna lesión?</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btnG, lesion.tiene === 'si' && styles.btnActive]} onPress={() => setLesion({...lesion, tiene:'si'})}><Text style={lesion.tiene === 'si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnG, lesion.tiene === 'no' && styles.btnActive]} onPress={() => setLesion({...lesion, tiene:'no'})}><Text style={lesion.tiene === 'no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity>
          </View>
          {lesion.tiene === 'si' && <TextInput style={styles.input} placeholder="¿Cuál?" value={lesion.detalle} onChangeText={v=>setLesion({...lesion, detalle:v})} />}
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(3)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 4. OBJETIVO */}
        <Section num={4} title="Tu Objetivo" color="#8b5cf6" icon="bullseye" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={[styles.input, {height: 80}]} multiline placeholder="Describe tu meta..." value={objetivo} onChangeText={setObjetivo} />
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(4)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 5. FIRMA */}
        <Section num={5} title="Firma y Envío" color="#1e293b" icon="pen-fancy" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TouchableOpacity style={styles.rowCheck} onPress={() => setAceptarTerminos(!aceptarTerminos)}>
            <MaterialCommunityIcons name={aceptarTerminos ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color="#10b981" />
            <Text style={{marginLeft:10}}>Acepto términos y condiciones.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnFirma} onPress={() => setModalFirma(true)}>
            <Text style={styles.btnFirmaText}>{firma ? "✓ Firmado" : "Tocar para firmar"}</Text>
          </TouchableOpacity>
          {firma && aceptarTerminos && <TouchableOpacity style={styles.btnEnviar} onPress={enviarAlCoach}><Text style={styles.txtW}>ENVIAR TODO AL COACH</Text></TouchableOpacity>}
        </Section>
      </ScrollView>

      <Modal visible={modalFirma} animationType="slide">
        <View style={{flex:1, backgroundColor:'#fff', paddingTop:50}}>
          <SignatureScreen onOK={s=>{setFirma(s); setModalFirma(false);}} descriptionText="Firma aquí" />
          <TouchableOpacity onPress={() => setModalFirma(false)} style={{padding:20, alignItems:'center'}}><Text style={{color:'red'}}>Cerrar</Text></TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// COMPONENTE AUXILIAR DE SECCIÓN
const Section = ({ num, title, color, icon, activa, setActiva, children }: any) => (
  <View style={styles.card}>
    <TouchableOpacity style={styles.headerToggle} onPress={() => setActiva(activa === num ? null : num)}>
      <View style={styles.titleRow}>
        <View style={[styles.numCircle, {backgroundColor: color}]}><Text style={styles.numText}>{num}</Text></View>
        <FontAwesome5 name={icon} size={14} color={color} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <FontAwesome name={activa === num ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
    </TouchableOpacity>
    {activa === num && <View style={styles.content}>{children}</View>}
  </View>
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
  labelSub: { fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#475569' },
  rowCheck: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  btnFirma: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#3b82f6', borderStyle: 'dashed', alignItems: 'center' },
  btnFirmaText: { color: '#3b82f6', fontWeight: 'bold' },
  btnEnviar: { backgroundColor: '#10b981', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  btnNext: { padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#3b82f6', marginTop: 10 },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#f1f5f9' },
  esperaTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 25 },
  esperaSub: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 10 }
});