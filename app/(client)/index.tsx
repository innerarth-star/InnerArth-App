// [Mantenemos todos tus imports iguales...]
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

// [Tus constantes se mantienen iguales...]
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
  const [seccionActiva, setSeccionActiva] = useState<number | null>(1);
  const [modalFirma, setModalFirma] = useState(false);
  const [firma, setFirma] = useState<string | null>(null);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [aceptarPrivacidad, setAceptarPrivacidad] = useState(false);

  // ESTADOS PERSISTENTES (Mantenemos todos los que ya tenías)
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
    if (!nombre || (!firma && Platform.OS !== 'web') || !aceptarTerminos || !aceptarPrivacidad || !edad) {
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
        <View style={styles.esperaCard}>
            <FontAwesome5 name="clock" size={80} color="#f59e0b" style={{alignSelf:'center'}} />
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
            <Text style={styles.headerTitle}>Check-in <Text style={{color:'#3b82f6'}}>FitTech</Text></Text>
            <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn}>
                <FontAwesome5 name="sign-out-alt" size={18} color="#ef4444" />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.webWrapper}>
            {/* BARRA DE PROGRESO */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Progreso: {seccionActiva} de 9</Text>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(Number(seccionActiva) / 9) * 100}%` }]} />
                </View>
            </View>

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
                <View style={styles.row}><TextInput style={[styles.input, {flex:1, marginRight:5}]} placeholder="Brazo R" value={brazoR} keyboardType="numeric" onChangeText={setBrazoR} /><TextInput style={[styles.input, {flex:1, marginLeft:5}]} placeholder="Brazo F" value={brazoF} keyboardType="numeric" onChangeText={setBrazoF} /></View>
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
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(6)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>

            <Section num={6} title="Nutrición y Hábitos" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
                <Text style={styles.labelSub}>Comidas actuales:</Text>
                <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(n => <TouchableOpacity key={n} style={[styles.chip, comidasAct === n && styles.chipActive]} onPress={()=>setComidasAct(n)}><Text style={comidasAct === n ? styles.txtW : styles.txtB}>{n}</Text></TouchableOpacity>)}</View>
                <TextInput style={[styles.input, {height: 80}]} multiline placeholder="Describe lo que comes en un día típico..." value={descAct} onChangeText={setDescAct} />
                <Text style={styles.labelSub}>¿Consumes Alcohol?</Text>
                <View style={styles.row}><TouchableOpacity style={[styles.btnG, alcohol==='si' && styles.btnActive]} onPress={()=>setAlcohol('si')}><Text style={alcohol==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, alcohol==='no' && styles.btnActive]} onPress={()=>setAlcohol('no')}><Text style={alcohol==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity></View>
                {alcohol === 'si' && <View style={styles.rowWrap}>{["Diario", "Semanal", "Mensual", "Social"].map(f => <TouchableOpacity key={f} style={[styles.chip, alcoholFreq === f && styles.chipActive]} onPress={()=>setAlcoholFreq(f)}><Text style={alcoholFreq === f ? styles.txtW : styles.txtB}>{f}</Text></TouchableOpacity>)}</View>}
                <Text style={styles.labelSub}>¿Fumas o usas otras sustancias?</Text>
                <View style={styles.row}><TouchableOpacity style={[styles.btnG, sust==='si' && styles.btnActive]} onPress={()=>setSust('si')}><Text style={sust==='si'?styles.txtW:styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, sust==='no' && styles.btnActive]} onPress={()=>setSust('no')}><Text style={sust==='no'?styles.txtW:styles.txtB}>NO</Text></TouchableOpacity></View>
                {sust === 'si' && <View style={styles.rowWrap}>{["Diario", "Semanal", "Mensual", "Social"].map(f => <TouchableOpacity key={f} style={[styles.chip, sustFreq === f && styles.chipActive]} onPress={()=>setSustFreq(f)}><Text style={sustFreq === f ? styles.txtW : styles.txtB}>{f}</Text></TouchableOpacity>)}</View>}
                <Text style={styles.labelSub}>¿Cuántas comidas deseas en tu plan?</Text>
                <View style={styles.rowWrap}>{["3", "4", "5", "6"].map(n => <TouchableOpacity key={n} style={[styles.chip, comidasDes === n && styles.chipActive]} onPress={()=>setComidasDes(n)}><Text style={comidasDes === n ? styles.txtW : styles.txtB}>{n}</Text></TouchableOpacity>)}</View>
                <Text style={styles.labelSub}>Días disponibles para entrenar:</Text>
                <View style={styles.rowWrap}>{["3", "4", "5", "6", "7"].map(d => <TouchableOpacity key={d} style={[styles.chip, entrenos === d && styles.chipActive]} onPress={()=>setEntrenos(d)}><Text style={entrenos === d ? styles.txtW : styles.txtB}>{d}</Text></TouchableOpacity>)}</View>
                <TextInput style={styles.input} placeholder="¿Cuáles son tus objetivos principales?" value={objetivo} onChangeText={setObjetivo} />
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(7)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>

            <Section num={7} title="Frecuencia Alimentos" color="#10b981" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
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
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(8)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>

            <Section num={8} title="Consentimiento" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
                <View style={styles.consentBox}>
                    <Text style={styles.consentHeader}>CONSENTIMIENTO INFORMADO</Text>
                    <Text style={styles.miniTxt}>Participante: {nombre || '---'} | Fecha: {new Date().toLocaleDateString()}</Text>
                    <ScrollView style={{height: 150, marginTop: 10}}>
                        <Text style={styles.consentTxt}>
                            1. Propósito: Acepto participar en un plan de entrenamiento personal... (resumen del texto legal que ya tienes)
                        </Text>
                    </ScrollView>
                </View>
                <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarTerminos(!aceptarTerminos)}>
                    <MaterialCommunityIcons name={aceptarTerminos?"checkbox-marked":"checkbox-blank-outline"} size={24} color="#10b981"/>
                    <Text style={styles.miniTxt}>Acepto términos y condiciones del consentimiento.</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnFirma} onPress={() => setModalFirma(true)}>
                    <Text style={styles.btnFirmaText}>{firma ? "✓ Firma Registrada" : "Hacer firma digital"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnNext} onPress={() => setSeccionActiva(9)}><Text style={styles.txtW}>Siguiente Paso</Text></TouchableOpacity>
            </Section>

            <Section num={9} title="Aviso de Privacidad" color="#64748b" icon="shield-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
                <View style={styles.consentBox}>
                    <Text style={styles.consentTxt}>FitTech es responsable del uso y protección de sus datos personales. Sus datos serán utilizados para integrar su expediente y dar seguimiento a su plan.</Text>
                </View>
                <TouchableOpacity style={styles.rowCheck} onPress={()=>setAceptarPrivacidad(!aceptarPrivacidad)}>
                    <MaterialCommunityIcons name={aceptarPrivacidad?"checkbox-marked":"checkbox-blank-outline"} size={24} color="#10b981"/>
                    <Text style={styles.miniTxt}>He leído y acepto el aviso de privacidad.</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.btnEnviar, (!aceptarTerminos || !aceptarPrivacidad) && {backgroundColor: '#94a3b8'}]} 
                    onPress={enviarAlCoach}
                    disabled={!aceptarTerminos || !aceptarPrivacidad}
                >
                    <Text style={styles.txtW}>FINALIZAR Y ENVIAR A MI COACH</Text>
                </TouchableOpacity>
            </Section>
        </View>
      </ScrollView>

      <Modal visible={modalFirma} animationType="slide">
        <View style={{flex:1, backgroundColor:'#fff', paddingTop:50}}>
            <SignatureScreen onOK={s=>{setFirma(s); setModalFirma(false);}} descriptionText="Firma"/>
            <TouchableOpacity onPress={() => setModalFirma(false)} style={{padding:20, alignItems:'center'}}>
                <Text style={{color:'red', fontWeight:'bold'}}>Cancelar</Text>
            </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', zIndex: 10 },
  headerInner: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%'
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  logoutBtn: { padding: 10, backgroundColor: '#fee2e2', borderRadius: 10 },
  scroll: { paddingBottom: 60 },
  webWrapper: {
    width: '100%',
    maxWidth: 600, // ANCHO MÁXIMO PARA WEB
    alignSelf: 'center',
    padding: 15
  },
  progressContainer: { marginBottom: 20, paddingHorizontal: 5 },
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
  labelIpaq: { fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: '600' },
  consentBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, marginVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  consentHeader: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#1e293b' },
  consentTxt: { fontSize: 11, color: '#64748b', textAlign: 'justify', lineHeight: 16 },
  btnFirma: { padding: 18, borderRadius: 12, borderWidth: 2, borderColor: '#3b82f6', borderStyle: 'dashed', alignItems: 'center', marginVertical: 15, backgroundColor: '#eff6ff' },
  btnFirmaText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 15 },
  rowCheck: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  miniTxt: { fontSize: 12, color: '#334155', flex: 1 },
  btnEnviar: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, elevation: 2 },
  btnNext: { padding: 14, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center', marginTop: 15 },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc' },
  esperaCard: { backgroundColor:'#fff', padding:40, borderRadius:20, width:'100%', maxWidth:450, elevation:4, shadowColor:'#000', shadowOpacity:0.1, shadowRadius:15 },
  esperaTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginTop: 20 },
  esperaSub: { fontSize: 15, color: '#64748b', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  logoutBtnLarge: { marginTop: 30, backgroundColor: '#ef4444', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center' }
});