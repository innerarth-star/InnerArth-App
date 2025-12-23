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
  const [aceptarPrivacidad, setAceptarPrivacidad] = useState(false);

  // ESTADOS DEL FORMULARIO
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [datosFisicos, setDatosFisicos] = useState({ peso: '', altura: '', edad: '', genero: '' });
  const [medidas, setMedidas] = useState({ cuello: '', cintura: '', brazoR: '', brazoF: '', muslo: '', pierna: '' });
  const [ciclo, setCiclo] = useState({ tipo: '', anticonceptivo: '' });
  const [salud, setSalud] = useState({ enfFam: [] as string[], otrosFam: '', enfPers: [] as string[], otrosPers: '', medicamento: '', lesion: '', detalleLesion: '', operacion: '', detalleOperacion: '' });
  const [ipaq, setIpaq] = useState({ vDias: '', vMin: '', mDias: '', mMin: '', cDias: '', cMin: '', sentado: '' });
  const [nutricion, setNutricion] = useState({ comidas: '', entrenos: '', alcohol: '', alcoholFreq: '', sustancias: '', sustanciasFreq: '' });
  const [frecuenciaAlimentos, setFrecuenciaAlimentos] = useState<any>({});
  const [objetivo, setObjetivo] = useState('');

  const siguiente = (num: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (num === 1 && datosFisicos.genero === 'hombre') {
        setSeccionActiva(3); // Salta ciclo si es hombre
    } else {
        setSeccionActiva(num + 1);
    }
  };

  const enviarAlCoach = async () => {
    if (!nombre || !firma || !aceptarTerminos || !aceptarPrivacidad) {
      Alert.alert("Atención", "Por favor firma y acepta el aviso de privacidad y términos.");
      return;
    }
    try {
      await addDoc(collection(db, "revisiones_pendientes"), {
        uid: user.uid, email: user.email, nombre, telefono, datosFisicos, medidas, ciclo, salud, ipaq, nutricion, frecuenciaAlimentos, objetivo, firma, timestamp: serverTimestamp()
      });
      setPaso('espera');
    } catch (e) { Alert.alert("Error", "No se pudo enviar."); }
  };

  if (paso === 'espera') {
    return (
      <View style={styles.esperaContainer}>
        <FontAwesome5 name="check-circle" size={80} color="#10b981" />
        <Text style={styles.esperaTitle}>¡Enviado!</Text>
        <Text style={styles.esperaSub}>Arturo ya tiene tu información. ¡A darle!</Text>
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
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(1)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {datosFisicos.genero === 'mujer' && (
          <Section num={2} title="Ciclo Menstrual" color="#ec4899" icon="female" activa={seccionActiva} setActiva={setSeccionActiva}>
            <Text style={styles.labelSub}>Tipo de Ciclo:</Text>
            <View style={styles.rowWrap}>{TIPOS_CICLO.map(t => <TouchableOpacity key={t} style={[styles.chip, ciclo.tipo === t && styles.chipActive]} onPress={()=>setCiclo({...ciclo, tipo:t})}><Text style={ciclo.tipo === t ? styles.txtW : styles.txtB}>{t}</Text></TouchableOpacity>)}</View>
            <Text style={styles.labelSub}>Anticonceptivo:</Text>
            <View style={styles.rowWrap}>{ANTICONCEPTIVOS.map(a => <TouchableOpacity key={a} style={[styles.chip, ciclo.anticonceptivo === a && styles.chipActive]} onPress={()=>setCiclo({...ciclo, anticonceptivo:a})}><Text style={ciclo.anticonceptivo === a ? styles.txtW : styles.txtB}>{a}</Text></TouchableOpacity>)}</View>
            <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(2)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
          </Section>
        )}

        <Section num={3} title="Medidas Corporales" color="#10b981" icon="ruler-horizontal" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cuello" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, cuello:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Cintura" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, cintura:v})} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Brazo R" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, brazoR:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Brazo F" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, brazoF:v})} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Muslo" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, muslo:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Pierna" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, pierna:v})} />
          </View>
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(3)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={4} title="Historial Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelSub}>Enfermedades Familiares:</Text>
          <View style={styles.rowWrap}>{ENFERMEDADES_BASE.map(e => <TouchableOpacity key={e} style={[styles.chip, salud.enfFam.includes(e) && styles.chipActive]} onPress={()=>{
            let list = salud.enfFam.includes(e) ? salud.enfFam.filter(i=>i!==e) : [...salud.enfFam, e];
            setSalud({...salud, enfFam: list});
          }}><Text style={salud.enfFam.includes(e) ? styles.txtW : styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
          {salud.enfFam.includes('Otra') && <TextInput style={styles.input} placeholder="¿Cuál?" onChangeText={v=>setSalud({...salud, otrosFam:v})} />}

          <Text style={[styles.labelSub, {marginTop:10}]}>¿Tienes alguna lesión?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, salud.lesion==='si' && styles.btnActive]} onPress={()=>setSalud({...salud, lesion:'si'})}><Text style={salud.lesion==='si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, salud.lesion==='no' && styles.btnActive]} onPress={()=>setSalud({...salud, lesion:'no'})}><Text style={salud.lesion==='no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity></View>
          {salud.lesion==='si' && <TextInput style={styles.input} placeholder="Especifique lesión" onChangeText={v=>setSalud({...salud, detalleLesion:v})} />}

          <Text style={[styles.labelSub, {marginTop:10}]}>¿Has tenido operaciones?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, salud.operacion==='si' && styles.btnActive]} onPress={()=>setSalud({...salud, operacion:'si'})}><Text style={salud.operacion==='si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, salud.operacion==='no' && styles.btnActive]} onPress={()=>setSalud({...salud, operacion:'no'})}><Text style={salud.operacion==='no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity></View>
          {salud.operacion==='si' && <TextInput style={styles.input} placeholder="Especifique operación" onChangeText={v=>setSalud({...salud, detalleOperacion:v})} />}
          
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(4)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={5} title="Estilo Vida (IPAQ)" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelIpaq}>Actividad Vigorosa (Días / Min al día):</Text>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Días" keyboardType="numeric" onChangeText={v=>setIpaq({...ipaq, vDias:v})}/><TextInput style={[styles.input, {flex:1}]} placeholder="Minutos" keyboardType="numeric" onChangeText={v=>setIpaq({...ipaq, vMin:v})}/></View>
          <Text style={styles.labelIpaq}>Actividad Moderada (Días / Min al día):</Text>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Días" keyboardType="numeric" onChangeText={v=>setIpaq({...ipaq, mDias:v})}/><TextInput style={[styles.input, {flex:1}]} placeholder="Minutos" keyboardType="numeric" onChangeText={v=>setIpaq({...ipaq, mMin:v})}/></View>
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(5)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={6} title="Nutrición y Hábitos" color="#8b5cf6" icon="glass-whiskey" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelSub}>Comidas al día:</Text>
          <View style={styles.rowWrap}>{["3", "4", "5", "6+"].map(n => <TouchableOpacity key={n} style={[styles.chip, nutricion.comidas === n && styles.chipActive]} onPress={()=>setNutricion({...nutricion, comidas:n})}><Text style={nutricion.comidas === n ? styles.txtW : styles.txtB}>{n}</Text></TouchableOpacity>)}</View>
          <Text style={styles.labelSub}>Días de entrenamiento:</Text>
          <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(d => <TouchableOpacity key={d} style={[styles.chip, nutricion.entrenos === d && styles.chipActive]} onPress={()=>setNutricion({...nutricion, entrenos:d})}><Text style={nutricion.entrenos === d ? styles.txtW : styles.txtB}>{d}</Text></TouchableOpacity>)}</View>
          
          <Text style={styles.labelSub}>¿Consumo de alcohol?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, nutricion.alcohol==='si' && styles.btnActive]} onPress={()=>setNutricion({...nutricion, alcohol:'si'})}><Text style={nutricion.alcohol==='si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, nutricion.alcohol==='no' && styles.btnActive]} onPress={()=>setNutricion({...nutricion, alcohol:'no'})}><Text style={nutricion.alcohol==='no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity></View>
          {nutricion.alcohol === 'si' && <View style={styles.rowWrap}>{["Diario", "Semanal", "Mensual", "Social"].map(f => <TouchableOpacity key={f} style={[styles.chip, nutricion.alcoholFreq === f && styles.chipActive]} onPress={()=>setNutricion({...nutricion, alcoholFreq:f})}><Text style={nutricion.alcoholFreq === f ? styles.txtW : styles.txtB}>{f}</Text></TouchableOpacity>)}</View>}

          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(6)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={7} title="Frecuencia Alimentos" color="#10b981" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
          {LISTA_ALIMENTOS_FRECUENCIA.map(ali => (
            <View key={ali} style={{marginBottom:10}}>
              <Text style={{fontSize:12, fontWeight:'bold', marginBottom:5}}>{ali}:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {OPCIONES_FRECUENCIA.map(op => (
                  <TouchableOpacity key={op} style={[styles.chip, frecuenciaAlimentos[ali] === op && styles.chipActive]} onPress={()=>setFrecuenciaAlimentos({...frecuenciaAlimentos, [ali]:op})}><Text style={{fontSize:10, color: frecuenciaAlimentos[ali]===op ? '#fff' : '#3b82f6'}}>{op}</Text></TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(7)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={8} title="Consentimiento" color="#1e293b" icon="file-contract" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelSub}>Describe tus objetivos brevemente:</Text>
          <TextInput style={[styles.input, {height:60}]} multiline onChangeText={setObjetivo} />
          
          <View style={styles.consentBox}>
            <Text style={styles.consentTxt}>Por la presente, autorizo a FitTech y al Coach Arturo el manejo de mis datos para mi asesoría nutricional y deportiva. Entiendo que los resultados dependen de mi compromiso.</Text>
          </View>
          
          <TouchableOpacity style={styles.btnFirma} onPress={() => setModalFirma(true)}>
            <Text style={styles.btnFirmaText}>{firma ? "✓ Consentimiento Firmado" : "Firma aquí"}</Text>
          </TouchableOpacity>

          <View style={styles.rowCheck}><TouchableOpacity onPress={()=>setAceptarTerminos(!aceptarTerminos)}><MaterialCommunityIcons name={aceptarTerminos?"checkbox-marked":"checkbox-blank-outline"} size={22} color="#10b981"/></TouchableOpacity><Text style={styles.miniTxt}>Acepto términos y condiciones.</Text></View>
          <View style={styles.rowCheck}><TouchableOpacity onPress={()=>setAceptarPrivacidad(!aceptarPrivacidad)}><MaterialCommunityIcons name={aceptarPrivacidad?"checkbox-marked":"checkbox-blank-outline"} size={22} color="#10b981"/></TouchableOpacity><Text style={styles.miniTxt}>He leído el aviso de privacidad.</Text></View>

          {firma && aceptarTerminos && aceptarPrivacidad && <TouchableOpacity style={styles.btnEnviar} onPress={enviarAlCoach}><Text style={styles.txtW}>ENVIAR A MI COACH</Text></TouchableOpacity>}
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
  scroll: { padding: 15, paddingBottom: 60 },
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
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginVertical: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 1, borderColor: '#3b82f6' },
  chipActive: { backgroundColor: '#3b82f6' },
  btnG: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', alignItems: 'center', marginHorizontal: 4 },
  btnActive: { backgroundColor: '#3b82f6' },
  txtB: { color: '#3b82f6', fontWeight: 'bold', fontSize: 12 },
  txtW: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  labelSub: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  labelIpaq: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  consentBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginVertical: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  consentTxt: { fontSize: 10, color: '#64748b', textAlign: 'justify' },
  btnFirma: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', borderStyle: 'dashed', alignItems: 'center', marginVertical: 10 },
  btnFirmaText: { color: '#3b82f6', fontWeight: 'bold' },
  rowCheck: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  miniTxt: { fontSize: 11, color: '#334155' },
  btnEnviar: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnNext: { padding: 10, borderRadius: 8, backgroundColor: '#3b82f6', alignItems: 'center', marginTop: 10 },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#f1f5f9' },
  esperaTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  esperaSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 10 }
});