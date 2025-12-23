import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, LayoutAnimation, Modal, ActivityIndicator, StatusBar } from 'react-native';
import { db, auth } from '../../firebaseConfig'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { FontAwesome5, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';
import AuthScreen from '../AuthScreen'; 
import CoachPanel from './coach'; 

const ENFERMEDADES_BASE = ["Diabetes", "Hipertensión", "Obesidad", "Hipotiroidismo", "Cáncer", "Cardiopatías", "Asma", "Ninguna", "Otra"];
const ANTICONCEPTIVOS = ["Pastillas", "Inyección", "DIU", "Implante", "Parche", "Ninguno"];
const TIPOS_CICLO = ["Regular", "Irregular", "Menopausia"];
const OPCIONES_FRECUENCIA = ["Nunca", "1-3 al mes", "1 a la semana", "2-4 a la semana", "Diario"];
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

  // ESTADOS
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [datosFisicos, setDatosFisicos] = useState({ peso: '', altura: '', edad: '', genero: '' });
  const [medidas, setMedidas] = useState({ cuello: '', pecho: '', brazoR: '', brazoF: '', cintura: '', cadera: '', muslo: '', pierna: '' });
  const [ciclo, setCiclo] = useState({ tipo: '', anticonceptivo: '' });
  const [salud, setSalud] = useState({ enfFam: [] as string[], otrosFam: '', enfPers: [] as string[], otrosPers: '', medicamento: '', lesion: '', detalleLesion: '', operacion: '', detalleOperacion: '' });
  const [ipaq, setIpaq] = useState({ vDias: '', vMin: '', mDias: '', mMin: '', cDias: '', cMin: '', sentado: '' });
  const [nutricion, setNutricion] = useState({ comidasDeseadas: '', comidasActuales: '', descripcionDia: '', entrenos: '', alcohol: '', alcoholFreq: '', sustancias: '', sustanciasFreq: '' });
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
    if (!nombre || !firma || !aceptarTerminos || !aceptarPrivacidad) {
      Alert.alert("Atención", "Por favor completa nombre, firma y acepta términos/privacidad.");
      return;
    }
    try {
      await addDoc(collection(db, "revisiones_pendientes"), {
        uid: user.uid, nombre, telefono, email: user.email, datosFisicos, medidas, ciclo, salud, ipaq, nutricion, frecuenciaAlimentos, objetivo, firma, fechaEnvio: new Date().toLocaleDateString(), timestamp: serverTimestamp()
      });
      setPaso('espera');
    } catch (e) { Alert.alert("Error", "Error al enviar."); }
  };

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
          <TextInput style={styles.input} placeholder="Teléfono" value={telefono} onChangeText={(v)=>setTelefono(v.replace(/\s/g, ''))} keyboardType="phone-pad" />
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Peso (kg)" keyboardType="numeric" onChangeText={v=>setDatosFisicos({...datosFisicos, peso:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Altura (cm)" keyboardType="numeric" onChangeText={v=>setDatosFisicos({...datosFisicos, altura:v})} />
          </View>
          <TextInput style={styles.input} placeholder="Edad" keyboardType="numeric" onChangeText={v=>setDatosFisicos({...datosFisicos, edad:v})} />
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btnG, datosFisicos.genero === 'hombre' && styles.btnActive]} onPress={() => setDatosFisicos({...datosFisicos, genero:'hombre'})}><Text style={datosFisicos.genero === 'hombre' ? styles.txtW : styles.txtB}>HOMBRE</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnG, datosFisicos.genero === 'mujer' && styles.btnActive]} onPress={() => setDatosFisicos({...datosFisicos, genero:'mujer'})}><Text style={datosFisicos.genero === 'mujer' ? styles.txtW : styles.txtB}>MUJER</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(1)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 2. MEDIDAS */}
        <Section num={2} title="Medidas Corporales (CM)" color="#10b981" icon="ruler-horizontal" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cuello" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, cuello:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Pecho" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, pecho:v})} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Brazo R" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, brazoR:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Brazo F" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, brazoF:v})} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cintura" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, cintura:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Cadera" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, cadera:v})} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Muslo" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, muslo:v})} />
            <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Pierna" keyboardType="numeric" onChangeText={v=>setMedidas({...medidas, pierna:v})} />
          </View>
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(2)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 3. CICLO (SOLO MUJER) */}
        {datosFisicos.genero === 'mujer' && (
          <Section num={3} title="Ciclo Menstrual" color="#ec4899" icon="venus" activa={seccionActiva} setActiva={setSeccionActiva}>
            <Text style={styles.labelSub}>Tipo de Ciclo:</Text>
            <View style={styles.rowWrap}>{TIPOS_CICLO.map(t => <TouchableOpacity key={t} style={[styles.chip, ciclo.tipo === t && styles.chipActive]} onPress={()=>setCiclo({...ciclo, tipo:t})}><Text style={ciclo.tipo === t ? styles.txtW : styles.txtB}>{t}</Text></TouchableOpacity>)}</View>
            <Text style={styles.labelSub}>Anticonceptivo:</Text>
            <View style={styles.rowWrap}>{ANTICONCEPTIVOS.map(a => <TouchableOpacity key={a} style={[styles.chip, ciclo.anticonceptivo === a && styles.chipActive]} onPress={()=>setCiclo({...ciclo, anticonceptivo:a})}><Text style={ciclo.anticonceptivo === a ? styles.txtW : styles.txtB}>{a}</Text></TouchableOpacity>)}</View>
            <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(3)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
          </Section>
        )}

        {/* 4. SALUD */}
        <Section num={4} title="Historial Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelSub}>Enfermedades Familiares:</Text>
          <View style={styles.rowWrap}>{ENFERMEDADES_BASE.map(e => <TouchableOpacity key={e} style={[styles.chip, salud.enfFam.includes(e) && styles.chipActive]} onPress={()=>toggleChip(salud.enfFam, e, 'enfFam')}><Text style={salud.enfFam.includes(e) ? styles.txtW : styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
          <Text style={[styles.labelSub, {marginTop:10}]}>Enfermedades Propias:</Text>
          <View style={styles.rowWrap}>{ENFERMEDADES_BASE.map(e => <TouchableOpacity key={e} style={[styles.chip, salud.enfPers.includes(e) && styles.chipActive]} onPress={()=>toggleChip(salud.enfPers, e, 'enfPers')}><Text style={salud.enfPers.includes(e) ? styles.txtW : styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
          <Text style={[styles.labelSub, {marginTop:10}]}>¿Tienes alguna lesión?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, salud.lesion==='si' && styles.btnActive]} onPress={()=>setSalud({...salud, lesion:'si'})}><Text style={salud.lesion==='si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, salud.lesion==='no' && styles.btnActive]} onPress={()=>setSalud({...salud, lesion:'no'})}><Text style={salud.lesion==='no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity></View>
          {salud.lesion==='si' && <TextInput style={styles.input} placeholder="¿Cuál?" onChangeText={v=>setSalud({...salud, detalleLesion:v})} />}
          <Text style={[styles.labelSub, {marginTop:10}]}>¿Has tenido operaciones?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, salud.operacion==='si' && styles.btnActive]} onPress={()=>setSalud({...salud, operacion:'si'})}><Text style={salud.operacion==='si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, salud.operacion==='no' && styles.btnActive]} onPress={()=>setSalud({...salud, operacion:'no'})}><Text style={salud.operacion==='no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity></View>
          {salud.operacion==='si' && <TextInput style={styles.input} placeholder="¿Cuál?" onChangeText={v=>setSalud({...salud, detalleOperacion:v})} />}
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(4)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 5. IPAQ */}
        <Section num={5} title="Estilo Vida (IPAQ)" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelIpaq}>Actividad Vigorosa (Días/Min):</Text>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Días" keyboardType="numeric" onChangeText={v=>setIpaq({...ipaq, vDias:v})}/><TextInput style={[styles.input, {flex:1}]} placeholder="Minutos" keyboardType="numeric" onChangeText={v=>setIpaq({...ipaq, vMin:v})}/></View>
          <Text style={styles.labelIpaq}>Actividad Moderada (Días/Min):</Text>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Días" keyboardType="numeric" onChangeText={v=>setIpaq({...ipaq, mDias:v})}/><TextInput style={[styles.input, {flex:1}]} placeholder="Minutos" keyboardType="numeric" onChangeText={v=>setIpaq({...ipaq, mMin:v})}/></View>
          <Text style={styles.labelIpaq}>Caminata (Días/Min):</Text>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Días" keyboardType="numeric" onChangeText={v=>setIpaq({...ipaq, cDias:v})}/><TextInput style={[styles.input, {flex:1}]} placeholder="Minutos" keyboardType="numeric" onChangeText={v=>setIpaq({...ipaq, cMin:v})}/></View>
          <TextInput style={styles.input} placeholder="¿Cuántas horas pasas sentado al día?" keyboardType="numeric" onChangeText={v=>setIpaq({...ipaq, sentado:v})} />
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(5)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 6. NUTRICIÓN Y HÁBITOS */}
        <Section num={6} title="Nutrición y Hábitos" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelSub}>¿Cuántas comidas haces al día actualmente?</Text>
          <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(n => <TouchableOpacity key={n} style={[styles.chip, nutricion.comidasActuales === n && styles.chipActive]} onPress={()=>setNutricion({...nutricion, comidasActuales:n})}><Text style={nutricion.comidasActuales === n ? styles.txtW : styles.txtB}>{n}</Text></TouchableOpacity>)}</View>
          
          <Text style={styles.labelSub}>Describe brevemente un día de tus comidas:</Text>
          <TextInput style={[styles.input, {height:60}]} multiline onChangeText={v=>setNutricion({...nutricion, descripcionDia:v})} placeholder="Ej: Desayuno huevos, comida pollo..." />

          <Text style={styles.labelSub}>Días de entrenamiento:</Text>
          <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(d => <TouchableOpacity key={d} style={[styles.chip, nutricion.entrenos === d && styles.chipActive]} onPress={()=>setNutricion({...nutricion, entrenos:d})}><Text style={nutricion.entrenos === d ? styles.txtW : styles.txtB}>{d}</Text></TouchableOpacity>)}</View>
          
          <Text style={styles.labelSub}>Describe brevemente tus objetivos deseados:</Text>
          <TextInput style={[styles.input, {height:60}]} multiline onChangeText={setObjetivo} />

          <Text style={styles.labelSub}>¿Cuántas comidas deseas en tu plan?</Text>
          <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(n => <TouchableOpacity key={n} style={[styles.chip, nutricion.comidasDeseadas === n && styles.chipActive]} onPress={()=>setNutricion({...nutricion, comidasDeseadas:n})}><Text style={nutricion.comidasDeseadas === n ? styles.txtW : styles.txtB}>{n}</Text></TouchableOpacity>)}</View>

          <Text style={styles.labelSub}>¿Consumo de alcohol?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, nutricion.alcohol==='si' && styles.btnActive]} onPress={()=>setNutricion({...nutricion, alcohol:'si'})}><Text style={nutricion.alcohol==='si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, nutricion.alcohol==='no' && styles.btnActive]} onPress={()=>setNutricion({...nutricion, alcohol:'no'})}><Text style={nutricion.alcohol==='no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity></View>
          {nutricion.alcohol === 'si' && <View style={styles.rowWrap}>{["Diario", "Semanal", "Mensual", "Social"].map(f => <TouchableOpacity key={f} style={[styles.chip, nutricion.alcoholFreq === f && styles.chipActive]} onPress={()=>setNutricion({...nutricion, alcoholFreq:f})}><Text style={nutricion.alcoholFreq === f ? styles.txtW : styles.txtB}>{f}</Text></TouchableOpacity>)}</View>}

          <Text style={[styles.labelSub, {marginTop:10}]}>¿Consumo de sustancias / fuma?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, nutricion.sustancias==='si' && styles.btnActive]} onPress={()=>setNutricion({...nutricion, sustancias:'si'})}><Text style={nutricion.sustancias==='si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, nutricion.sustancias==='no' && styles.btnActive]} onPress={()=>setNutricion({...nutricion, sustancias:'no'})}><Text style={nutricion.sustancias==='no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity></View>
          {nutricion.sustancias === 'si' && <View style={styles.rowWrap}>{["Diario", "Semanal", "Mensual", "Social"].map(f => <TouchableOpacity key={f} style={[styles.chip, nutricion.sustanciasFreq === f && styles.chipActive]} onPress={()=>setNutricion({...nutricion, sustanciasFreq:f})}><Text style={nutricion.sustanciasFreq === f ? styles.txtW : styles.txtB}>{f}</Text></TouchableOpacity>)}</View>}
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(6)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 7. FRECUENCIA */}
        <Section num={7} title="Frecuencia Alimentos" color="#10b981" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
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
          <TouchableOpacity style={styles.btnNext} onPress={() => siguiente(7)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {/* 8. CONSENTIMIENTO */}
        <Section num={8} title="Consentimiento" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.consentBox}>
            <Text style={styles.consentHeader}>CONSENTIMIENTO INFORMADO PARA LA PARTICIPACIÓN EN UN PROGRAMA DE ENTRENAMIENTO PERSONAL DE ACONDICIONAMIENTO FÍSICO DE ADULTOS APARENTEMENTE SANOS</Text>
            <Text style={styles.miniTxt}>Nombre: {nombre || '________'} | Fecha: {new Date().toLocaleDateString()}</Text>
            <Text style={styles.consentTxt}>
              1. Propósito y explicación de los procedimientos: Mediante este documento acepto voluntariamente participar en un plan de entrenamiento personal de acondicionamiento físico. También acepto tomar parte en las actividades del programa que se me recomienden para la mejora de mi salud... Soy consciente de que se me puede requerir la realización de una prueba graduada de esfuerzo... Me comprometo a realizar 3 veces por semana las sesiones formales...{"\n\n"}
              2. Riesgos: Manifiesto que se me ha informado de que existe la posibilidad, aunque remota, de efectos negativos durante el ejercicio, como alteración de la presión arterial, mareos, trastornos del ritmo cardíaco y casos excepcionales de infarto, derrames o incluso riesgo de muerte...{"\n\n"}
              3. Beneficios: Soy consciente de que este programa puede o no reportar beneficios a mi condición física... Comprendo que la participación me permitirá aprender cómo realizar adecuadamente ejercicios...{"\n\n"}
              4. Confidencialidad: Se me ha informado de que la información obtenida se tratará con máxima confidencialidad... Acepto que se utilice cualquier información con propósito de investigación o estadístico siempre que no pueda llevar a la identificación de mi persona.
            </Text>
          </View>

          <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarTerminos(!aceptarTerminos)}><MaterialCommunityIcons name={aceptarTerminos?"checkbox-marked":"checkbox-blank-outline"} size={22} color="#10b981"/><Text style={styles.miniTxt}>Doy mi autorización expresa a que se lleven a cabo todos los servicios y procedimientos.</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnFirma} onPress={() => setModalFirma(true)}><Text style={styles.btnFirmaText}>{firma ? "✓ Firma Registrada" : "Firma aquí"}</Text></TouchableOpacity>

          <View style={[styles.consentBox, {marginTop:20}]}>
            <Text style={styles.consentHeader}>AVISO DE PRIVACIDAD</Text>
            <Text style={styles.consentTxt}>Tus datos personales, de salud y medidas corporales serán tratados bajo estricta confidencialidad por el Coach Arturo para la creación y seguimiento de tu plan de asesoría.</Text>
            <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarPrivacidad(!aceptarPrivacidad)}><MaterialCommunityIcons name={aceptarPrivacidad?"checkbox-marked":"checkbox-blank-outline"} size={22} color="#10b981"/><Text style={styles.miniTxt}>He leído y acepto el aviso de privacidad.</Text></TouchableOpacity>
          </View>

          {firma && aceptarTerminos && aceptarPrivacidad && <TouchableOpacity style={styles.btnEnviar} onPress={enviarAlCoach}><Text style={styles.txtW}>ENVIAR A MI COACH</Text></TouchableOpacity>}
        </Section>
      </ScrollView>

      <Modal visible={modalFirma} animationType="slide">
        <View style={{flex:1, backgroundColor:'#fff', paddingTop:50}}><SignatureScreen onOK={s=>{setFirma(s); setModalFirma(false);}} descriptionText="Firma"/><TouchableOpacity onPress={() => setModalFirma(false)} style={{padding:20, alignItems:'center'}}><Text style={{color:'red'}}>Cancelar</Text></TouchableOpacity></View>
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
  input: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginVertical: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 1, borderColor: '#3b82f6', marginBottom: 5 },
  chipActive: { backgroundColor: '#3b82f6' },
  btnG: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', alignItems: 'center', marginHorizontal: 4 },
  btnActive: { backgroundColor: '#3b82f6' },
  txtB: { color: '#3b82f6', fontWeight: 'bold', fontSize: 12 },
  txtW: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  labelSub: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginBottom: 5 },
  labelIpaq: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  consentBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginVertical: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  consentHeader: { fontSize: 11, fontWeight: 'bold', color: '#1e293b', marginBottom: 5, textAlign: 'center' },
  consentTxt: { fontSize: 10, color: '#64748b', textAlign: 'justify', lineHeight: 14 },
  btnFirma: { padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', borderStyle: 'dashed', alignItems: 'center', marginVertical: 15 },
  btnFirmaText: { color: '#3b82f6', fontWeight: 'bold' },
  rowCheck: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  miniTxt: { fontSize: 11, color: '#334155', flex: 1 },
  btnEnviar: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 25 },
  btnNext: { padding: 10, borderRadius: 8, backgroundColor: '#3b82f6', alignItems: 'center', marginTop: 10 },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#f1f5f9' },
  esperaTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  esperaSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 10 }
});