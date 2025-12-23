import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, LayoutAnimation, Modal, ActivityIndicator, StatusBar } from 'react-native';
import { db, auth } from '../../firebaseConfig'; 
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { FontAwesome5, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';
import AuthScreen from '../AuthScreen'; 
import CoachPanel from './coach'; 

export default function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'coach' | 'alumno' | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const CORREO_COACH = "inner.arth@gmail.com"; 

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        setUser(usuario);
        if (usuario.email?.toLowerCase().trim() === CORREO_COACH.toLowerCase().trim()) {
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
  
  // ESTADOS DEL FORMULARIO (8 BLOQUES)
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [datosFisicos, setDatosFisicos] = useState({ peso: '', altura: '', edad: '', genero: '' });
  const [medidas, setMedidas] = useState({ cuello: '', cintura: '', brazoR: '', brazoF: '', muslo: '', pierna: '' });
  const [salud, setSalud] = useState({ lesion: '', operacion: '', medicamento: '' });
  const [estiloVida, setEstiloVida] = useState({ actividad: '', horasSueno: '', estres: '' });
  const [nutricion, setNutricion] = useState({ comidasDia: '', agua: '', suplementos: '' });
  const [objetivo, setObjetivo] = useState('');
  const [frecuenciaAlimentos, setFrecuenciaAlimentos] = useState('');

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
    if (!nombre || !firma || !aceptarTerminos || !datosFisicos.genero) {
      Alert.alert("Atención", "Nombre, Género, Términos y Firma son obligatorios.");
      return;
    }
    try {
      await addDoc(collection(db, "revisiones_pendientes"), {
        uid: user.uid,
        emailUsuario: user.email,
        nombre, telefono, datosFisicos, medidas, salud, estiloVida, nutricion, objetivo, frecuenciaAlimentos,
        firmaCliente: firma,
        fecha: new Date().toLocaleDateString(),
        status: 'pendiente',
        timestamp: serverTimestamp()
      });
      setPaso('espera');
    } catch (e) { Alert.alert("Error", "Error al enviar datos."); }
  };

  if (paso === 'espera') {
    return (
      <View style={styles.esperaContainer}>
        <FontAwesome5 name="check-circle" size={80} color="#10b981" />
        <Text style={styles.esperaTitle}>¡Recibido!</Text>
        <Text style={styles.esperaSub}>Tu información ya está con el Coach Arturo.</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.btnCerrar}><Text style={{color: '#ef4444', fontWeight: 'bold'}}>Cerrar Sesión</Text></TouchableOpacity>
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
        <Text style={styles.header}>Cuestionario Inicial</Text>

        {/* 1. DATOS PERSONALES */}
        <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={styles.input} placeholder="Nombre Completo" value={nombre} onChangeText={setNombre} />
          <TextInput style={styles.input} placeholder="WhatsApp / Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(1)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 2. COMPOSICIÓN FÍSICA */}
        <Section num={2} title="Composición Física" color="#06b6d4" icon="weight" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Peso (kg)" keyboardType="numeric" value={datosFisicos.peso} onChangeText={v=>setDatosFisicos({...datosFisicos, peso:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Altura (cm)" keyboardType="numeric" value={datosFisicos.altura} onChangeText={v=>setDatosFisicos({...datosFisicos, altura:v})} />
          </View>
          <TextInput style={styles.input} placeholder="Edad" keyboardType="numeric" value={datosFisicos.edad} onChangeText={v=>setDatosFisicos({...datosFisicos, edad:v})} />
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btnG, datosFisicos.genero === 'hombre' && styles.btnActive]} onPress={() => setDatosFisicos({...datosFisicos, genero:'hombre'})}><Text style={datosFisicos.genero === 'hombre' ? styles.txtW : styles.txtB}>HOMBRE</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnG, datosFisicos.genero === 'mujer' && styles.btnActive]} onPress={() => setDatosFisicos({...datosFisicos, genero:'mujer'})}><Text style={datosFisicos.genero === 'mujer' ? styles.txtW : styles.txtB}>MUJER</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(2)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 3. MEDIDAS DETALLADAS */}
        <Section num={3} title="Medidas (cm)" color="#10b981" icon="ruler" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cintura" value={medidas.cintura} onChangeText={v=>setMedidas({...medidas, cintura:v})} keyboardType="numeric" />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Cuello" value={medidas.cuello} onChangeText={v=>setMedidas({...medidas, cuello:v})} keyboardType="numeric" />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Brazo Relaj." value={medidas.brazoR} onChangeText={v=>setMedidas({...medidas, brazoR:v})} keyboardType="numeric" />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Brazo Flex." value={medidas.brazoF} onChangeText={v=>setMedidas({...medidas, brazoF:v})} keyboardType="numeric" />
          </View>
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(3)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 4. HISTORIAL DE SALUD */}
        <Section num={4} title="Salud y Médicos" color="#ef4444" icon="stethoscope" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={styles.input} placeholder="¿Lesiones actuales?" value={salud.lesion} onChangeText={v=>setSalud({...salud, lesion:v})} />
          <TextInput style={styles.input} placeholder="¿Cirugías previas?" value={salud.operacion} onChangeText={v=>setSalud({...salud, operacion:v})} />
          <TextInput style={styles.input} placeholder="¿Tomas algún medicamento?" value={salud.medicamento} onChangeText={v=>setSalud({...salud, medicamento:v})} />
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(4)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 5. ESTILO DE VIDA */}
        <Section num={5} title="Estilo de Vida" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={styles.input} placeholder="Ocupación / Actividad Diaria" value={estiloVida.actividad} onChangeText={v=>setEstiloVida({...estiloVida, actividad:v})} />
          <TextInput style={styles.input} placeholder="Horas de sueño" keyboardType="numeric" value={estiloVida.horasSueno} onChangeText={v=>setEstiloVida({...estiloVida, horasSueno:v})} />
          <TextInput style={styles.input} placeholder="Nivel de estrés (1-10)" keyboardType="numeric" value={estiloVida.estres} onChangeText={v=>setEstiloVida({...estiloVida, estres:v})} />
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(5)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 6. NUTRICIÓN ACTUAL */}
        <Section num={6} title="Nutrición Actual" color="#ec4899" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={styles.input} placeholder="¿Cuántas comidas haces al día?" value={nutricion.comidasDia} onChangeText={v=>setNutricion({...nutricion, comidasDia:v})} />
          <TextInput style={styles.input} placeholder="Litros de agua al día" value={nutricion.agua} onChangeText={v=>setNutricion({...nutricion, agua:v})} />
          <TextInput style={styles.input} placeholder="¿Usas suplementos?" value={nutricion.suplementos} onChangeText={v=>setNutricion({...nutricion, suplementos:v})} />
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(6)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 7. FRECUENCIA DE ALIMENTOS */}
        <Section num={7} title="Frecuencia de Alimentos" color="#8b5cf6" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={[styles.input, {height:80}]} multiline placeholder="¿Qué alimentos consumes más seguido? ¿Alguna alergia?" value={frecuenciaAlimentos} onChangeText={setFrecuenciaAlimentos} />
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(7)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 8. OBJETIVO Y FIRMA */}
        <Section num={8} title="Meta y Firma" color="#1e293b" icon="check-double" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={[styles.input, {height:60}]} multiline placeholder="¿Cuál es tu meta principal?" value={objetivo} onChangeText={setObjetivo} />
          <TouchableOpacity style={styles.rowCheck} onPress={() => setAceptarTerminos(!aceptarTerminos)}>
            <MaterialCommunityIcons name={aceptarTerminos ? "checkbox-marked" : "checkbox-blank-outline"} size={22} color="#10b981" />
            <Text style={{marginLeft:8, fontSize:12}}>Acepto términos, condiciones y uso de datos.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnFirma} onPress={() => setModalFirma(true)}>
            <Text style={styles.btnFirmaText}>{firma ? "✓ Firma Registrada" : "Firmar aquí"}</Text>
          </TouchableOpacity>
          {firma && aceptarTerminos && <TouchableOpacity style={styles.btnEnviar} onPress={enviarAlCoach}><Text style={styles.txtW}>ENVIAR TODO</Text></TouchableOpacity>}
        </Section>
      </ScrollView>

      <Modal visible={modalFirma} animationType="slide">
        <View style={{flex:1, backgroundColor:'#fff', paddingTop:50}}>
          <SignatureScreen onOK={s=>{setFirma(s); setModalFirma(false);}} descriptionText="Firma" />
          <TouchableOpacity onPress={() => setModalFirma(false)} style={{padding:20, alignItems:'center'}}><Text style={{color:'red'}}>Cancelar</Text></TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

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
  userEmail: { fontSize: 11, color: '#94a3b8' },
  scroll: { padding: 15, paddingBottom: 40 },
  header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#1e293b' },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 10, elevation: 1 },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  content: { padding: 15, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  input: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8, fontSize: 14 },
  row: { flexDirection: 'row', marginBottom: 5 },
  btnG: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', alignItems: 'center', marginHorizontal: 4 },
  btnActive: { backgroundColor: '#3b82f6' },
  txtB: { color: '#3b82f6', fontWeight: 'bold', fontSize: 12 },
  txtW: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  rowCheck: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  btnFirma: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', borderStyle: 'dashed', alignItems: 'center' },
  btnFirmaText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 13 },
  btnEnviar: { backgroundColor: '#10b981', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  btnNext: { padding: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#3b82f6', marginTop: 5 },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#f1f5f9' },
  esperaTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  esperaSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 10 },
  btnCerrar: { marginTop: 40, padding: 10 }
});