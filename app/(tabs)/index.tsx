import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, LayoutAnimation, Modal, ActivityIndicator, StatusBar } from 'react-native';
import { db, auth } from '../../firebaseConfig'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { FontAwesome5, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';
import AuthScreen from '../AuthScreen'; 
import CoachPanel from './coach'; 

const ENFERMEDADES = ["Diabetes", "Hipertensión", "Obesidad", "Hipotiroidismo", "Cáncer", "Cardiopatías", "Asma", "Ninguna", "Otra"];
const ANTICONCEPTIVOS = ["Pastillas", "Inyección", "DIU", "Implante", "Parche", "Ninguno"];
const TIPOS_CICLO = ["Regular", "Irregular", "Menopausia"];
const FRECUENCIAS = ["Nunca", "1-3 al mes", "1 a la semana", "2 a 4 a la semana", "Diario"];
const ALIMENTOS = ["Frutas", "Verduras", "Leche", "Yogurt", "Quesos", "Embutidos", "Huevo", "Carnes", "Pescado", "Leguminosas"];

export default function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'coach' | 'alumno' | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const CORREO_COACH = "inner.arth@gmail.com"; 

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usuario) => {
      if (usuario) {
        setUser(usuario);
        setRole(usuario.email?.toLowerCase().trim() === CORREO_COACH ? 'coach' : 'alumno');
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

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [datosFisicos, setDatosFisicos] = useState({ peso: '', altura: '', edad: '', genero: '' });
  const [medidas, setMedidas] = useState({ cuello: '', pecho: '', brazoR: '', brazoF: '', cintura: '', cadera: '', muslo: '', pierna: '' });
  const [ciclo, setCiclo] = useState({ tipo: '', anticonceptivo: '' });
  const [salud, setSalud] = useState({ enfFam: [] as string[], otrosFam: '', enfPers: [] as string[], otrosPers: '', medicamento: '', lesion: '', detalleLesion: '', operacion: '', detalleOperacion: '' });
  const [ipaq, setIpaq] = useState({ vDias: '', vMin: '', mDias: '', mMin: '', cDias: '', cMin: '', sentado: '' });
  const [nutricion, setNutricion] = useState({ comidasAct: '', desc: '', alc: '', alcF: '', sust: '', sustF: '', comidasDes: '', ent: '', obj: '' });
  const [frecuenciaAlimentos, setFrecuenciaAlimentos] = useState<any>({});

  const enviarAlCoach = async () => {
    if (!nombre || !firma || !aceptarTerminos || !aceptarPrivacidad || !datosFisicos.edad) {
      Alert.alert("Atención", "Faltan campos obligatorios.");
      return;
    }
    try {
      await addDoc(collection(db, "revisiones_pendientes"), {
        uid: user.uid, nombre, telefono, email: user.email, datosFisicos, medidas, ciclo, salud, ipaq, nutricion, frecuenciaAlimentos, firma, timestamp: serverTimestamp()
      });
      setPaso('espera');
    } catch (e) { Alert.alert("Error", "Error al enviar."); }
  };

  if (paso === 'espera') {
    return (
      <View style={styles.esperaContainer}>
        <FontAwesome5 name="check-circle" size={80} color="#10b981" />
        <Text style={styles.esperaTitle}>¡Enviado!</Text>
        <Text style={styles.esperaSub}>Tu Coach Arturo ya tiene tu información.</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={{marginTop:20}}><Text style={{color:'#ef4444'}}>Cerrar Sesión</Text></TouchableOpacity>
      </View>
    );
  }

  const TEXTO_CONSENTIMIENTO = `Nombre: ${nombre || '________'}
1. Propósito y explicación de los procedimientos: Mediante este documento acepto voluntariamente participar en un plan de entrenamiento personal de acondicionamiento físico. También acepto tomar parte en las actividades del programa de entrenamiento personal que se me recomienden para la mejora de mi salud y bienestar general. Estas pueden incluir asesoramiento dietético, gestión del estrés y actividades formativas sobre salud y acondicionamiento físico. Los niveles de intensidad del ejercicio que se realizará se basarán en mi capacidad cardiorrespiratoria (corazón y pulmones) y muscular. Soy consciente de que se me puede requerir la realización de una prueba graduada de esfuerzo, así como otras pruebas físicas antes del comienzo del programa de entrenamiento personal para poder valorar y evaluar mi estado físico actual. Se me darán las instrucciones concretas en cuanto al tipo y volumen de ejercicio que debería realizar. Me comprometo a realizar 3 veces por semana las sesiones formales del programa. Entrenadores capacitados para ello dirigirán mis actividades, controlarán mi rendimiento y evaluarán mi esfuerzo. Según mi estado de salud, se me podrá requerir durante las sesiones un control de la presión arterial y la frecuencia cardíaca para mantener la intensidad dentro de unos límites deseables. Soy consciente de que se espera mi asistencia a todas las sesiones y que siga las instrucciones del personal relativas al ejercicio, la dieta, la gestión del estrés y otros programas relacionados (salud / acondicionamiento físico). En caso de estar tomando medicamentos, ya he informado de ello al personal del programa y me comprometo a comunicarles de inmediato cualquier cambio al respecto tanto por mi parte como por parte del médico. En caso de que sea conveniente, se me valorará y evaluará periódicamente a intervalos regulares tras el inicio del programa. Se me ha informado de que durante mi participación en este programa de entrenamiento personal se me pedirá que complete las actividades físicas salvo en caso de síntomas como fatiga, falta de aire, molestias en la zona pectoral o similares. Llegados a ese punto, se me ha informado de que tengo el derecho de disminuir la intensidad o poner fin al ejercicio y de que estoy obligado a informar al personal del programa de entrenamiento personal de mis síntomas. Así, declaro que se me ha informado de ello y me comprometo a informar al personal encargado de mi entrenamiento de mis síntomas, si se llegaran a producir. Soy consciente de que, durante el ejercicio, un entrenador personal supervisará periódicamente mi rendimiento con la posibilidad de que controle mi pulso y mi presión arterial o de que valore mi percepción del esfuerzo para así controlar mi progreso. Asimismo, soy consciente de que el entrenador personal puede reducir la intensidad o poner fin al programa de ejercicios para mi seguridad y beneficio según los parámetros anteriormente mencionados. También se me ha comunicado que durante el transcurso de mi programa de entrenamiento personal puede ser necesario el contacto físico y una colocación corporal adecuada de mi cuerpo para evaluar las reacciones musculares y corporales a ejercicios concretos, además de para asegurar que utilizo la técnica y postura adecuadas. Por ello doy mi autorización expresa para que se produzca el contacto físico por estos motivos. 
2. Riesgos: Manifiesto que se me ha informado de que existe la posibilidad, aunque remota, de efectos negativos durante el ejercicio, como por ejemplo (y sin excluir otros) alteración de la presión arterial, mareos, trastornos del ritmo cardíaco y casos excepcionales de infarto, derrames o incluso riesgo de muerte. Asimismo, se me ha explicado que existe el riesgo de lesiones corporales, como por ejemplo (sin excluir otras) lesiones musculares, de ligamentos, tendones y articulaciones. Se me ha comunicado que se pondrán todos los medios disponibles para minimizar que estas incidencias se produzcan mediante controles adecuados de mi estado antes de cada sesión de entrenamiento y supervisión del personal durante el ejercicio, así como de mi prudencia frente al esfuerzo. Conozco perfectamente los riesgos asociados con el ejercicio, como lesiones corporales, infartos, derrames e incluso la muerte, y aun conociendo estos riesgos, deseo tomar parte como ya he manifestado. 
3. Beneficios que cabe esperar y alternativas disponibles a la prueba de esfuerzo: Soy consciente de que este programa puede o no reportar beneficios a mi condición física o salud general. Comprendo que la participación en sesiones de ejercicio y entrenamiento personal me permitirá aprender cómo realizar adecuadamente ejercicios de acondicionamiento físico, usar los diversos aparatos y regular el esfuerzo físico. Por tanto, debería sacar provecho de estas experiencias, ya que indicarían la manera en que mis limitaciones físicas pueden afectar mi capacidad de realizar las diversas actividades físicas. Soy asimismo consciente de que si sigo cuidadosamente las instrucciones del programa mejoraré con toda probabilidad mi capacidad para el ejercicio físico y mi forma física tras un período de 3 a 6 meses. 
4. Confidencialidad y uso de la información: Se me ha informado de que la información obtenida durante este programa de entrenamiento personal se tratará con máxima confidencialidad y, en consecuencia, no se proporcionará o revelará a nadie sin mi consentimiento expreso por escrito. Acepto, en cambio, que se utilice cualquier información con propósito de investigación o estadístico siempre que no pueda llevar a la identificación de mi persona. También apruebo el uso de cualquier información con el propósito de consulta con otros profesionales de la salud o del fitness, incluido mi médico. En cambio, cualquier otra información obtenida se utilizará por parte del personal del programa únicamente por razones de prescripción de ejercicio y evaluación de mi progreso en el programa. Confirmo que he leído este documento en su totalidad o que se me ha leído en caso de no ser capaz de leerlo personalmente. Doy mi autorización expresa a que se lleven a cabo todos los servicios y procedimientos tal y como me ha comunicado el personal del programa.`;

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
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(2)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={2} title="Medidas (CM)" color="#10b981" icon="ruler" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cuello" onChangeText={v=>setMedidas({...medidas, cuello:v})} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Pecho" onChangeText={v=>setMedidas({...medidas, pecho:v})} /></View>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Brazo R" onChangeText={v=>setMedidas({...medidas, brazoR:v})} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Brazo F" onChangeText={v=>setMedidas({...medidas, brazoF:v})} /></View>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cintura" onChangeText={v=>setMedidas({...medidas, cintura:v})} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Cadera" onChangeText={v=>setMedidas({...medidas, cadera:v})} /></View>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Muslo" onChangeText={v=>setMedidas({...medidas, muslo:v})} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Pierna" onChangeText={v=>setMedidas({...medidas, pierna:v})} /></View>
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(3)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {datosFisicos.genero === 'mujer' && (
          <Section num={3} title="Ciclo" color="#ec4899" icon="venus" activa={seccionActiva} setActiva={setSeccionActiva}>
            <View style={styles.rowWrap}>{TIPOS_CICLO.map(t => <TouchableOpacity key={t} style={[styles.chip, ciclo.tipo === t && styles.chipActive]} onPress={()=>setCiclo({...ciclo, tipo:t})}><Text style={ciclo.tipo === t ? styles.txtW : styles.txtB}>{t}</Text></TouchableOpacity>)}</View>
            <Text style={styles.labelSub}>Anticonceptivo:</Text>
            <View style={styles.rowWrap}>{ANTICONCEPTIVOS.map(a => <TouchableOpacity key={a} style={[styles.chip, ciclo.anticonceptivo === a && styles.chipActive]} onPress={()=>setCiclo({...ciclo, anticonceptivo:a})}><Text style={ciclo.anticonceptivo === a ? styles.txtW : styles.txtB}>{a}</Text></TouchableOpacity>)}</View>
            <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(4)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
          </Section>
        )}

        <Section num={4} title="Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelSub}>Familiares/Propias:</Text>
          <View style={styles.rowWrap}>{ENFERMEDADES.map(e => <TouchableOpacity key={e} style={[styles.chip, salud.enfFam.includes(e) && styles.chipActive]} onPress={()=>{let n = salud.enfFam.includes(e)?salud.enfFam.filter(x=>x!==e):[...salud.enfFam, e]; setSalud({...salud, enfFam:n})}}><Text style={salud.enfFam.includes(e)?styles.txtW:styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
          <Text style={styles.labelSub}>¿Lesión/Operación?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, salud.lesion==='si' && styles.btnActive]} onPress={()=>setSalud({...salud, lesion:'si'})}><Text style={salud.lesion==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, salud.lesion==='no' && styles.btnActive]} onPress={()=>setSalud({...salud, lesion:'no'})}><Text style={salud.lesion==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity></View>
          {salud.lesion==='si' && <TextInput style={styles.input} placeholder="¿Cuál?" onChangeText={v=>setSalud({...salud, detalleLesion:v})} />}
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(5)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={5} title="IPAQ" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={styles.input} placeholder="Vigorosa (Días/Min)" onChangeText={v=>setIpaq({...ipaq, vMin:v})} />
          <TextInput style={styles.input} placeholder="Moderada (Días/Min)" onChangeText={v=>setIpaq({...ipaq, mMin:v})} />
          <TextInput style={styles.input} placeholder="Caminata (Días/Min)" onChangeText={v=>setIpaq({...ipaq, cMin:v})} />
          <TextInput style={styles.input} placeholder="Horas sentado" onChangeText={v=>setIpaq({...ipaq, sentado:v})} />
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(6)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={6} title="Nutrición" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelSub}>Comidas actuales (3-6):</Text>
          <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(n => <TouchableOpacity key={n} style={[styles.chip, nutricion.comidasAct === n && styles.chipActive]} onPress={()=>setNutricion({...nutricion, comidasAct:n})}><Text style={nutricion.comidasAct === n ? styles.txtW : styles.txtB}>{n}</Text></TouchableOpacity>)}</View>
          <TextInput style={styles.input} placeholder="Describe tus comidas" onChangeText={v=>setNutricion({...nutricion, desc:v})} />
          <Text style={styles.labelSub}>¿Alcohol/Sustancias?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, nutricion.alc==='si' && styles.btnActive]} onPress={()=>setNutricion({...nutricion, alc:'si'})}><Text style={nutricion.alc==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, nutricion.alc==='no' && styles.btnActive]} onPress={()=>setNutricion({...nutricion, alc:'no'})}><Text style={nutricion.alc==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity></View>
          {nutricion.alc === 'si' && <TextInput style={styles.input} placeholder="Frecuencia" onChangeText={v=>setNutricion({...nutricion, alcF:v})} />}
          <Text style={styles.labelSub}>Comidas deseadas/Entrenos (3-6):</Text>
          <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(n => <TouchableOpacity key={n} style={[styles.chip, nutricion.comidasDes === n && styles.chipActive]} onPress={()=>setNutricion({...nutricion, comidasDes:n})}><Text style={nutricion.comidasDes === n ? styles.txtW : styles.txtB}>{n}</Text></TouchableOpacity>)}</View>
          <TextInput style={styles.input} placeholder="Objetivos" onChangeText={v=>setNutricion({...nutricion, obj:v})} />
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(7)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={7} title="Frecuencia" color="#10b981" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
          {ALIMENTOS.map(ali => (
            <View key={ali} style={{marginBottom:10}}>
              <Text style={{fontSize:12, fontWeight:'bold'}}>{ali}:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {FRECUENCIAS.map(op => (
                  <TouchableOpacity key={op} style={[styles.chip, frecuenciaAlimentos[ali] === op && styles.chipActive]} onPress={()=>setFrecuenciaAlimentos({...frecuenciaAlimentos, [ali]:op})}><Text style={{fontSize:10, color: frecuenciaAlimentos[ali]===op ? '#fff' : '#3b82f6'}}>{op}</Text></TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(8)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={8} title="Consentimiento" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.consentBox}>
            <Text style={styles.consentHeader}>CONSENTIMIENTO INFORMADO PARA LA PARTICIPACIÓN EN UN PROGRAMA DE ENTRENAMIENTO PERSONAL DE ACONDICIONAMIENTO FÍSICO...</Text>
            <Text style={styles.miniTxt}>Fecha: {new Date().toLocaleDateString()}</Text>
            <Text style={styles.consentTxt}>{TEXTO_CONSENTIMIENTO}</Text>
          </View>
          <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarTerminos(!aceptarTerminos)}><MaterialCommunityIcons name={aceptarTerminos?"checkbox-marked":"checkbox-blank-outline"} size={22} color="#10b981"/><Text style={styles.miniTxt}>Acepto y doy mi autorización expresa.</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnFirma} onPress={() => setModalFirma(true)}><Text style={styles.btnFirmaText}>{firma ? "✓ Firma Registrada" : "Firma aquí"}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(9)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={9} title="Privacidad" color="#64748b" icon="shield-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.consentBox}><Text style={styles.consentTxt}>Tus datos serán tratados conforme a la ley por el responsable Coach Arturo para los fines de tu asesoría.</Text></View>
          <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarPrivacidad(!aceptarPrivacidad)}><MaterialCommunityIcons name={aceptarPrivacidad?"checkbox-marked":"checkbox-blank-outline"} size={22} color="#10b981"/><Text style={styles.miniTxt}>He leído y acepto el aviso de privacidad.</Text></TouchableOpacity>
          {firma && aceptarTerminos && aceptarPrivacidad && (
            <TouchableOpacity style={styles.btnEnviar} onPress={enviarAlCoach}><Text style={styles.txtW}>ENVIAR A MI COACH ARTURO</Text></TouchableOpacity>
          )}
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
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
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
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 1, borderColor: '#3b82f6' },
  chipActive: { backgroundColor: '#3b82f6' },
  btnG: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', alignItems: 'center', marginHorizontal: 4 },
  btnActive: { backgroundColor: '#3b82f6' },
  txtB: { color: '#3b82f6', fontWeight: 'bold', fontSize: 12 },
  txtW: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  labelSub: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginBottom: 5 },
  labelIpaq: { fontSize: 11, color: '#64748b' },
  consentBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginVertical: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  consentHeader: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  consentTxt: { fontSize: 10, color: '#64748b', textAlign: 'justify' },
  btnFirma: { padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', borderStyle: 'dashed', alignItems: 'center', marginVertical: 15 },
  btnFirmaText: { color: '#3b82f6', fontWeight: 'bold' },
  rowCheck: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  miniTxt: { fontSize: 11, flex: 1 },
  btnEnviar: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 25 },
  btnNext: { padding: 10, borderRadius: 8, backgroundColor: '#3b82f6', alignItems: 'center', marginTop: 10 },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#f1f5f9' },
  esperaTitle: { fontSize: 24, fontWeight: 'bold' },
  esperaSub: { fontSize: 14, color: '#64748b', textAlign: 'center' }
});