import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, StatusBar } from 'react-native';
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
const OPCIONES_FRECUENCIA = ["Nunca", "1-3 al mes", "1 a la semana", "2 a 4 a la semana", "Diario"];
const LISTA_ALIMENTOS_FRECUENCIA = ["Frutas", "Verduras", "Leche", "Yogurt", "Quesos", "Embutidos", "Huevo", "Carnes", "Pescado", "Leguminosas"];

export default function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'coach' | 'alumno' | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const CORREO_COACH = "inner.arth@gmail.com"; 

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        // ACTUALIZAR EL ESTADO DEL USUARIO PARA VER SI YA VERIFICÓ
        await usuario.reload(); 
        const userActualizado = auth.currentUser;

        if (userActualizado?.emailVerified || userActualizado?.email?.toLowerCase().trim() === CORREO_COACH) {
          setUser(userActualizado);
          setRole(userActualizado.email?.toLowerCase().trim() === CORREO_COACH ? 'coach' : 'alumno');
        } else {
          // Si no está verificado, lo tratamos como si no estuviera logueado
          // para que regrese a la AuthScreen y vea el aviso
          setUser(null);
          setRole(null);
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
  
  // Si no hay usuario (o no está verificado), va a la pantalla de entrada
  if (!user) return <AuthScreen />;
  
  if (role === 'coach') return <CoachPanel />;

  return <ClienteScreen user={user} />;
}

function ClienteScreen({ user }: { user: any }) {
  const [paso, setPaso] = useState<'formulario' | 'espera'>('formulario');
  const [cargandoStatus, setCargandoStatus] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState<number | null>(1);
  const [modalFirma, setModalFirma] = useState(false);
  const [firma, setFirma] = useState<string | null>(null);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [aceptarPrivacidad, setAceptarPrivacidad] = useState(false);

  // ESTADOS PERSISTENTES
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [cuello, setCuello] = useState('');
  const [pecho, setPecho] = useState('');
  const [brazoR, setBrazoR] = useState('');
  const [brazoF, setBrazoF] = useState('');
  const [cintura, setCintura] = useState('');
  const [cadera, setCadera] = useState('');
  const [muslo, setMuslo] = useState('');
  const [pierna, setPierna] = useState('');
  const [tipoCiclo, setTipoCiclo] = useState('');
  const [anticonceptivo, setAnticonceptivo] = useState('');
  const [enfFam, setEnfFam] = useState<string[]>([]);
  const [otrosFam, setOtrosFam] = useState('');
  const [enfPers, setEnfPers] = useState<string[]>([]);
  const [otrosPers, setOtrosPers] = useState('');
  const [lesion, setLesion] = useState('');
  const [detalleLesion, setDetalleLesion] = useState('');
  const [operacion, setOperacion] = useState('');
  const [detalleOperacion, setDetalleOperacion] = useState('');
  const [vDias, setVDias] = useState('');
  const [vMin, setVMin] = useState('');
  const [mDias, setMDias] = useState('');
  const [mMin, setMMin] = useState('');
  const [cDias, setCDias] = useState('');
  const [cMin, setCMin] = useState('');
  const [sentado, setSentado] = useState('');
  const [comidasAct, setComidasAct] = useState('');
  const [descAct, setDescAct] = useState('');
  const [alcohol, setAlcohol] = useState('');
  const [alcoholFreq, setAlcoholFreq] = useState('');
  const [sust, setSust] = useState('');
  const [sustFreq, setSustFreq] = useState('');
  const [comidasDes, setComidasDes] = useState('');
  const [entrenos, setEntrenos] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [frecuenciaAlimentos, setFrecuenciaAlimentos] = useState<any>({});

  // VERIFICAR SI YA EXISTE UN ENVÍO PREVIO
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const q = query(collection(db, "revisiones_pendientes"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setPaso('espera');
        }
      } catch (e) { console.log(e); }
      setCargandoStatus(false);
    };
    checkStatus();
  }, [user]);

  const enviarAlCoach = async () => {
    if (!nombre || !firma || !aceptarTerminos || !aceptarPrivacidad || !edad) {
      Alert.alert("Atención", "Por favor completa Nombre, Edad, Firma y acepta los avisos legales.");
      return;
    }
    try {
      await addDoc(collection(db, "revisiones_pendientes"), {
        uid: user.uid, nombre, telefono, email: user.email, 
        datosFisicos: { peso, altura, edad, genero },
        medidas: { cuello, pecho, brazoR, brazoF, cintura, cadera, muslo, pierna },
        ciclo: { tipo: tipoCiclo, anticonceptivo },
        salud: { enfFam, otrosFam, enfPers, otrosPers, lesion, detalleLesion, operacion, detalleOperacion },
        ipaq: { vDias, vMin, mDias, mMin, cDias, cMin, sentado },
        nutricion: { comidasAct, descAct, alcohol, alcoholFreq, sust, sustFreq, comidasDes, entrenos, objetivo },
        frecuenciaAlimentos, firma, timestamp: serverTimestamp()
      });
      setPaso('espera');
    } catch (e) { Alert.alert("Error", "No se pudo enviar."); }
  };

  if (cargandoStatus) return <View style={styles.esperaContainer}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  if (paso === 'espera') {
    return (
      <View style={styles.esperaContainer}>
        <FontAwesome5 name="clock" size={80} color="#f59e0b" />
        <Text style={styles.esperaTitle}>¡Check-in en Revisión!</Text>
        <Text style={styles.esperaSub}>Tu información ya fue enviada. Tu Coach la está revisando para asignarte tu plan.</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={{marginTop:30, backgroundColor:'#ef4444', padding:10, borderRadius:8}}><Text style={{color:'#fff', fontWeight:'bold'}}>Cerrar Sesión</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Check-in FitTech</Text>

        <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
          <TextInput style={styles.input} placeholder="Nombre Completo" value={nombre} onChangeText={setNombre} />
          <TextInput 
            style={styles.input} 
            placeholder="Teléfono (10 dígitos)" 
            value={telefono} 
            onChangeText={(v) => { if (v.length <= 10) setTelefono(v.replace(/[^0-9]/g, '')) }} 
            keyboardType="numeric" 
            maxLength={10}
          />
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Peso (kg)" value={peso} keyboardType="numeric" onChangeText={setPeso} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Altura (cm)" value={altura} keyboardType="numeric" onChangeText={setAltura} /></View>
          <TextInput style={styles.input} placeholder="Edad" value={edad} keyboardType="numeric" onChangeText={setEdad} />
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btnG, genero === 'hombre' && styles.btnActive]} onPress={() => setGenero('hombre')}><Text style={genero === 'hombre' ? styles.txtW : styles.txtB}>HOMBRE</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnG, genero === 'mujer' && styles.btnActive]} onPress={() => setGenero('mujer')}><Text style={genero === 'mujer' ? styles.txtW : styles.txtB}>MUJER</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(2)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={2} title="Medidas Corporales (CM)" color="#10b981" icon="ruler-horizontal" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cuello" value={cuello} keyboardType="numeric" onChangeText={setCuello} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Pecho" value={pecho} keyboardType="numeric" onChangeText={setPecho} /></View>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Brazo R" value={brazoR} keyboardType="numeric" onChangeText={setBrazoR} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Brazo F" value={brazoF} keyboardType="numeric" onChangeText={setBrazoF} /></View>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cintura" value={cintura} keyboardType="numeric" onChangeText={setCintura} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Cadera" value={cadera} keyboardType="numeric" onChangeText={setCadera} /></View>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Muslo" value={muslo} keyboardType="numeric" onChangeText={setMuslo} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Pierna" value={pierna} keyboardType="numeric" onChangeText={setPierna} /></View>
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(genero === 'mujer' ? 3 : 4)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        {genero === 'mujer' && (
          <Section num={3} title="Ciclo Menstrual" color="#ec4899" icon="venus" activa={seccionActiva} setActiva={setSeccionActiva}>
            <View style={styles.rowWrap}>{TIPOS_CICLO.map(t => <TouchableOpacity key={t} style={[styles.chip, tipoCiclo === t && styles.chipActive]} onPress={()=>setTipoCiclo(t)}><Text style={tipoCiclo === t ? styles.txtW : styles.txtB}>{t}</Text></TouchableOpacity>)}</View>
            <Text style={styles.labelSub}>Anticonceptivo:</Text>
            <View style={styles.rowWrap}>{ANTICONCEPTIVOS.map(a => <TouchableOpacity key={a} style={[styles.chip, anticonceptivo === a && styles.chipActive]} onPress={()=>setAnticonceptivo(a)}><Text style={anticonceptivo === a ? styles.txtW : styles.txtB}>{a}</Text></TouchableOpacity>)}</View>
            <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(4)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
          </Section>
        )}

        <Section num={4} title="Historial Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelSub}>Enfermedades Familiares:</Text>
          <View style={styles.rowWrap}>{ENFERMEDADES_BASE.map(e => <TouchableOpacity key={e} style={[styles.chip, enfFam.includes(e) && styles.chipActive]} onPress={()=>{let n = enfFam.includes(e)?enfFam.filter(i=>i!==e):[...enfFam,e]; setEnfFam(n)}}><Text style={enfFam.includes(e)?styles.txtW:styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
          {enfFam.includes('Otra') && <TextInput style={styles.input} placeholder="Escriba enfermedades familiares" value={otrosFam} onChangeText={setOtrosFam} />}
          <Text style={styles.labelSub}>Enfermedades Propias:</Text>
          <View style={styles.rowWrap}>{ENFERMEDADES_BASE.map(e => <TouchableOpacity key={e} style={[styles.chip, enfPers.includes(e) && styles.chipActive]} onPress={()=>{let n = enfPers.includes(e)?enfPers.filter(i=>i!==e):[...enfPers,e]; setEnfPers(n)}}><Text style={enfPers.includes(e)?styles.txtW:styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
          {enfPers.includes('Otra') && <TextInput style={styles.input} placeholder="Escriba sus enfermedades" value={otrosPers} onChangeText={setOtrosPers} />}
          <Text style={styles.labelSub}>¿Lesión?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, lesion==='si' && styles.btnActive]} onPress={()=>setLesion('si')}><Text style={lesion==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, lesion==='no' && styles.btnActive]} onPress={()=>setLesion('no')}><Text style={lesion==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity></View>
          {lesion==='si' && <TextInput style={styles.input} placeholder="¿Cuál?" value={detalleLesion} onChangeText={setDetalleLesion} />}
          <Text style={styles.labelSub}>¿Operaciones?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, operacion==='si' && styles.btnActive]} onPress={()=>setOperacion('si')}><Text style={operacion==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, operacion==='no' && styles.btnActive]} onPress={()=>setOperacion('no')}><Text style={operacion==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity></View>
          {operacion==='si' && <TextInput style={styles.input} placeholder="¿Cuál?" value={detalleOperacion} onChangeText={setDetalleOperacion} />}
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(5)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={5} title="Estilo Vida (IPAQ)" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelIpaq}>Vigorosa:</Text>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Días" value={vDias} keyboardType="numeric" onChangeText={setVDias}/><TextInput style={[styles.input, {flex:1}]} placeholder="Min" value={vMin} keyboardType="numeric" onChangeText={setVMin}/></View>
          <Text style={styles.labelIpaq}>Moderada:</Text>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Días" value={mDias} keyboardType="numeric" onChangeText={setMDias}/><TextInput style={[styles.input, {flex:1}]} placeholder="Min" value={mMin} keyboardType="numeric" onChangeText={setMMin}/></View>
          <Text style={styles.labelIpaq}>Caminata:</Text>
          <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Días" value={cDias} keyboardType="numeric" onChangeText={setCDias}/><TextInput style={[styles.input, {flex:1}]} placeholder="Min" value={cMin} keyboardType="numeric" onChangeText={setCMin}/></View>
          <TextInput style={styles.input} placeholder="Horas sentado" value={sentado} keyboardType="numeric" onChangeText={setSentado} />
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(6)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={6} title="Nutrición y Hábitos" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
          <Text style={styles.labelSub}>Comidas actuales:</Text>
          <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(n => <TouchableOpacity key={n} style={[styles.chip, comidasAct === n && styles.chipActive]} onPress={()=>setComidasAct(n)}><Text style={comidasAct === n ? styles.txtW : styles.txtB}>{n}</Text></TouchableOpacity>)}</View>
          <TextInput style={styles.input} placeholder="Describe tus comidas" value={descAct} onChangeText={setDescAct} />
          <Text style={styles.labelSub}>¿Alcohol?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, alcohol==='si' && styles.btnActive]} onPress={()=>setAlcohol('si')}><Text style={alcohol==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, alcohol==='no' && styles.btnActive]} onPress={()=>setAlcohol('no')}><Text style={alcohol==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity></View>
          {alcohol === 'si' && <View style={styles.rowWrap}>{["Diario", "Semanal", "Mensual", "Social"].map(f => <TouchableOpacity key={f} style={[styles.chip, alcoholFreq === f && styles.chipActive]} onPress={()=>setAlcoholFreq(f)}><Text style={alcoholFreq === f ? styles.txtW : styles.txtB}>{f}</Text></TouchableOpacity>)}</View>}
          <Text style={styles.labelSub}>¿Sustancias / Fuma?</Text>
          <View style={styles.row}><TouchableOpacity style={[styles.btnG, sust==='si' && styles.btnActive]} onPress={()=>setSust('si')}><Text style={sust==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, sust==='no' && styles.btnActive]} onPress={()=>setSust('no')}><Text style={sust==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity></View>
          {sust === 'si' && <View style={styles.rowWrap}>{["Diario", "Semanal", "Mensual", "Social"].map(f => <TouchableOpacity key={f} style={[styles.chip, sustFreq === f && styles.chipActive]} onPress={()=>setSustFreq(f)}><Text style={sustFreq === f ? styles.txtW : styles.txtB}>{f}</Text></TouchableOpacity>)}</View>}
          <Text style={styles.labelSub}>¿Cuantas comidas quieres en tu plan?</Text>
          <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(n => <TouchableOpacity key={n} style={[styles.chip, comidasDes === n && styles.chipActive]} onPress={()=>setComidasDes(n)}><Text style={comidasDes === n ? styles.txtW : styles.txtB}>{n}</Text></TouchableOpacity>)}</View>
          <Text style={styles.labelSub}>Días entrenamiento:</Text>
          <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(d => <TouchableOpacity key={d} style={[styles.chip, entrenos === d && styles.chipActive]} onPress={()=>setEntrenos(d)}><Text style={entrenos === d ? styles.txtW : styles.txtB}>{d}</Text></TouchableOpacity>)}</View>
          <TextInput style={styles.input} placeholder="Objetivos" value={objetivo} onChangeText={setObjetivo} />
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(7)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={7} title="Frecuencia Alimentos" color="#10b981" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
          {LISTA_ALIMENTOS_FRECUENCIA.map(ali => (
            <View key={ali} style={{marginBottom:10}}>
              <Text style={{fontSize:12, fontWeight:'bold', marginBottom:5}}>{ali}:</Text>
              <ScrollView horizontal>{OPCIONES_FRECUENCIA.map(op => (<TouchableOpacity key={op} style={[styles.chip, frecuenciaAlimentos[ali] === op && styles.chipActive]} onPress={()=>setFrecuenciaAlimentos({...frecuenciaAlimentos, [ali]:op})}><Text style={{fontSize:10, color: frecuenciaAlimentos[ali]===op ? '#fff' : '#3b82f6'}}>{op}</Text></TouchableOpacity>))}</ScrollView>
            </View>
          ))}
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(8)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={8} title="Consentimiento" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.consentBox}>
            <Text style={styles.consentHeader}>CONSENTIMIENTO INFORMADO PARA LA PARTICIPACIÓN EN UN PROGRAMA DE ENTRENAMIENTO PERSONAL DE ACONDICIONAMIENTO FÍSICO DE ADULTOS APARENTEMENTE SANOS (SIN CONOCIMIENTO O SOSPECHA DE ENFERMEDADES CARDÍACAS)</Text>
            <Text style={styles.miniTxt}>Nombre: {nombre || '________'} | Fecha: {new Date().toLocaleDateString()}</Text>
            <Text style={styles.consentTxt}>
              1. Propósito y explicación de los procedimientos: Mediante este documento acepto voluntariamente participar en un plan de entrenamiento personal de acondicionamiento físico. También acepto tomar parte en las actividades del programa de entrenamiento personal que se me recomienden para la mejora de mi salud y bienestar general. Estas pueden incluir asesoramiento dietético, gestión del estrés y actividades formativas sobre salud y acondicionamiento físico. Los niveles de intensidad del ejercicio que se realizará se basarán en mi capacidad cardiorrespiratoria (corazón y pulmones) y muscular. Soy consciente de que se me puede requerir la realización de una prueba graduada de esfuerzo, así como otras pruebas físicas antes del comienzo del programa de entrenamiento personal para poder valorar y evaluar mi estado físico actual. Se me darán las instrucciones concretas en cuanto al tipo y volumen de ejercicio que debería realizar. Me comprometo a realizar 3 veces por semana las sesiones formales del programa. Entrenadores capacitados para ello dirigirán mis actividades, controlarán mi rendimiento y evaluarán mi esfuerzo. Según mi estado de salud, se me podrá requerir durante las sesiones un control de la presión arterial y la frecuencia cardíaca para mantener la intensidad dentro de unos límites deseables. Soy consciente de que se espera mi asistencia a todas las sesiones y que siga las instrucciones del personal relativas al ejercicio, la dieta, la gestión del estrés y otros programas relacionados (salud / acondicionamiento físico). En caso de estar tomando medicamentos, ya he informado de ello al personal del programa y me comprometo a comunicarles de inmediato cualquier cambio al respecto tanto por mi parte como por parte del médico. En caso de que sea conveniente, se me valorará y evaluará periódicamente a intervalos regulares tras el inicio del programa. Se me ha informado de que durante mi participación en este programa de entrenamiento personal se me pedirá que complete las actividades físicas salvo en caso de síntomas como fatiga, falta de aire, molestias en la zona pectoral o similares. Llegados a ese punto, se me ha informado de que tengo el derecho de disminuir la intensidad o poner fin al ejercicio y de que estoy obligado a informar al personal del programa de entrenamiento personal de mis síntomas. Así, declaro que se me ha informado de ello y me comprometo a informar al personal encargado de mi entrenamiento de mis síntomas, si se llegaran a producir. Soy consciente de que, durante el ejercicio, un entrenador personal supervisará periódicamente mi rendimiento con la posibilidad de que controle mi pulso y mi presión arterial o de que valore mi percepción del esfuerzo para así controlar mi progreso. Asimismo, soy consciente de que el entrenador personal puede reducir la intensidad o poner fin al programa de ejercicios para mi seguridad y beneficio según los parámetros anteriormente mencionados. También se me ha comunicado que durante el transcurso de mi programa de entrenamiento personal puede ser necesario el contacto físico y una colocación corporal adecuada de mi cuerpo para evaluar las reacciones musculares y corporales a ejercicios concretos, además de para asegurar que utilizo la técnica y postura adecuadas. Por ello doy mi autorización expresa para que se produzca el contacto físico por estos motivos.{"\n\n"}
              2. Riesgos: Manifiesto que se me ha informado de que existe la posibilidad, aunque remota, de efectos negativos durante el ejercicio, como por ejemplo (y sin excluir otros) alteración de la presión arterial, mareos, trastornos del ritmo cardíaco y casos excepcionales de infarto, derrames o incluso riesgo de muerte. Asimismo, se me ha explicado que existe el riesgo de lesiones corporales, como por ejemplo (sin excluir otras) lesiones musculares, de ligamentos, tendones y articulaciones. Se me ha comunicado que se pondrán todos los medios disponibles para minimizar que estas incidencias se produzcan mediante controles adecuados de mi estado antes de cada sesión de entrenamiento y supervisión del personal durante el ejercicio, así como de mi prudencia frente al esfuerzo. Conozco perfectamente los riesgos asociados con el ejercicio, como lesiones corporales, infartos, derrames e incluso la muerte, y aun conociendo estos riesgos, deseo tomar parte como ya he manifestado.{"\n\n"}
              3. Beneficios que cabe esperar y alternativas disponibles a la prueba de esfuerzo: Soy consciente de que este programa puede o no reportar beneficios a mi condición física o salud general. Comprendo que la participación en sesiones de ejercicio y entrenamiento personal me permitirá aprender cómo realizar adecuadamente ejercicios de acondicionamiento físico, usar los diversos aparatos y regular el esfuerzo físico. Por tanto, debería sacar provecho de estas experiencias, ya que indicarían la manera en que mis limitaciones físicas pueden afectar mi capacidad de realizar las diversas actividades físicas. Soy asimismo consciente de que si sigo cuidadosamente las instrucciones del programa mejoraré con toda probabilidad mi capacidad para el ejercicio físico y mi forma física tras un período de 3 a 6 meses.{"\n\n"}
              4. Confidencialidad y uso de la información: Se me ha informado de que la información obtenida durante este programa de entrenamiento personal se tratará con máxima confidencialidad y, en consecuencia, no se proporcionará o revelará a nadie sin mi consentimiento expreso por escrito. Acepto, en cambio, que se utilice cualquier información con propósito de investigación o estadístico siempre que no pueda llevar a la identificación de mi persona. También apruebo el uso de cualquier información con el propósito de consulta con otros profesionales de la salud o del fitness, incluido mi médico. En cambio, cualquier otra información obtenida se utilizará por parte del personal del programa únicamente por razones de prescripción de ejercicio y evaluación de mi progreso en el programa. Confirmo que he leído este documento en su totalidad o que se me ha leído en caso de no ser capaz de leerlo personalmente. Doy mi autorización expresa a que se lleven a cabo todos los servicios y procedimientos tal y como me ha comunicado el personal del programa.
            </Text>
          </View>
          <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarTerminos(!aceptarTerminos)}><MaterialCommunityIcons name={aceptarTerminos?"checkbox-marked":"checkbox-blank-outline"} size={22} color="#10b981"/><Text style={styles.miniTxt}>Acepto términos y condiciones del consentimiento.</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnFirma} onPress={() => setModalFirma(true)}><Text style={styles.btnFirmaText}>{firma ? "✓ Firma Registrada" : "Firma digital aquí"}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(9)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
        </Section>

        <Section num={9} title="Aviso de Privacidad" color="#64748b" icon="shield-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
          <View style={styles.consentBox}><Text style={styles.consentTxt}>FitTech, es el responsable del uso y protección de sus datos personales. Sus datos serán utilizados para: Proveer los servicios de asesoría deportiva y nutricional contratados; Integrar su expediente clínico y deportivo; Contactarle para dar seguimiento a su plan. Usted tiene derecho a ejercer sus derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) a través de los canales de contacto autorizados.</Text></View>
          <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarPrivacidad(!aceptarPrivacidad)}><MaterialCommunityIcons name={aceptarPrivacidad?"checkbox-marked":"checkbox-blank-outline"} size={22} color="#10b981"/><Text style={styles.miniTxt}>He leído y acepto el aviso de privacidad completo.</Text></TouchableOpacity>
          {firma && aceptarTerminos && aceptarPrivacidad && (
            <TouchableOpacity style={styles.btnEnviar} onPress={enviarAlCoach}><Text style={styles.txtW}>ENVIAR A MI COACH</Text></TouchableOpacity>
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
  consentTxt: { fontSize: 10, color: '#64748b', textAlign: 'justify', lineHeight: 14 },
  btnFirma: { padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', borderStyle: 'dashed', alignItems: 'center', marginVertical: 15 },
  btnFirmaText: { color: '#3b82f6', fontWeight: 'bold' },
  rowCheck: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  miniTxt: { fontSize: 11, color: '#334155', flex: 1 },
  btnEnviar: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 25 },
  btnNext: { padding: 10, borderRadius: 8, backgroundColor: '#3b82f6', alignItems: 'center', marginTop: 10 },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#f1f5f9' },
  esperaTitle: { fontSize: 24, fontWeight: 'bold' },
  esperaSub: { fontSize: 14, color: '#64748b', textAlign: 'center' }
});