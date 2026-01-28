import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { db, auth } from '../../firebaseConfig'; 
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, limit, orderBy } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { FontAwesome5, MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';
import AuthScreen from '../AuthScreen'; 
import CoachPanel from '../(admin)/coach';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// CONSTANTES RESTAURADAS
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
        if (userActualizado) {
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
  const [paso, setPaso] = useState<'formulario' | 'espera' | 'dashboard'>('formulario');
  const [planActivo, setPlanActivo] = useState<any>(null);
  const [cargandoStatus, setCargandoStatus] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState<number | null>(null);
  const [modalFirma, setModalFirma] = useState(false);
  const [firma, setFirma] = useState<string | null>(null);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [aceptarPrivacidad, setAceptarPrivacidad] = useState(false);
  const router = useRouter();

  // TODOS LOS ESTADOS RESTAURADOS
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
    // Escucha en tiempo real para saltar el formulario si ya hay plan o revision
    const qPlan = query(collection(db, "alumnos_activos", user.uid, "planes_publicados"), orderBy("fechaPublicacion", "desc"), limit(1));
    const unsub = onSnapshot(qPlan, (snap) => {
      if (!snap.empty) {
        setPlanActivo(snap.docs[0].data());
        setPaso('dashboard');
        setCargandoStatus(false);
      } else {
        const qRev = query(collection(db, "revisiones_pendientes"), where("uid", "==", user.uid));
        onSnapshot(qRev, (snapRev) => {
          if (!snapRev.empty) setPaso('espera');
          else setPaso('formulario');
          setCargandoStatus(false);
        });
      }
    });
    return () => unsub();
  }, [user]);

  const enviarAlCoach = async () => {
    if (!nombre || !firma || !aceptarTerminos || !aceptarPrivacidad || !edad) {
      alert("Completa Nombre, Edad, Firma y Avisos Legales.");
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
    } catch (e) { Alert.alert("Error", "No se pudo enviar."); }
  };

  if (cargandoStatus) return <View style={styles.esperaContainer}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  if (paso === 'espera') {
    return (
      <View style={styles.esperaContainer}>
        <View style={styles.esperaCard}>
          <Text style={{fontSize: 50, textAlign:'center'}}>⏳</Text>
          <Text style={styles.esperaTitle}>¡En Revisión!</Text>
          <Text style={styles.esperaSub}>Ya recibimos tu check-in. Tu Coach está preparando tu plan personalizado.</Text>
          <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtnLarge}><Text style={styles.txtW}>Cerrar Sesión</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  if (paso === 'dashboard' && planActivo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webWrapper}>
          <View style={styles.headerDashboard}>
            <View><Text style={styles.welcomeText}>¡Hola! 👋</Text><Text style={styles.dateText}>Plan Activo</Text></View>
            <TouchableOpacity onPress={() => signOut(auth)}><FontAwesome5 name="power-off" size={20} color="#ef4444" /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.macroGrid}>
              <View style={[styles.macroCard, {backgroundColor: '#eff6ff'}]}><Text style={styles.macroVal}>{Math.round(planActivo.totalesFinales?.kcal || 0)}</Text><Text style={styles.macroLabel}>KCAL</Text></View>
              <View style={[styles.macroCard, {backgroundColor: '#f0fdf4'}]}><Text style={styles.macroVal}>{Math.round(planActivo.totalesFinales?.p || 0)}g</Text><Text style={styles.macroLabel}>PROT</Text></View>
              <View style={[styles.macroCard, {backgroundColor: '#fffbeb'}]}><Text style={styles.macroVal}>{Math.round(planActivo.totalesFinales?.g || 0)}g</Text><Text style={styles.macroLabel}>GRASA</Text></View>
              <View style={[styles.macroCard, {backgroundColor: '#fef2f2'}]}><Text style={styles.macroVal}>{Math.round(planActivo.totalesFinales?.c || 0)}g</Text><Text style={styles.macroLabel}>CARBS</Text></View>
            </View>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(client)/dieta' as any)}>
              <View style={[styles.iconBox, {backgroundColor:'#3b82f6'}]}><FontAwesome5 name="utensils" size={16} color="#fff"/></View>
              <Text style={styles.actionTitle}>Ver Dieta</Text>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(client)/rutina' as any)}>
              <View style={[styles.iconBox, {backgroundColor:'#10b981'}]}><FontAwesome5 name="dumbbell" size={16} color="#fff"/></View>
              <Text style={styles.actionTitle}>Ir a Entrenar</Text>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
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

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.webWrapper}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Progreso: {seccionActiva || 0} de 10</Text>
            <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${(Number(seccionActiva || 0) / 10) * 100}%` }]} /></View>
          </View>

          {/* SECCIÓN 1: DATOS PERSONALES */}
          <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
            <TextInput style={styles.input} placeholder="Nombre Completo" value={nombre} onChangeText={setNombre} />
            <TextInput style={styles.input} placeholder="Teléfono" value={telefono} onChangeText={(v) => setTelefono(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={10} />
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

          {/* SECCIÓN 2: MEDIDAS */}
          <Section num={2} title="Medidas Corporales (CM)" color="#10b981" icon="ruler-horizontal" activa={seccionActiva} setActiva={setSeccionActiva}>
            <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cuello" value={cuello} onChangeText={setCuello}/><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Pecho" value={pecho} onChangeText={setPecho}/></View>
            <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Brazo Rel" value={brazoR} onChangeText={setBrazoR}/><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Brazo Flex" value={brazoF} onChangeText={setBrazoF}/></View>
            <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Cintura" value={cintura} onChangeText={setCintura}/><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Cadera" value={cadera} onChangeText={setCadera}/></View>
            <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Muslo" value={muslo} onChangeText={setMuslo}/><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Pierna" value={pierna} onChangeText={setPierna}/></View>
            <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(genero === 'mujer' ? 3 : 4)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
          </Section>

          {/* SECCIÓN 3: CICLO (SOLO MUJER) */}
          {genero === 'mujer' && (
            <Section num={3} title="Ciclo Menstrual" color="#ec4899" icon="venus" activa={seccionActiva} setActiva={setSeccionActiva}>
              <View style={styles.rowWrap}>{TIPOS_CICLO.map(t => <TouchableOpacity key={t} style={[styles.chip, tipoCiclo === t && styles.chipActive]} onPress={()=>setTipoCiclo(t)}><Text style={tipoCiclo === t ? styles.txtW : styles.txtB}>{t}</Text></TouchableOpacity>)}</View>
              <Text style={styles.labelSub}>Anticonceptivo:</Text>
              <View style={styles.rowWrap}>{ANTICONCEPTIVOS.map(a => <TouchableOpacity key={a} style={[styles.chip, anticonceptivo === a && styles.chipActive]} onPress={()=>setAnticonceptivo(a)}><Text style={anticonceptivo === a ? styles.txtW : styles.txtB}>{a}</Text></TouchableOpacity>)}</View>
              <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(4)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>
          )}

          {/* SECCIÓN 4: SALUD */}
          <Section num={4} title="Historial Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
            <Text style={styles.labelSub}>Enfermedades Propias:</Text>
            <View style={styles.rowWrap}>{ENFERMEDADES_BASE.map(e => <TouchableOpacity key={e} style={[styles.chip, enfPers.includes(e) && styles.chipActive]} onPress={()=>{let n = enfPers.includes(e)?enfPers.filter(i=>i!==e):[...enfPers,e]; setEnfPers(n)}}><Text style={enfPers.includes(e)?styles.txtW:styles.txtB}>{e}</Text></TouchableOpacity>)}</View>
            <Text style={styles.labelSub}>¿Lesión/Operación?</Text>
            <TextInput style={styles.input} placeholder="Detalles..." value={detalleLesion} onChangeText={setDetalleLesion} />
            <TextInput style={styles.input} placeholder="FCR (Latidos por minuto)" value={frecuenciaCardiaca} keyboardType="numeric" onChangeText={setFrecuenciaCardiaca} />
            <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(5)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
          </Section>

          {/* SECCIÓN 5: ESTILO VIDA (IPAQ) */}
          <Section num={5} title="Estilo Vida" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
            <Text style={styles.labelIpaq}>Actividad Vigorosa (Días/Minutos):</Text>
            <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Días" value={vDias} keyboardType="numeric" onChangeText={setVDias}/><TextInput style={[styles.input, {flex:1}]} placeholder="Min" value={vMin} keyboardType="numeric" onChangeText={setVMin}/></View>
            <TextInput style={styles.input} placeholder="Horas sentado al día" value={sentado} keyboardType="numeric" onChangeText={setSentado} />
            <TextInput style={styles.input} placeholder="Horas de sueño" value={horasSueno} keyboardType="numeric" onChangeText={setHorasSueno} />
            <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(6)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
          </Section>

          {/* SECCIÓN 6: PAR-Q */}
          <Section num={6} title="PAR-Q" color="#0ea5e9" icon="notes-medical" activa={seccionActiva} setActiva={setSeccionActiva}>
            {PREGUNTAS_PARQ.map((p, idx) => (
              <View key={p.id} style={{marginBottom: 15}}>
                <Text style={{fontSize: 13, color: '#334155'}}>{idx+1}. {p.texto}</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.btnG, respuestasParq[p.id]==='si' && styles.btnActive]} onPress={()=>setRespuestasParq({...respuestasParq, [p.id]: 'si'})}><Text style={respuestasParq[p.id]==='si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.btnG, respuestasParq[p.id]==='no' && styles.btnActive]} onPress={()=>setRespuestasParq({...respuestasParq, [p.id]: 'no'})}><Text style={respuestasParq[p.id]==='no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(7)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
          </Section>

          {/* SECCIÓN 7: NUTRICIÓN */}
          <Section num={7} title="Nutrición" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
            <TextInput style={[styles.input, {height: 80}]} multiline placeholder="¿Qué comes en un día normal?" value={descAct} onChangeText={setDescAct} />
            <Text style={styles.labelSub}>¿Consumes alcohol?</Text>
            <View style={styles.row}><TouchableOpacity style={[styles.btnG, alcohol==='si' && styles.btnActive]} onPress={()=>setAlcohol('si')}><Text>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, alcohol==='no' && styles.btnActive]} onPress={()=>setAlcohol('no')}><Text>NO</Text></TouchableOpacity></View>
            {alcohol==='si' && <View style={styles.rowWrap}>{["Diario", "Semanal", "Mensual", "Social"].map(f => <TouchableOpacity key={f} style={[styles.chip, alcoholFreq === f && styles.chipActive]} onPress={()=>setAlcoholFreq(f)}><Text>{f}</Text></TouchableOpacity>)}</View>}
            <TextInput style={styles.input} placeholder="Objetivo Principal" value={objetivo} onChangeText={setObjetivo} />
            <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(8)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
          </Section>

          {/* SECCIÓN 8: FRECUENCIA */}
          <Section num={8} title="Frecuencia Alimentos" color="#10b981" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
            {LISTA_ALIMENTOS_FRECUENCIA.map(ali => (
              <View key={ali} style={{marginBottom:15}}>
                <Text style={{fontSize:13, fontWeight:'bold'}}>{ali}:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {OPCIONES_FRECUENCIA.map(op => (
                    <TouchableOpacity key={op} style={[styles.chip, frecuenciaAlimentos[ali] === op && styles.chipActive]} onPress={()=>setFrecuenciaAlimentos({...frecuenciaAlimentos, [ali]:op})}><Text style={{fontSize:11}}>{op}</Text></TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}
            <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(9)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
          </Section>

          {/* SECCIÓN 9: FIRMA */}
          <Section num={9} title="Firma" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
            <TouchableOpacity style={styles.btnFirma} onPress={() => setModalFirma(true)}><Text style={styles.btnFirmaText}>{firma ? "✓ Firmado" : "Click para Firmar"}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarTerminos(!aceptarTerminos)}><MaterialCommunityIcons name={aceptarTerminos?"checkbox-marked":"checkbox-blank-outline"} size={24} color="#10b981"/><Text style={styles.miniTxt}>Acepto términos y condiciones.</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(10)}><Text style={styles.txtW}>Último Paso</Text></TouchableOpacity>
          </Section>

          {/* SECCIÓN 10: ENVIAR */}
          <Section num={10} title="Finalizar" color="#64748b" icon="shield-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
            <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarPrivacidad(!aceptarPrivacidad)}><MaterialCommunityIcons name={aceptarPrivacidad?"checkbox-marked":"checkbox-blank-outline"} size={24} color="#10b981"/><Text style={styles.miniTxt}>Acepto aviso de privacidad.</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnEnviar, (!aceptarTerminos || !aceptarPrivacidad || !firma) && {backgroundColor: '#94a3b8'}]} onPress={enviarAlCoach} disabled={!firma}><Text style={styles.txtW}>ENVIAR CHECK-IN</Text></TouchableOpacity>
          </Section>
        </View>
      </ScrollView>

      {/* MODAL FIRMA */}
      <Modal visible={modalFirma} transparent animationType="fade">
        <View style={styles.webModalOverlay}>
          <View style={styles.webModalCard}>
            <Text style={styles.webModalTitle}>Firma Digital</Text>
            <TextInput style={[styles.input, {fontStyle:'italic', textAlign:'center'}]} placeholder="Escribe tu nombre completo" onChangeText={setFirma} value={firma||''} />
            <TouchableOpacity style={styles.btnEnviar} onPress={() => setModalFirma(false)}><Text style={styles.txtW}>CONFIRMAR FIRMA</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, maxWidth: 800, alignSelf: 'center', width: '100%' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 },
  scroll: { paddingBottom: 60 },
  webWrapper: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 15 },
  progressContainer: { marginBottom: 20 },
  progressText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  progressBarBg: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3b82f6' },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  numCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  content: { padding: 18, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  input: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#3b82f6' },
  chipActive: { backgroundColor: '#3b82f6' },
  btnG: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#3b82f6', alignItems: 'center' },
  btnActive: { backgroundColor: '#3b82f6' },
  txtB: { color: '#3b82f6', fontWeight: 'bold' },
  txtW: { color: '#fff', fontWeight: 'bold' },
  labelSub: { fontSize: 14, fontWeight: 'bold', marginTop: 10 },
  labelIpaq: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  btnFirma: { padding: 18, borderRadius: 12, borderWidth: 2, borderColor: '#3b82f6', borderStyle: 'dashed', alignItems: 'center', marginVertical: 15 },
  btnFirmaText: { color: '#3b82f6', fontWeight: 'bold' },
  rowCheck: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  miniTxt: { fontSize: 12, flex: 1 },
  btnEnviar: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  btnNext: { padding: 14, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center', marginTop: 15 },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc' },
  esperaCard: { backgroundColor:'#fff', padding: 40, borderRadius: 20, width: '100%', maxWidth: 450, elevation: 4 },
  esperaTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  esperaSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 10 },
  logoutBtnLarge: { marginTop: 30, backgroundColor: '#ef4444', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
  webModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  webModalCard: { backgroundColor: '#fff', width: '90%', maxWidth: 400, padding: 20, borderRadius: 15 },
  webModalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  headerDashboard: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  welcomeText: { fontSize: 20, fontWeight: 'bold' },
  dateText: { color: '#10b981', fontWeight: 'bold' },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 15 },
  macroCard: { flex: 1, minWidth: '45%', padding: 15, borderRadius: 15, alignItems: 'center' },
  macroVal: { fontSize: 20, fontWeight: 'bold' },
  macroLabel: { fontSize: 10, color: '#64748b' },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  actionTitle: { flex: 1, marginLeft: 15, fontWeight: 'bold' },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }
});
