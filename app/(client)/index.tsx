import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { db, auth } from '../../firebaseConfig'; 
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { FontAwesome5, MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import AuthScreen from '../AuthScreen'; 
import CoachPanel from '../(admin)/coach';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// --- CONSTANTES ---
const ENFERMEDADES_BASE = ["Diabetes", "Hipertensión", "Obesidad", "Hipotiroidismo", "Cáncer", "Cardiopatías", "Asma", "Ninguna", "Otra"];
const ANTICONCEPTIVOS = ["Pastillas", "Inyección", "DIU", "Implante", "Parche", "Ninguno"];
const TIPOS_CICLO = ["Regular", "Irregular", "Menopausia"];
const OPCIONES_FRECUENCIA = ["Nunca", "1-3 al mes", "1 a la semana", "2 a 4 a la semana", "Diario"];
const LISTA_ALIMENTOS_FRECUENCIA = ["Frutas", "Verduras", "Leche", "Yogurt", "Quesos", "Embutidos", "Huevo", "Carnes", "Pescado", "Leguminosas"];
const FREC_HABITOS = ["Diario", "Semanal", "Mensual", "Social"];

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
        const userAct = auth.currentUser;
        if (userAct) {
          setUser(userAct);
          setRole(userAct.email?.toLowerCase().trim() === CORREO_COACH ? 'coach' : 'alumno');
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
  const [paso, setPaso] = useState<'formulario' | 'espera' | 'dashboard'>('formulario');
  const [planActivo, setPlanActivo] = useState<any>(null);
  const [cargandoStatus, setCargandoStatus] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState<number | null>(null);
  const [modalFirma, setModalFirma] = useState(false);
  const [firma, setFirma] = useState<string | null>(null);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [aceptarPrivacidad, setAceptarPrivacidad] = useState(false);
  const router = useRouter();

  // --- ESTADOS RESTAURADOS ---
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
  const [enfPers, setEnfPers] = useState<string[]>([]);
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
    const qPlan = query(collection(db, "alumnos_activos", user.uid, "planes_publicados"), orderBy("fechaPublicacion", "desc"), limit(1));
    const unsub = onSnapshot(qPlan, (snap) => {
      if (!snap.empty) {
        setPlanActivo(snap.docs[0].data());
        setPaso('dashboard');
        setCargandoStatus(false);
      } else {
        const qRev = query(collection(db, "revisiones_pendientes"), where("uid", "==", user.uid));
        onSnapshot(qRev, (snapRev) => {
          setPaso(!snapRev.empty ? 'espera' : 'formulario');
          setCargandoStatus(false);
        });
      }
    });
    return () => unsub();
  }, [user]);

  const enviarAlCoach = async () => {
    if (!nombre || !firma || !aceptarTerminos || !aceptarPrivacidad || !edad) {
      alert("Completa todos los campos obligatorios y firma.");
      return;
    }
    try {
      await addDoc(collection(db, "revisiones_pendientes"), {
        uid: user.uid, nombre, telefono, email: user.email, 
        datosFisicos: { peso, altura, edad, genero },
        medidas: { cuello, pecho, brazoR, brazoF, cintura, cadera, muslo, pierna },
        ciclo: { tipo: tipoCiclo, anticonceptivo },
        salud: { enfFam, enfPers, lesion, detalleLesion, operacion, detalleOperacion, frecuenciaCardiaca, parq: respuestasParq },
        ipaq: { vDias, vMin, mDias, mMin, cDias, cMin, sentado, horasSueno },
        nutricion: { comidasAct, descAct, alcohol, alcoholFreq, sust, sustFreq, comidasDes, entrenos, objetivo },
        frecuenciaAlimentos, firma, timestamp: serverTimestamp()
      });
    } catch (e) { alert("Error al enviar."); }
  };

  if (cargandoStatus) return <View style={styles.esperaContainer}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  if (paso === 'espera' || (paso === 'dashboard' && planActivo)) {
    return (
      <View style={styles.esperaContainer}>
        <View style={styles.esperaCard}>
          <Text style={{fontSize: 50, textAlign:'center'}}>{paso==='dashboard'?'✅':'⏳'}</Text>
          <Text style={styles.esperaTitle}>{paso==='dashboard'?'¡Plan Activo!':'En Revisión'}</Text>
          <Text style={styles.esperaSub}>{paso==='dashboard'?'Tu plan ya está disponible en la pestaña Mi Plan.':'Tu Coach está analizando tu check-in.'}</Text>
          <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtnLarge}><Text style={styles.txtW}>Cerrar Sesión</Text></TouchableOpacity>
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
          <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn}><FontAwesome5 name="sign-out-alt" size={18} color="#ef4444" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.webWrapper}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Progreso: {seccionActiva || 0}/10</Text>
            <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${(Number(seccionActiva || 0)/10)*100}%` }]} /></View>
          </View>

          {/* SECCION 1: DATOS */}
          <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
            <TextInput style={styles.input} placeholder="Nombre Completo" value={nombre} onChangeText={setNombre} />
            <TextInput style={styles.input} placeholder="Teléfono" value={telefono} keyboardType="numeric" onChangeText={setTelefono} />
            <View style={styles.row}>
              <TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Peso (kg)" value={peso} keyboardType="numeric" onChangeText={setPeso} />
              <TextInput style={[styles.input, {flex:1}]} placeholder="Altura (cm)" value={altura} keyboardType="numeric" onChangeText={setAltura} />
            </View>
            <TextInput style={styles.input} placeholder="Edad" value={edad} keyboardType="numeric" onChangeText={setEdad}/>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btnG, genero==='hombre'&&styles.btnActive]} onPress={()=>setGenero('hombre')}><Text style={genero==='hombre'?styles.txtW:styles.txtB}>HOMBRE</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnG, genero==='mujer'&&styles.btnActive]} onPress={()=>setGenero('mujer')}><Text style={genero==='mujer'?styles.txtW:styles.txtB}>MUJER</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.btnNext} onPress={()=>setSeccionActiva(2)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
          </Section>

          {/* SECCION 2: MEDIDAS */}
          <Section num={2} title="Medidas (CM)" color="#10b981" icon="ruler-horizontal" activa={seccionActiva} setActiva={setSeccionActiva}>
            <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cuello" value={cuello} onChangeText={setCuello}/><TextInput style={[styles.input, {flex:1}]} placeholder="Pecho" value={pecho} onChangeText={setPecho}/></View>
            <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Brazo R" value={brazoR} onChangeText={setBrazoR}/><TextInput style={[styles.input, {flex:1}]} placeholder="Brazo F" value={brazoF} onChangeText={setBrazoF}/></View>
            <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cintura" value={cintura} onChangeText={setCintura}/><TextInput style={[styles.input, {flex:1}]} placeholder="Cadera" value={cadera} onChangeText={setCadera}/></View>
            <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Muslo" value={muslo} onChangeText={setMuslo}/><TextInput style={[styles.input, {flex:1}]} placeholder="Pierna" value={pierna} onChangeText={setPierna}/></View>
            <TouchableOpacity style={styles.btnNext} onPress={()=>setSeccionActiva(genero==='mujer'?3:4)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
          </Section>

          {/* SECCION 3: MUJER */}
          {genero === 'mujer' && (
            <Section num={3} title="Ciclo Menstrual" color="#ec4899" icon="venus" activa={seccionActiva} setActiva={setSeccionActiva}>
              <View style={styles.rowWrap}>{TIPOS_CICLO.map(t => <TouchableOpacity key={t} style={[styles.chip, tipoCiclo === t && styles.chipActive]} onPress={()=>setTipoCiclo(t)}><Text style={tipoCiclo===t?styles.txtW:styles.txtB}>{t}</Text></TouchableOpacity>)}</View>
              <Text style={styles.labelSub}>Anticonceptivo:</Text>
              <View style={styles.rowWrap}>{ANTICONCEPTIVOS.map(a => <TouchableOpacity key={a} style={[styles.chip, anticonceptivo === a && styles.chipActive]} onPress={()=>setAnticonceptivo(a)}><Text style={anticonceptivo===a?styles.txtW:styles.txtB}>{a}</Text></TouchableOpacity>)}</View>
              <TouchableOpacity style={styles.btnNext} onPress={()=>setSeccionActiva(4)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
            </Section>
          )}

{/* SECCION 4: SALUD */}
          <Section num={4} title="Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
            <Text style={styles.labelSub}>Enfermedades Familiares:</Text>
            <View style={styles.rowWrap}>{ENFERMEDADES_BASE.map(e => <TouchableOpacity key={e} style={[styles.chip, enfFam.includes(e) && styles.chipActive]} onPress={()=>{let n=enfFam.includes(e)?enfFam.filter(i=>i!==e):[...enfFam,e]; setEnfFam(n)}}><Text style={enfFam.includes(e)?styles.txtW:styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
            
            <Text style={styles.labelSub}>Enfermedades Propias:</Text>
            <View style={styles.rowWrap}>{ENFERMEDADES_BASE.map(e => <TouchableOpacity key={e} style={[styles.chip, enfPers.includes(e) && styles.chipActive]} onPress={()=>{let n=enfPers.includes(e)?enfPers.filter(i=>i!==e):[...enfPers,e]; setEnfPers(n)}}><Text style={enfPers.includes(e)?styles.txtW:styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
            
            <Text style={styles.labelSub}>¿Lesión?</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btnG, lesion==='si'&&styles.btnActive]} onPress={()=>setLesion('si')}><Text style={lesion==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnG, lesion==='no'&&styles.btnActive]} onPress={()=>setLesion('no')}><Text style={lesion==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity>
            </View>
            {lesion==='si'&&<TextInput style={styles.input} placeholder="Describe lesión" value={detalleLesion} onChangeText={setDetalleLesion}/>}
            
            <Text style={styles.labelSub}>¿Operación?</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btnG, operacion==='si'&&styles.btnActive]} onPress={()=>setOperacion('si')}><Text style={operacion==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnG, operacion==='no'&&styles.btnActive]} onPress={()=>setOperacion('no')}><Text style={operacion==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity>
            </View>
            {operacion==='si'&&<TextInput style={styles.input} placeholder="Describe operación" value={detalleOperacion} onChangeText={setDetalleOperacion}/>}
            
            <Text style={styles.labelSub}>Frecuencia Cardíaca Reposo (FCR):</Text>
            
            {/* CUADRO DE AYUDA (Helper Box) */}
            <View style={styles.helperBox}>
              <Text style={styles.helperTxt}>
                <Text style={{fontWeight: 'bold'}}>💡 Instrucciones: </Text>
                Presiona ligeramente con tus dedos índice y medio la muñeca o cuello. Cuenta los latidos por 15 segundos y multiplica el resultado por 4.
              </Text>
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Ej: 70" 
              value={frecuenciaCardiaca} 
              keyboardType="numeric" 
              onChangeText={setFrecuenciaCardiaca} 
            />
            
            <TouchableOpacity style={styles.btnNext} onPress={()=>setSeccionActiva(5)}>
              <Text style={styles.txtW}>Siguiente</Text>
            </TouchableOpacity>
          </Section>

          {/* SECCION 5: IPAQ */}
          <Section num={5} title="Estilo Vida" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
            <Text style={styles.labelIpaq}>Vigorosa (Días/Min):</Text>
            <View style={styles.row}><TextInput style={[styles.input,{flex:1,marginRight:5}]} placeholder="Días" value={vDias} onChangeText={setVDias}/><TextInput style={[styles.input,{flex:1}]} placeholder="Min" value={vMin} onChangeText={setVMin}/></View>
            <Text style={styles.labelIpaq}>Moderada (Días/Min):</Text>
            <View style={styles.row}><TextInput style={[styles.input,{flex:1,marginRight:5}]} placeholder="Días" value={mDias} onChangeText={setMDias}/><TextInput style={[styles.input,{flex:1}]} placeholder="Min" value={mMin} onChangeText={setMMin}/></View>
            <Text style={styles.labelIpaq}>Caminata (Días/Min):</Text>
            <View style={styles.row}><TextInput style={[styles.input,{flex:1,marginRight:5}]} placeholder="Días" value={cDias} onChangeText={setCDias}/><TextInput style={[styles.input,{flex:1}]} placeholder="Min" value={cMin} onChangeText={setCMin}/></View>
            <TextInput style={styles.input} placeholder="Horas sentado al día" value={sentado} keyboardType="numeric" onChangeText={setSentado} />
            <TextInput style={styles.input} placeholder="Horas sueño" value={horasSueno} keyboardType="numeric" onChangeText={setHorasSueno} />
            <TouchableOpacity style={styles.btnNext} onPress={()=>setSeccionActiva(6)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
          </Section>

          {/* SECCION 6: PAR-Q (CORREGIDO) */}
          <Section num={6} title="PAR-Q" color="#0ea5e9" icon="notes-medical" activa={seccionActiva} setActiva={setSeccionActiva}>
            {PREGUNTAS_PARQ.map((p, idx) => (
              <View key={p.id} style={styles.parqBlock}>
                <Text style={styles.parqTxt}>{idx+1}. {p.texto}</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.parqBtn, respuestasParq[p.id]==='si' && {backgroundColor:'#ef4444', borderColor:'#ef4444'}]} onPress={()=>setRespuestasParq({...respuestasParq, [p.id]:'si'})}>
                    <Text style={[styles.parqBtnTxt, respuestasParq[p.id]==='si' && {color:'#fff'}]}>SÍ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.parqBtn, respuestasParq[p.id]==='no' && {backgroundColor:'#10b981', borderColor:'#10b981'}]} onPress={()=>setRespuestasParq({...respuestasParq, [p.id]:'no'})}>
                    <Text style={[styles.parqBtnTxt, respuestasParq[p.id]==='no' && {color:'#fff'}]}>NO</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.btnNext} onPress={()=>setSeccionActiva(7)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
          </Section>

          {/* SECCION 7: NUTRICION (CORREGIDO) */}
          <Section num={7} title="Nutrición" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
            <Text style={styles.labelSub}>Comidas deseadas en plan:</Text>
            <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(n => <TouchableOpacity key={n} style={[styles.chip, comidasDes === n && styles.chipActive]} onPress={()=>setComidasDes(n)}><Text style={comidasDes===n?styles.txtW:styles.txtB}>{n}</Text></TouchableOpacity>)}</View>
            
            <Text style={styles.labelSub}>¿Consumes Alcohol?</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btnG, alcohol==='si'&&styles.btnActive]} onPress={()=>setAlcohol('si')}><Text style={alcohol==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnG, alcohol==='no'&&styles.btnActive]} onPress={()=>setAlcohol('no')}><Text style={alcohol==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity>
            </View>
            {alcohol==='si' && (
              <View style={styles.rowWrap}>{FREC_HABITOS.map(f=><TouchableOpacity key={f} style={[styles.chip, alcoholFreq===f&&styles.chipActive]} onPress={()=>setAlcoholFreq(f)}><Text style={alcoholFreq===f?styles.txtW:styles.txtB}>{f}</Text></TouchableOpacity>)}</View>
            )}

            <Text style={styles.labelSub}>¿Consumes sustancias o fumas?</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btnG, sust==='si'&&styles.btnActive]} onPress={()=>setSust('si')}><Text style={sust==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnG, sust==='no'&&styles.btnActive]} onPress={()=>setSust('no')}><Text style={sust==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity>
            </View>
            {sust==='si' && (
              <View style={styles.rowWrap}>{FREC_HABITOS.map(f=><TouchableOpacity key={f} style={[styles.chip, sustFreq===f&&styles.chipActive]} onPress={()=>setSustFreq(f)}><Text style={sustFreq===f?styles.txtW:styles.txtB}>{f}</Text></TouchableOpacity>)}</View>
            )}

            <TextInput style={[styles.input, {height:60, marginTop:10}]} multiline placeholder="Describe un día típico de comidas" value={descAct} onChangeText={setDescAct} />
            <Text style={styles.labelSub}>Días entrenamiento:</Text>
            <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(d => <TouchableOpacity key={d} style={[styles.chip, entrenos === d && styles.chipActive]} onPress={()=>setEntrenos(d)}><Text style={entrenos===d?styles.txtW:styles.txtB}>{d}</Text></TouchableOpacity>)}</View>
            <TextInput style={styles.input} placeholder="Objetivos principales" value={objetivo} onChangeText={setObjetivo} />
            <TouchableOpacity style={styles.btnNext} onPress={()=>setSeccionActiva(8)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
          </Section>

          {/* SECCION 8: FRECUENCIA ALIMENTOS */}
          <Section num={8} title="Frecuencia Alimentos" color="#10b981" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
            {LISTA_ALIMENTOS_FRECUENCIA.map(ali => (
              <View key={ali} style={{marginBottom:10}}>
                <Text style={{fontSize:12, fontWeight:'bold'}}>{ali}:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {OPCIONES_FRECUENCIA.map(op => (
                    <TouchableOpacity key={op} style={[styles.chip, frecuenciaAlimentos[ali] === op && styles.chipActive]} onPress={()=>setFrecuenciaAlimentos({...frecuenciaAlimentos, [ali]:op})}><Text style={{fontSize:10, color: frecuenciaAlimentos[ali]===op?'#fff':'#3b82f6'}}>{op}</Text></TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}
            <TouchableOpacity style={styles.btnNext} onPress={()=>setSeccionActiva(9)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
          </Section>

          {/* SECCION 9: FIRMA */}
          <Section num={9} title="Consentimiento" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
            <View style={styles.consentBox}>
              <ScrollView style={{height: 120}}><Text style={styles.consentTxt}>
                1. Propósito: Por medio del presente, declaro que participo de manera voluntaria en un programa de entrenamiento personal orientado al acondicionamiento físico. Entiendo que el servicio consiste en la planificación, instrucción y supervisión de actividad física y hábitos relacionados con el ejercicio. Reconozco que el entrenamiento personal NO constituye un servicio médico, de diagnóstico, rehabilitación, tratamiento de enfermedades o prescripción clínica. Si presento síntomas, lesiones, embarazo, padecimientos crónicos o dudas sobre mi aptitud para ejercitarme, me comprometo a consultar previamente a un profesional de la salud y a informar al Entrenador.
                2. Evaluacion: Para diseñar y ajustar el programa, el Entrenador podrá realizar una valoración física NO diagnóstica, que puede incluir: cuestionario de salud y actividad física, historial de lesiones, mediciones antropométricas peso, estatura, perímetros, pruebas de condición física por ejemplo, fuerza, movilidad, resistencia y monitoreo durante la sesión por ejemplo, frecuencia cardiaca y presión arterial si aplica. Puedo negarme a cualquier medición o prueba específica. Si mi negativa impide la prestación segura del servicio, el Entrenador podrá recomendar posponer o ajustar el programa.
                3. Contacto Fisico: Entiendo que, para demostrar ejercicios o corregir técnica y postura, puede ser necesario el contacto físico breve y profesional. El Entrenador solicitará mi autorización previa para dicho contacto y podré negarme o pedir alternativas sin represalias.
                4. Riesgos, molestias potenciales y medidas de seguridad: Se me ha informado que la actividad física puede implicar riesgos, incluyendo, entre otros: fatiga, dolor muscular tardío, mareos, deshidratación, lesiones musculares, de tendones, ligamentos o articulaciones, caídas, y en casos excepcionales, eventos cardiovasculares graves por ejemplo, arritmias, infarto e incluso muerte. Para reducir riesgos, el Entrenador ajustará cargas y ejercicios conforme a mi condición, explicará técnica y calentamiento, y me indicará pausas, hidratación y señales de alarma. Me comprometo a informar de inmediato cualquier síntoma inusual, como dolor torácico, falta de aire desproporcionada, mareo intenso, palpitaciones, desmayo, dolor agudo o cualquier malestar relevante. Entiendo que puedo detener el ejercicio en cualquier momento. Si ocurre una urgencia, autorizo a que se solicite asistencia médica y se llame al 911, y a que se comparta con personal de emergencia la información estrictamente necesaria para proteger mi vida e integridad.
                5. Beneficios esperados y alternativas: Comprendo que los resultados varían entre personas y dependen de múltiples factores constancia, descanso, alimentación, salud previa. El Entrenador no garantiza resultados específicos pérdida de peso, ganancia muscular, mejora estética o rendimiento. Alternativas al entrenamiento personal incluyen: actividad física por cuenta propia, clases grupales, programas en línea, o la asesoría de profesionales de la salud cuando exista una condición médica que así lo requiera.
                6. Declaraciones del Cliente / Titular: He proporcionado información completa y veraz sobre mi estado de salud, lesiones, medicamentos y antecedentes relevantes. Entiendo las indicaciones del Entrenador y preguntaré cualquier duda antes de ejecutar ejercicios. Notificaré cambios relevantes en mi salud síntomas, lesiones, embarazo, tratamiento médico. Actuaré con prudencia y atenderé las recomendaciones de seguridad calentamiento, técnica, hidratación y descanso.
                7. Proteccion de datos personales: He recibido y leído el Aviso de Privacidad Integral Anexo A. Se me explicó que para la prestación del servicio pueden recabarse y tratarse datos personales de identificación y contacto, así como datos personales sensibles relacionados con mi salud por ejemplo, antecedentes, síntomas, lesiones, medicación y mediciones físicas.
                8. Consentimineto Expreso: Otorgo mi consentimiento EXPRESO y por escrito para el tratamiento de mis datos personales sensibles conforme al Anexo.
              </Text></ScrollView>
            </View>
            <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarTerminos(!aceptarTerminos)}><MaterialCommunityIcons name={aceptarTerminos?"checkbox-marked":"checkbox-blank-outline"} size={22} color="#10b981"/><Text style={{fontSize:11}}>Acepto términos y condiciones</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnFirma} onPress={()=>setModalFirma(true)}><Text style={firma?{color:'#10b981', fontWeight:'bold'}:{color:'#3b82f6'}}>{firma?"✓ Firmado":"Hacer firma digital"}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnNext} onPress={()=>setSeccionActiva(10)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
          </Section>

          {/* SECCION 10: ENVIAR */}
          <Section num={10} title="Enviar" color="#64748b" icon="shield-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
            <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarPrivacidad(!aceptarPrivacidad)}><MaterialCommunityIcons name={aceptarPrivacidad?"checkbox-marked":"checkbox-blank-outline"} size={22} color="#10b981"/><Text style={{fontSize:11}}>Acepto aviso de privacidad</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnEnviar, (!firma||!aceptarTerminos||!aceptarPrivacidad)&&{backgroundColor:'#94a3b8'}]} onPress={enviarAlCoach} disabled={!firma}><Text style={styles.txtW}>FINALIZAR Y ENVIAR</Text></TouchableOpacity>
          </Section>
        </View>
      </ScrollView>

      <Modal visible={modalFirma} transparent><View style={styles.webModalOverlay}><View style={styles.webModalCard}><Text style={{fontWeight:'bold',marginBottom:10}}>Escribe tu nombre como firma:</Text><TextInput style={styles.input} onChangeText={setFirma} value={firma||''} /><TouchableOpacity style={styles.btnNext} onPress={()=>setModalFirma(false)}><Text style={styles.txtW}>Confirmar</Text></TouchableOpacity></View></View></Modal>
    </SafeAreaView>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, maxWidth: 600, alignSelf: 'center', width: '100%' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  scroll: { paddingBottom: 60 },
  webWrapper: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 15 },
  card: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 10, elevation: 2 },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold' },
  content: { padding: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  input: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 5 },
  chip: { padding: 8, borderRadius: 15, borderWidth: 1, borderColor: '#3b82f6', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#3b82f6' },
  btnG: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', alignItems: 'center' },
  btnActive: { backgroundColor: '#3b82f6' },
  txtB: { color: '#3b82f6', fontWeight: 'bold' },
  txtW: { color: '#fff', fontWeight: 'bold' },
  labelSub: { fontSize: 13, fontWeight: 'bold', marginTop: 10 },
  labelIpaq: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  parqBlock: { marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  parqTxt: { fontSize: 12, color: '#334155', marginBottom: 8 },
  parqBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', marginHorizontal: 5 },
  parqBtnTxt: { fontWeight: 'bold', color: '#64748b' },
  btnFirma: { padding: 15, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#3b82f6', alignItems: 'center', marginVertical: 10 },
  rowCheck: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  btnEnviar: { backgroundColor: '#10b981', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  btnNext: { padding: 12, backgroundColor: '#3b82f6', borderRadius: 8, alignItems: 'center', marginTop: 10 },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc' },
  esperaCard: { backgroundColor:'#fff', padding: 30, borderRadius: 20, width: '100%', maxWidth: 450, elevation: 4 },
  esperaTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  esperaSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 10 },
  logoutBtnLarge: { marginTop: 25, backgroundColor: '#ef4444', padding: 12, borderRadius: 10, width: '100%', alignItems: 'center' },
  webModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  webModalCard: { backgroundColor: '#fff', width: '90%', maxWidth: 400, padding: 20, borderRadius: 15 },
  consentBox: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 10 },
  consentTxt: { fontSize: 10, color: '#64748b' },
  progressContainer: { marginBottom: 20 },
  progressText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  progressBarBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3b82f6' },
  helperBox: { backgroundColor: '#eff6ff', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#bfdbfe', },
  helperTxt: { fontSize: 11, color: '#1e40af', lineHeight: 16, },
});
