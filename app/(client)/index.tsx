import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { db, auth } from '../../firebaseConfig'; 
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { FontAwesome5, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';
import AuthScreen from '../AuthScreen'; 
import CoachPanel from '../(admin)/coach';
import { SafeAreaView } from 'react-native-safe-area-context';

// ELIMINAMOS LA IMPORTACIÓN QUE CAUSA EL ERROR
// ELIMINAMOS EL TRUCO INVISIBLE QUE NO FUNCIONÓ

const ENFERMEDADES_BASE = ["Diabetes", "Hipertensión", "Obesidad", "Hipotiroidismo", "Cáncer", "Cardiopatías", "Asma", "Ninguna", "Otra"];
const ANTICONCEPTIVOS = ["Pastillas", "Inyección", "DIU", "Implante", "Parche", "Ninguno"];
const TIPOS_CICLO = ["Regular", "Irregular", "Menopausia"];
const OPCIONES_FRECUENCIA = ["Nunca", "1-3 al mes", "1 a la semana", "2 a 4 a la semana", "Diario"];
const LISTA_ALIMENTOS_FRECUENCIA = ["Frutas", "Verduras", "Leche", "Yogurt", "Quesos", "Embutidos", "Huevo", "Carnes", "Pescado", "Leguminosas"];

const PREGUNTAS_PARQ = [
  { id: 'p1', texto: "¿Alguna vez un médico le ha dicho que tiene un problema cardíaco y que solo debe realizar actividad física recomendada por un médico?" },
  { id: 'p2', texto: "¿Siente dolor en el pecho cuando realiza actividad física?" },
  { id: 'p3', texto: "¿En el último mes, ha sentido dolor en el pecho cuando no realizaba actividad física?" },
  { id: 'p4', texto: "¿Pierde el equilibrio debido a mareos o alguna vez ha perdido el conocimiento?" },
  { id: 'p5', texto: "¿Tiene algún problema óseo o articular que podría empeorar por un cambio en su actividad física?" },
  { id: 'p6', texto: "¿Le receta actualmente su médico medicamentos para la presión arterial o un problema cardíaco?" },
  { id: 'p7', texto: "¿Sabe de alguna otra razón por la cual no debería realizar actividad física?" }
];

export default function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'coach' | 'alumno' | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const CORREO_COACH = "inner.arth@gmail.com"; 

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        await usuario.reload(); 
        const userActualizado = auth.currentUser;
        if (userActualizado?.emailVerified || userActualizado?.email?.toLowerCase().trim() === CORREO_COACH) {
          setUser(userActualizado);
          setRole(userActualizado.email?.toLowerCase().trim() === CORREO_COACH ? 'coach' : 'alumno');
        } else {
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
  if (!user) return <AuthScreen />;
  if (role === 'coach') return <CoachPanel />;
  return <ClienteScreen user={user} />;
}

function ClienteScreen({ user }: { user: any }) {
  const [paso, setPaso] = useState<'formulario' | 'espera'>('formulario');
  const [cargandoStatus, setCargandoStatus] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState<number | null>(null);
  const [modalFirma, setModalFirma] = useState(false);
  const [firma, setFirma] = useState<string | null>(null);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [aceptarPrivacidad, setAceptarPrivacidad] = useState(false);

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
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState('');
  const [vDias, setVDias] = useState('');
  const [vMin, setVMin] = useState('');
  const [mDias, setMDias] = useState('');
  const [mMin, setMMin] = useState('');
  const [cDias, setCDias] = useState('');
  const [cMin, setCMin] = useState('');
  const [sentado, setSentado] = useState('');
  const [horasSueno, setHorasSueno] = useState('');
  const [respuestasParq, setRespuestasParq] = useState<any>({});
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

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const q = query(collection(db, "revisiones_pendientes"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) setPaso('espera');
      } catch (e) { console.log(e); }
      setCargandoStatus(false);
    };
    checkStatus();
  }, [user]);

  const enviarAlCoach = async () => {
    if (!nombre || !firma || !aceptarTerminos || !aceptarPrivacidad || !edad) {
      const msg = "Por favor completa Nombre, Edad, Firma y acepta los avisos legales.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Atención", msg);
      return;
    }
    try {
      await addDoc(collection(db, "revisiones_pendientes"), {
        uid: user.uid, nombre, telefono, email: user.email, 
        datosFisicos: { peso, altura, edad, genero },
        medidas: { cuello, pecho, brazoR, brazoF, cintura, cadera, muslo, pierna },
        ciclo: { tipo: tipoCiclo, anticonceptivo },
        salud: { enfFam, otrosFam, enfPers, otrosPers, lesion, detalleLesion, operacion, detalleOperacion, frecuenciaCardiaca, parq: respuestasParq },
        ipaq: { vDias, vMin, mDias, mMin, cDias, cMin, sentado, horasSueno },
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
        <View style={styles.esperaCard}>
            <Text style={{fontSize: 50, textAlign:'center'}}>⏳</Text>
            <Text style={styles.esperaTitle}>¡Check-in en Revisión!</Text>
            <Text style={styles.esperaSub}>Tu información ya fue enviada. Tu Coach la está revisando para asignarte tu plan.</Text>
            <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtnLarge}>
                <Text style={styles.txtW}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerBar}>
        <View style={styles.headerInner}>
            <Text style={styles.headerTitle}>Check-in <Text style={{color:'#3b82f6'}}>InnerArth</Text></Text>
            <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn}>
                {Platform.OS === 'web' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                ) : (
                  <FontAwesome5 name="sign-out-alt" size={18} color="#ef4444" />
                )}
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.webWrapper}>
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Progreso: {seccionActiva || 0} de 10</Text>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(Number(seccionActiva || 0) / 10) * 100}%` }]} />
                </View>
            </View>

            <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
                <TextInput style={styles.input} placeholder="Nombre Completo" value={nombre} onChangeText={setNombre} />
                <TextInput style={styles.input} placeholder="Teléfono" value={telefono} onChangeText={(v) => { if (v.length <= 10) setTelefono(v.replace(/[^0-9]/g, '')) }} keyboardType="numeric" maxLength={10} />
                <View style={styles.row}>
                    <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Peso (kg)" value={peso} keyboardType="numeric" onChangeText={setPeso} />
                    <TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Altura (cm)" value={altura} keyboardType="numeric" onChangeText={setAltura} />
                </View>
                <TextInput style={styles.input} placeholder="Edad" value={edad} keyboardType="numeric" onChangeText={setEdad} />
                <View style={styles.row}>
                    <TouchableOpacity style={[styles.btnG, genero === 'hombre' && styles.btnActive]} onPress={() => setGenero('hombre')}><Text style={genero === 'hombre' ? styles.txtW : styles.txtB}>HOMBRE</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.btnG, genero === 'mujer' && styles.btnActive]} onPress={() => setGenero('mujer')}><Text style={genero === 'mujer' ? styles.txtW : styles.txtB}>MUJER</Text></TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(2)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>

            <Section num={2} title="Medidas Corporales (CM)" color="#10b981" icon="ruler-horizontal" activa={seccionActiva} setActiva={setSeccionActiva}>
                <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cuello" value={cuello} keyboardType="numeric" onChangeText={setCuello} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Pecho" value={pecho} keyboardType="numeric" onChangeText={setPecho} /></View>
                <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Brazo Rel" value={brazoR} keyboardType="numeric" onChangeText={setBrazoR} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Brazo Flex" value={brazoF} keyboardType="numeric" onChangeText={setBrazoF} /></View>
                <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cintura" value={cintura} keyboardType="numeric" onChangeText={setCintura} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Cadera" value={cadera} keyboardType="numeric" onChangeText={setCadera} /></View>
                <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Muslo" value={muslo} keyboardType="numeric" onChangeText={setMuslo} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Pierna" value={pierna} keyboardType="numeric" onChangeText={setPierna} /></View>
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(genero === 'mujer' ? 3 : 4)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>

            {genero === 'mujer' && (
            <Section num={3} title="Ciclo Menstrual" color="#ec4899" icon="venus" activa={seccionActiva} setActiva={setSeccionActiva}>
                <View style={styles.rowWrap}>{TIPOS_CICLO.map(t => <TouchableOpacity key={t} style={[styles.chip, tipoCiclo === t && styles.chipActive]} onPress={()=>setTipoCiclo(t)}><Text style={tipoCiclo === t ? styles.txtW : styles.txtB}>{t}</Text></TouchableOpacity>)}</View>
                <Text style={styles.labelSub}>Anticonceptivo:</Text>
                <View style={styles.rowWrap}>{ANTICONCEPTIVOS.map(a => <TouchableOpacity key={a} style={[styles.chip, anticonceptivo === a && styles.chipActive]} onPress={()=>setAnticonceptivo(a)}><Text style={anticonceptivo === a ? styles.txtW : styles.txtB}>{a}</Text></TouchableOpacity>)}</View>
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(4)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>
            )}

            <Section num={4} title="Historial Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
                <Text style={styles.labelSub}>Enfermedades Familiares:</Text>
                <View style={styles.rowWrap}>{ENFERMEDADES_BASE.map(e => <TouchableOpacity key={e} style={[styles.chip, enfFam.includes(e) && styles.chipActive]} onPress={()=>{let n = enfFam.includes(e)?enfFam.filter(i=>i!==e):[...enfFam,e]; setEnfFam(n)}}><Text style={enfFam.includes(e)?styles.txtW:styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
                <Text style={styles.labelSub}>Enfermedades Propias:</Text>
                <View style={styles.rowWrap}>{ENFERMEDADES_BASE.map(e => <TouchableOpacity key={e} style={[styles.chip, enfPers.includes(e) && styles.chipActive]} onPress={()=>{let n = enfPers.includes(e)?enfPers.filter(i=>i!==e):[...enfPers,e]; setEnfPers(n)}}><Text style={enfPers.includes(e)?styles.txtW:styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
                <Text style={styles.labelSub}>¿Lesión?</Text>
                <View style={styles.row}><TouchableOpacity style={[styles.btnG, lesion==='si' && styles.btnActive]} onPress={()=>setLesion('si')}><Text style={lesion==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, lesion==='no' && styles.btnActive]} onPress={()=>setLesion('no')}><Text style={lesion==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity></View>
                {lesion==='si' && <TextInput style={styles.input} placeholder="Describe tu lesion..." value={detalleLesion} onChangeText={setDetalleLesion} />}
                <Text style={styles.labelSub}>¿Operación?</Text>
                <View style={styles.row}><TouchableOpacity style={[styles.btnG, operacion==='si' && styles.btnActive]} onPress={()=>setOperacion('si')}><Text style={operacion==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, operacion==='no' && styles.btnActive]} onPress={()=>setOperacion('no')}><Text style={operacion==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity></View>
                {operacion==='si' && <TextInput style={styles.input} placeholder="Describe tu operacion" value={detalleOperacion} onChangeText={setDetalleOperacion} />}                 
                <Text style={styles.labelSub}>FCR:</Text>
                <View style={styles.helperBox}><Text style={styles.helperTxt}>💡 Para medir tu frecuencia cardíaca, palpa el pulso en tu muñeca o cuello con los dedos índice y medio, cuenta los latidos durante 15 seg y luego multiplícalos por 4 para obtener los latidos por minuto, hazlo en reposo.</Text></View>
                <TextInput style={styles.input} placeholder="Ej: 70 lpm" value={frecuenciaCardiaca} keyboardType="numeric" onChangeText={setFrecuenciaCardiaca} />
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(5)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>

            <Section num={5} title="Estilo Vida (IPAQ)" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
                <Text style={styles.labelIpaq}>Actividad Vigorosa:</Text>
                <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Días" value={vDias} keyboardType="numeric" onChangeText={setVDias}/><TextInput style={[styles.input, {flex:1}]} placeholder="Min" value={vMin} keyboardType="numeric" onChangeText={setVMin}/></View>
                <Text style={styles.labelIpaq}>Actividad Moderada:</Text>
                <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Días" value={mDias} keyboardType="numeric" onChangeText={setMDias}/><TextInput style={[styles.input, {flex:1}]} placeholder="Min" value={mMin} keyboardType="numeric" onChangeText={setMMin}/></View>
                <Text style={styles.labelIpaq}>Caminata:</Text>
                <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Días" value={cDias} keyboardType="numeric" onChangeText={setCDias}/><TextInput style={[styles.input, {flex:1}]} placeholder="Min" value={cMin} keyboardType="numeric" onChangeText={setCMin}/></View>
                <TextInput style={styles.input} placeholder="Horas sentado al día" value={sentado} keyboardType="numeric" onChangeText={setSentado} />
                <Text style={styles.labelSub}>Descanso:</Text>
                <TextInput style={styles.input} placeholder="¿Cuántas horas duermes al dia?" value={horasSueno} keyboardType="numeric" onChangeText={setHorasSueno} />
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(6)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>

            <Section num={6} title="PAR-Q" color="#0ea5e9" icon="notes-medical" activa={seccionActiva} setActiva={setSeccionActiva}>
                {PREGUNTAS_PARQ.map((p, idx) => (
                  <View key={p.id} style={{marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10}}>
                    <Text style={{fontSize: 13, color: '#334155', marginBottom: 8}}>{idx+1}. {p.texto}</Text>
                    <View style={styles.row}>
                      <TouchableOpacity style={[styles.btnG, respuestasParq[p.id]==='si' && {backgroundColor: '#ef4444', borderColor: '#ef4444'}]} onPress={()=>setRespuestasParq({...respuestasParq, [p.id]: 'si'})}><Text style={respuestasParq[p.id]==='si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.btnG, respuestasParq[p.id]==='no' && {backgroundColor: '#10b981', borderColor: '#10b981'}]} onPress={()=>setRespuestasParq({...respuestasParq, [p.id]: 'no'})}><Text style={respuestasParq[p.id]==='no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(7)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>

            <Section num={7} title="Nutrición y Hábitos" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
                <Text style={styles.labelSub}>Comidas actuales:</Text>
                <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(n => <TouchableOpacity key={n} style={[styles.chip, comidasAct === n && styles.chipActive]} onPress={()=>setComidasAct(n)}><Text style={comidasAct === n ? styles.txtW : styles.txtB}>{n}</Text></TouchableOpacity>)}</View>
                <TextInput style={[styles.input, {height: 80}]} multiline placeholder="Describeme un dia todo lo que comes" value={descAct} onChangeText={setDescAct} />
                <Text style={styles.labelSub}>¿Alcohol?</Text>
                <View style={styles.row}><TouchableOpacity style={[styles.btnG, alcohol==='si' && styles.btnActive]} onPress={()=>setAlcohol('si')}><Text style={alcohol==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, alcohol==='no' && styles.btnActive]} onPress={()=>setAlcohol('no')}><Text style={alcohol==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity></View>
                  {alcohol === 'si' && (
                    <View style={styles.rowWrap}>{["Diario", "Semanal", "Mensual", "Social"].map(f => <TouchableOpacity key={f} style={[styles.chip, alcoholFreq === f && styles.chipActive]} onPress={()=>setAlcoholFreq(f)}><Text style={alcoholFreq === f ? styles.txtW : styles.txtB}>{f}</Text></TouchableOpacity>)}</View>
                  )}
                <Text style={styles.labelSub}>¿Sustancias toxicologicas / fumas?</Text>
                <View style={styles.row}><TouchableOpacity style={[styles.btnG, sust==='si' && styles.btnActive]} onPress={()=>setSust('si')}><Text style={sust==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, sust==='no' && styles.btnActive]} onPress={()=>setSust('no')}><Text style={sust==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity></View>
                  {sust === 'si' && (
                  <View style={styles.rowWrap}>{["Diario", "Semanal", "Mensual", "Social"].map(f => <TouchableOpacity key={f} style={[styles.chip, sustFreq === f && styles.chipActive]} onPress={()=>setSustFreq(f)}><Text style={sustFreq === f ? styles.txtW : styles.txtB}>{f}</Text></TouchableOpacity>)}</View>
                  )} 
                <Text style={styles.labelSub}>Comidas deseas en plan:</Text>
                <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(n => <TouchableOpacity key={n} style={[styles.chip, comidasDes === n && styles.chipActive]} onPress={()=>setComidasDes(n)}><Text style={comidasDes === n ? styles.txtW : styles.txtB}>{n}</Text></TouchableOpacity>)}</View>
                <Text style={styles.labelSub}>Días de entrenamiento:</Text>
                <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(d => <TouchableOpacity key={d} style={[styles.chip, entrenos === d && styles.chipActive]} onPress={()=>setEntrenos(d)}><Text style={entrenos === d ? styles.txtW : styles.txtB}>{d}</Text></TouchableOpacity>)}</View>
                <TextInput style={styles.input} placeholder="Cuales son tus Objetivos" value={objetivo} onChangeText={setObjetivo} />
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(8)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>

            <Section num={8} title="Frecuencia Alimentos" color="#10b981" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
                {LISTA_ALIMENTOS_FRECUENCIA.map(ali => (
                    <View key={ali} style={{marginBottom:15}}>
                        <Text style={{fontSize:13, fontWeight:'bold', marginBottom:8}}>{ali}:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {OPCIONES_FRECUENCIA.map(op => (
                                <TouchableOpacity key={op} style={[styles.chip, frecuenciaAlimentos[ali] === op && styles.chipActive]} onPress={()=>setFrecuenciaAlimentos({...frecuenciaAlimentos, [ali]:op})}>
                                    <Text style={{fontSize:11, color: frecuenciaAlimentos[ali]===op ? '#fff' : '#3b82f6'}}>{op}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                ))}
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(9)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>

            <Section num={9} title="Consentimiento" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
                <View style={styles.consentBox}>
                    <Text style={styles.consentHeader}>CONSENTIMIENTO INFORMADO</Text>
                    <ScrollView style={{height: 150, marginTop: 10}}>
                        <Text style={styles.consentTxt}>
                            1. Propósito: Por medio del presente, declaro que participo de manera voluntaria en un programa de entrenamiento personal orientado al acondicionamiento físico. Entiendo que el servicio consiste en la planificación, instrucción y supervisión de actividad física y hábitos relacionados con el ejercicio. Reconozco que el entrenamiento personal NO constituye un servicio médico, de diagnóstico, rehabilitación, tratamiento de enfermedades o prescripción clínica. Si presento síntomas, lesiones, embarazo, padecimientos crónicos o dudas sobre mi aptitud para ejercitarme, me comprometo a consultar previamente a un profesional de la salud y a informar al Entrenador.
                            2. Evaluacion: Para diseñar y ajustar el programa, el Entrenador podrá realizar una valoración física NO diagnóstica, que puede incluir: cuestionario de salud y actividad física, historial de lesiones, mediciones antropométricas peso, estatura, perímetros, pruebas de condición física por ejemplo, fuerza, movilidad, resistencia y monitoreo durante la sesión por ejemplo, frecuencia cardiaca y presión arterial si aplica. Puedo negarme a cualquier medición o prueba específica. Si mi negativa impide la prestación segura del servicio, el Entrenador podrá recomendar posponer o ajustar el programa.
                            3. Contacto Fisico: Entiendo que, para demostrar ejercicios o corregir técnica y postura, puede ser necesario el contacto físico breve y profesional. El Entrenador solicitará mi autorización previa para dicho contacto y podré negarme o pedir alternativas sin represalias.
                            4. Riesgos, molestias potenciales y medidas de seguridad: Se me ha informado que la actividad física puede implicar riesgos, incluyendo, entre otros: fatiga, dolor muscular tardío, mareos, deshidratación, lesiones musculares, de tendones, ligamentos o articulaciones, caídas, y en casos excepcionales, eventos cardiovasculares graves por ejemplo, arritmias, infarto e incluso muerte. Para reducir riesgos, el Entrenador ajustará cargas y ejercicios conforme a mi condición, explicará técnica y calentamiento, y me indicará pausas, hidratación y señales de alarma. Me comprometo a informar de inmediato cualquier síntoma inusual, como dolor torácico, falta de aire desproporcionada, mareo intenso, palpitaciones, desmayo, dolor agudo o cualquier malestar relevante. Entiendo que puedo detener el ejercicio en cualquier momento. Si ocurre una urgencia, autorizo a que se solicite asistencia médica y se llame al 911, y a que se comparta con personal de emergencia la información estrictamente necesaria para proteger mi vida e integridad.
                            5. Beneficios esperados y alternativas: Comprendo que los resultados varían entre personas y dependen de múltiples factores constancia, descanso, alimentación, salud previa. El Entrenador no garantiza resultados específicos pérdida de peso, ganancia muscular, mejora estética o rendimiento. Alternativas al entrenamiento personal incluyen: actividad física por cuenta propia, clases grupales, programas en línea, o la asesoría de profesionales de la salud cuando exista una condición médica que así lo requiera.
                            6. Declaraciones del Cliente / Titular: He proporcionado información completa y veraz sobre mi estado de salud, lesiones, medicamentos y antecedentes relevantes. Entiendo las indicaciones del Entrenador y preguntaré cualquier duda antes de ejecutar ejercicios. Notificaré cambios relevantes en mi salud síntomas, lesiones, embarazo, tratamiento médico. Actuaré con prudencia y atenderé las recomendaciones de seguridad calentamiento, técnica, hidratación y descanso.
                            7. Proteccion de datos personales: He recibido y leído el Aviso de Privacidad Integral Anexo A. Se me explicó que para la prestación del servicio pueden recabarse y tratarse datos personales de identificación y contacto, así como datos personales sensibles relacionados con mi salud por ejemplo, antecedentes, síntomas, lesiones, medicación y mediciones físicas.
                            8. Consentimineto Expreso: Otorgo mi consentimiento EXPRESO y por escrito para el tratamiento de mis datos personales sensibles conforme al Anexo.
                        </Text>
                    </ScrollView>
                </View>
                <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarTerminos(!aceptarTerminos)}>
                    <MaterialCommunityIcons name={aceptarTerminos?"checkbox-marked":"checkbox-blank-outline"} size={24} color="#10b981"/>
                    <Text style={styles.miniTxt}>Acepto términos y condiciones.</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnFirma} onPress={() => setModalFirma(true)}>
                    <Text style={styles.btnFirmaText}>{firma ? "✓ Firma Registrada" : "Hacer firma digital"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(10)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>

            <Section num={10} title="Aviso de Privacidad" color="#64748b" icon="shield-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
                <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarPrivacidad(!aceptarPrivacidad)}>
                    <MaterialCommunityIcons name={aceptarPrivacidad?"checkbox-marked":"checkbox-blank-outline"} size={24} color="#10b981"/>
                    <Text style={styles.miniTxt}>He leído y acepto el aviso de privacidad.</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnEnviar, (!aceptarTerminos || !aceptarPrivacidad || !firma) && {backgroundColor: '#94a3b8'}]} onPress={enviarAlCoach} disabled={!aceptarTerminos || !aceptarPrivacidad || !firma}>
                    <Text style={styles.txtW}>FINALIZAR Y ENVIAR</Text>
                </TouchableOpacity>
            </Section>
        </View>
      </ScrollView>

      <Modal visible={modalFirma} animationType="fade" transparent={true}>
        <View style={styles.webModalOverlay}>
            <View style={styles.webModalCard}>
                <Text style={styles.webModalTitle}>Firma del Cliente</Text>
                
                {Platform.OS === 'web' ? (
                  <View>
                    <Text style={styles.webModalSub}>Escribe tu nombre completo como firma de conformidad:</Text>
                    <TextInput 
                      style={[styles.input, {fontSize: 18, fontStyle: 'italic', marginTop: 15, textAlign: 'center'}]} 
                      placeholder="Nombre y Apellidos"
                      onChangeText={(v) => setFirma(v)}
                      value={firma || ''}
                    />
                    <TouchableOpacity 
                      style={[styles.btnEnviar, {marginTop: 20}]} 
                      onPress={() => { if(firma && firma.length > 3) setModalFirma(false); else alert("Por favor escribe tu nombre completo"); }}
                    >
                      <Text style={styles.txtW}>VALIDAR FIRMA</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{height: 300}}>
                    <SignatureScreen onOK={s => { setFirma(s); setModalFirma(false); }} descriptionText="Firma sobre la línea"/>
                  </View>
                )}
                
                <TouchableOpacity onPress={() => setModalFirma(false)} style={{marginTop: 15, alignItems:'center'}}>
                    <Text style={{color:'#ef4444', fontWeight:'bold', fontSize: 13}}>Cerrar</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const Section = ({ num, title, color, icon, activa, setActiva, children }: any) => {
  const isWeb = Platform.OS === 'web';
  const svgProps = { width: 16, height: 16, stroke: color, strokeWidth: 2, fill: "none" };
  const renderIcon = () => {
    if (!isWeb) return <FontAwesome5 name={icon} size={14} color={color} />;
    switch(icon) {
      case 'user': return <svg {...svgProps} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
      case 'ruler-horizontal': return <svg {...svgProps} viewBox="0 0 24 24"><path d="M22 12H2M5 12v-4M9 12v-4M13 12v-4M17 12v-4M21 12v-4"></path></svg>;
      case 'venus': return <svg {...svgProps} viewBox="0 0 24 24"><circle cx="12" cy="9" r="6"></circle><path d="M12 15v7M9 19h6"></path></svg>;
      case 'heartbeat': return <svg {...svgProps} viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>;
      case 'walking': return <svg {...svgProps} viewBox="0 0 24 24"><circle cx="13" cy="4" r="2"></circle><path d="m8 22 1-7 1-4 3 1 2 2M12 22l1-8 3-4-2-3-2-2"></path></svg>;
      case 'notes-medical': return <svg {...svgProps} viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6M12 11v6M9 14h6"></path></svg>;
      case 'utensils': return <svg {...svgProps} viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v2M11 2v2M3 2v2M15 14c.2-1 .7-1.7 1.5-2.5 1-.7 1.5-1.5 1.5-2.5V2h1v7c0 1-.5 1.8-1.5 2.5-.8.8-1.3 1.5-1.5 2.5v7h-1v-7z"></path></svg>;
      case 'apple-alt': return <svg {...svgProps} viewBox="0 0 24 24"><path d="M12 22c4.97 0 9-3.582 9-8s-4.03-8-9-8-9 3.582-9 8 4.03 8 9 8zM12 6V2"></path></svg>;
      case 'file-signature': return <svg {...svgProps} viewBox="0 0 24 24"><path d="M20 7h-9m9 4h-9m9 4H12M4 16v4h4L19.5 8.5a2.12 2.12 0 0 0 0-3L17.5 3.5a2.12 2.12 0 0 0-3 0L4 16z"></path></svg>;
      case 'shield-alt': return <svg {...svgProps} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
      default: return null;
    }
  };
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.headerToggle} onPress={() => setActiva(activa === num ? null : num)}>
        <View style={styles.titleRow}>
          <View style={[styles.numCircle, {backgroundColor: color}]}><Text style={styles.numText}>{num}</Text></View>
          {renderIcon()}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {isWeb ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {activa === num ? <polyline points="18 15 12 9 6 15"></polyline> : <polyline points="6 9 12 15 18 9"></polyline>}
          </svg>
        ) : (
          <FontAwesome name={activa === num ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
        )}
      </TouchableOpacity>
      {activa === num && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', zIndex: 10 },
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, maxWidth: 800, alignSelf: 'center', width: '100%' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  logoutBtn: { padding: 10, backgroundColor: '#fee2e2', borderRadius: 10 },
  scroll: { paddingBottom: 60 },
  webWrapper: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 15 },
  progressContainer: { marginBottom: 20 },
  progressText: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  progressBarBg: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3b82f6' },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  numCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  content: { padding: 18, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  input: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 14, fontSize: 15, color: '#1e293b' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#3b82f6', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#3b82f6' },
  btnG: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#3b82f6', alignItems: 'center', marginHorizontal: 5 },
  btnActive: { backgroundColor: '#3b82f6' },
  txtB: { color: '#3b82f6', fontWeight: 'bold', fontSize: 13 },
  txtW: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  labelSub: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginTop: 10, marginBottom: 5 },
  helperBox: { backgroundColor: '#eff6ff', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  helperTxt: { fontSize: 12, color: '#1e40af', lineHeight: 18 },
  labelIpaq: { fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: '600' },
  consentBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, marginVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  consentHeader: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  consentTxt: { fontSize: 11, color: '#64748b', textAlign: 'justify' },
  btnFirma: { padding: 18, borderRadius: 12, borderWidth: 2, borderColor: '#3b82f6', borderStyle: 'dashed', alignItems: 'center', marginVertical: 15, backgroundColor: '#eff6ff' },
  btnFirmaText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 15 },
  rowCheck: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  miniTxt: { fontSize: 12, color: '#334155', flex: 1 },
  btnEnviar: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  btnNext: { padding: 14, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center', marginTop: 15 },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc' },
  esperaCard: { backgroundColor:'#fff', padding: 40, borderRadius: 20, width: '100%', maxWidth: 450, elevation: 4 },
  esperaTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginTop: 20 },
  esperaSub: { fontSize: 15, color: '#64748b', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  logoutBtnLarge: { marginTop: 30, backgroundColor: '#ef4444', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
  webModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  webModalCard: { backgroundColor: '#fff', width: '100%', maxWidth: 450, padding: 25, borderRadius: 20, elevation: 5 },
  webModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 10 },
  webModalSub: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18 }
});
