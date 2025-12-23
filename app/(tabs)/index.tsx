import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, LayoutAnimation, Modal, ActivityIndicator, StatusBar } from 'react-native';
import { db, auth } from '../../firebaseConfig'; 
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { FontAwesome5, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';
import AuthScreen from '../AuthScreen'; 
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

  // ESTADOS COMPLETOS
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [datosFisicos, setDatosFisicos] = useState({ peso: '', altura: '', edad: '', genero: '' });
  const [medidas, setMedidas] = useState({ cuello: '', cintura: '', brazoR: '', brazoF: '', muslo: '', pierna: '' });
  const [ciclo, setCiclo] = useState({ tipo: '', anticonceptivo: '' });
  const [salud, setSalud] = useState({ enfFam: [] as string[], otrosFam: '', enfPers: [] as string[], otrosPers: '', medicamento: '', lesion: '', detalleLesion: '', operacion: '', detalleOperacion: '' });
  const [ipaq, setIpaq] = useState({ vigorosa: '', moderada: '', caminata: '', sentado: '' });
  const [nutricion, setNutricion] = useState({ comidasDia: '', entrenoSemana: '', agua: '', suplementos: '', alcohol: '', sustancias: '' });
  const [frecuenciaAlimentos, setFrecuenciaAlimentos] = useState<any>({});
  const [objetivo, setObjetivo] = useState('');

  const siguiente = (num: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSeccionActiva(num + 1);
  };

  const toggleChip = (lista: string[], valor: string, campo: string) => {
    const nuevaLista = lista.includes(valor) ? lista.filter(i => i !== valor) : [...lista, valor];
    setSalud({ ...salud, [campo]: nuevaLista });
  };

  const enviarAlCoach = async () => {
    if (!nombre || !firma || !aceptarTerminos) {
      Alert.alert("Atención", "Nombre, Firma y Términos son obligatorios.");
      return;
    }
    try {
      await addDoc(collection(db, "revisiones_pendientes"), {
        uid: user.uid, nombre, telefono, emailUsuario: user.email,
        datosFisicos, medidas, ciclo, salud, ipaq, nutricion, frecuenciaAlimentos, objetivo,
        firma, fecha: new Date().toLocaleDateString(), timestamp: serverTimestamp()
      });
      setPaso('espera');
    } catch (e) { Alert.alert("Error", "Error al enviar."); }
  };

  if (paso === 'espera') {
    return (
      <View style={styles.esperaContainer}>
        <FontAwesome5 name="check-circle" size={80} color="#10b981" />
        <Text style={styles.esperaTitle}>¡Enviado!</Text>
        <Text style={styles.esperaSub}>Arturo revisará tu información pronto.</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={{marginTop:20}}><Text style={{color:'#ef4444'}}>Cerrar Sesión</Text></TouchableOpacity>
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

        {/* 1. DATOS PERSONALES Y CICLO */}
        <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={styles.input} placeholder="Nombre Completo" value={nombre} onChangeText={setNombre} />
          <TextInput style={styles.input} placeholder="WhatsApp" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Peso (kg)" keyboardType="numeric" value={datosFisicos.peso} onChangeText={v=>setDatosFisicos({...datosFisicos, peso:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Altura (cm)" keyboardType="numeric" value={datosFisicos.altura} onChangeText={v=>setDatosFisicos({...datosFisicos, altura:v})} />
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btnG, datosFisicos.genero === 'hombre' && styles.btnActive]} onPress={() => setDatosFisicos({...datosFisicos, genero:'hombre'})}><Text style={datosFisicos.genero === 'hombre' ? styles.txtW : styles.txtB}>HOMBRE</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnG, datosFisicos.genero === 'mujer' && styles.btnActive]} onPress={() => setDatosFisicos({...datosFisicos, genero:'mujer'})}><Text style={datosFisicos.genero === 'mujer' ? styles.txtW : styles.txtB}>MUJER</Text></TouchableOpacity>
          </View>
          {datosFisicos.genero === 'mujer' && (
            <View style={{marginTop:10}}>
              <Text style={styles.labelSub}>Ciclo Menstrual:</Text>
              <View style={styles.rowWrap}>{TIPOS_CICLO.map(t => <TouchableOpacity key={t} style={[styles.chip, ciclo.tipo === t && styles.chipActive]} onPress={()=>setCiclo({...ciclo, tipo:t})}><Text style={ciclo.tipo === t ? styles.txtW : styles.txtB}>{t}</Text></TouchableOpacity>)}</View>
              <Text style={styles.labelSub}>Anticonceptivo:</Text>
              <View style={styles.rowWrap}>{ANTICONCEPTIVOS.map(a => <TouchableOpacity key={a} style={[styles.chip, ciclo.anticonceptivo === a && styles.chipActive]} onPress={()=>setCiclo({...ciclo, anticonceptivo:a})}><Text style={ciclo.anticonceptivo === a ? styles.txtW : styles.txtB}>{a}</Text></TouchableOpacity>)}</View>
            </View>
          )}
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(1)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 2. MEDIDAS COMPLETAS */}
        <Section num={2} title="Medidas" color="#10b981" icon="ruler" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cuello" keyboardType="numeric" value={medidas.cuello} onChangeText={v=>setMedidas({...medidas, cuello:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Cintura" keyboardType="numeric" value={medidas.cintura} onChangeText={v=>setMedidas({...medidas, cintura:v})} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Brazo R" keyboardType="numeric" value={medidas.brazoR} onChangeText={v=>setMedidas({...medidas, brazoR:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Brazo F" keyboardType="numeric" value={medidas.brazoF} onChangeText={v=>setMedidas({...medidas, brazoF:v})} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Muslo" keyboardType="numeric" value={medidas.muslo} onChangeText={v=>setMedidas({...medidas, muslo:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Pierna" keyboardType="numeric" value={medidas.pierna} onChangeText={v=>setMedidas({...medidas, pierna:v})} />
          </View>
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(2)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 3. SALUD E HISTORIAL */}
        <Section num={3} title="Historial Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelSub}>Familiares:</Text>
          <View style={styles.rowWrap}>{ENFERMEDADES_BASE.map(e => <TouchableOpacity key={e} style={[styles.chip, salud.enfFam.includes(e) && styles.chipActive]} onPress={()=>toggleChip(salud.enfFam, e, 'enfFam')}><Text style={salud.enfFam.includes(e) ? styles.txtW : styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
          {salud.enfFam.includes('Otra') && <TextInput style={styles.input} placeholder="¿Cuál?" value={salud.otrosFam} onChangeText={v=>setSalud({...salud, otrosFam:v})} />}
          
          <Text style={[styles.labelSub, {marginTop:10}]}>Personales:</Text>
          <View style={styles.rowWrap}>{ENFERMEDADES_BASE.map(e => <TouchableOpacity key={e} style={[styles.chip, salud.enfPers.includes(e) && styles.chipActive]} onPress={()=>toggleChip(salud.enfPers, e, 'enfPers')}><Text style={salud.enfPers.includes(e) ? styles.txtW : styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
          {salud.enfPers.includes('Otra') && <TextInput style={styles.input} placeholder="¿Cuál?" value={salud.otrosPers} onChangeText={v=>setSalud({...salud, otrosPers:v})} />}

          <Text style={styles.labelSub}>¿Lesiones?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, salud.lesion==='si' && styles.btnActive]} onPress={()=>setSalud({...salud, lesion:'si'})}><Text style={salud.lesion==='si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, salud.lesion==='no' && styles.btnActive]} onPress={()=>setSalud({...salud, lesion:'no'})}><Text style={salud.lesion==='no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity></View>
          {salud.lesion==='si' && <TextInput style={styles.input} placeholder="¿Cuál?" value={salud.detalleLesion} onChangeText={v=>setSalud({...salud, detalleLesion:v})} />}
          
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(3)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 4. ESTILO DE VIDA (IPAQ) */}
        <Section num={4} title="Estilo Vida (IPAQ)" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={styles.input} placeholder="Días Act. Vigorosa" value={ipaq.vigorosa} onChangeText={v=>setIpaq({...ipaq, vigorosa:v})} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Días Act. Moderada" value={ipaq.moderada} onChangeText={v=>setIpaq({...ipaq, moderada:v})} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Días Caminata" value={ipaq.caminata} onChangeText={v=>setIpaq({...ipaq, caminata:v})} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Horas sentado al día" value={ipaq.sentado} onChangeText={v=>setIpaq({...ipaq, sentado:v})} keyboardType="numeric" />
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(4)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 5. NUTRICIÓN Y SUSTANCIAS */}
        <Section num={5} title="Nutrición y Hábitos" color="#ec4899" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={styles.input} placeholder="¿Comidas al día?" value={nutricion.comidasDia} onChangeText={v=>setNutricion({...nutricion, comidasDia:v})} />
          <TextInput style={styles.input} placeholder="¿Cuántos días puedes entrenar?" value={nutricion.entrenoSemana} onChangeText={v=>setNutricion({...nutricion, entrenoSemana:v})} />
          <TextInput style={styles.input} placeholder="Consumo de alcohol" value={nutricion.alcohol} onChangeText={v=>setNutricion({...nutricion, alcohol:v})} />
          <TextInput style={styles.input} placeholder="¿Sustancias / Fuma?" value={nutricion.sustancias} onChangeText={v=>setNutricion({...nutricion, sustancias:v})} />
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(5)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 6. FRECUENCIA DE ALIMENTOS */}
        <Section num={6} title="Frecuencia Alimentos" color="#8b5cf6" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
          {LISTA_ALIMENTOS_FRECUENCIA.map(ali => (
            <View key={ali} style={{marginBottom:10}}>
              <Text style={{fontSize:12, fontWeight:'bold'}}>{ali}:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {OPCIONES_FRECUENCIA.map(op => (
                  <TouchableOpacity key={op} style={[styles.chip, frecuenciaAlimentos[ali] === op && styles.chipActive]} onPress={()=>setFrecuenciaAlimentos({...frecuenciaAlimentos, [ali]:op})}><Text style={{fontSize:10, color: frecuenciaAlimentos[ali]===op ? '#fff' : '#3b82f6'}}>{op}</Text></TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(6)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 7. OBJETIVO */}
        <Section num={7} title="Objetivos" color="#0ea5e9" icon="bullseye" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={[styles.input, {height:80}]} multiline placeholder="Escribe aquí tus objetivos..." value={objetivo} onChangeText={setObjetivo} />
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(7)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 8. CONSENTIMIENTO Y ENVÍO */}
        <Section num={8} title="Firma y Envío" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.avisoBox}><Text style={styles.avisoTxt}>Aviso de Privacidad: Tus datos están protegidos y solo se usarán para tu asesoría fitness con FitTech.</Text></View>
          <TouchableOpacity style={styles.rowCheck} onPress={() => setAceptarTerminos(!aceptarTerminos)}>
            <MaterialCommunityIcons name={aceptarTerminos ? "checkbox-marked" : "checkbox-blank-outline"} size={22} color="#10b981" />
            <Text style={{marginLeft:8, fontSize:11}}>Acepto términos y condiciones.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnFirma} onPress={() => setModalFirma(true)}>
            <Text style={styles.btnFirmaText}>{firma ? "✓ Firma Registrada" : "Firma aquí"}</Text>
          </TouchableOpacity>
          {firma && aceptarTerminos && <TouchableOpacity style={styles.btnEnviar} onPress={enviarAlCoach}><Text style={styles.txtW}>ENVIAR A MI COACH</Text></TouchableOpacity>}
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
      <View style={styles.titleRow}><View style={[styles.numCircle, {backgroundColor: color}]}><Text style={styles.numText}>{num}</Text></View><FontAwesome5 name={icon} size={14} color={color} /><Text style={styles.sectionTitle}>{title}</Text></View>
      <FontAwesome name={activa === num ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
    </TouchableOpacity>
    {activa === num && <View style={styles.content}>{children}</View>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 50 },
  userEmail: { fontSize: 10, color: '#94a3b8' },
  scroll: { padding: 15, paddingBottom: 50 },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#1e293b' },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, elevation: 1 },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  content: { padding: 15, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  input: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8, fontSize: 14 },
  row: { flexDirection: 'row', marginBottom: 5 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 1, borderColor: '#3b82f6', marginBottom: 5, marginRight: 5 },
  chipActive: { backgroundColor: '#3b82f6' },
  btnG: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', alignItems: 'center', marginHorizontal: 4 },
  btnActive: { backgroundColor: '#3b82f6' },
  txtB: { color: '#3b82f6', fontWeight: 'bold', fontSize: 12 },
  txtW: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  labelSub: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginBottom: 5 },
  avisoBox: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8, marginBottom: 10 },
  avisoTxt: { fontSize: 10, color: '#64748b', fontStyle: 'italic' },
  rowCheck: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  btnFirma: { padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', borderStyle: 'dashed', alignItems: 'center' },
  btnFirmaText: { color: '#3b82f6', fontWeight: 'bold' },
  btnEnviar: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  btnNext: { padding: 12, borderRadius: 8, backgroundColor: '#3b82f6', alignItems: 'center', marginTop: 10 },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#f1f5f9' },
  esperaTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  esperaSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 10 }
});