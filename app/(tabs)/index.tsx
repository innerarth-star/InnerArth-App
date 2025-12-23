import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, LayoutAnimation, Modal, ActivityIndicator, StatusBar } from 'react-native';
import { db, auth } from '../../firebaseConfig'; 
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'; // Importamos query y where
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { FontAwesome5, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';
import AuthScreen from '../AuthScreen'; 

const ENFERMEDADES_BASE = ["Diabetes", "Hipertensión", "Obesidad", "Hipotiroidismo", "Cáncer", "Cardiopatías", "Asma", "Ninguna", "Otra"];
const ANTICONCEPTIVOS = ["Pastillas", "Inyección", "DIU", "Implante", "Parche", "Ninguno"];
const TIPOS_CICLO = ["Regular", "Irregular", "Menopausia"];
const OPCIONES_FRECUENCIA = ["Nunca", "1-3 al mes", "1 a la semana", "2-4 a la semana", "5-6 a la semana", "Diario"];
const LISTA_ALIMENTOS_FRECUENCIA = ["Frutas", "Verduras", "Leche", "Yogurt", "Quesos", "Embutidos", "Huevo", "Carnes", "Pescado", "Leguminosas"];

export default function ClienteScreen() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [user, setUser] = useState<any>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  // --- ESTADOS DE NAVEGACIÓN ---
  const [paso, setPaso] = useState<'formulario' | 'espera'>('formulario');
  const [seccionActiva, setSeccionActiva] = useState<number | null>(1);
  const [modalFirma, setModalFirma] = useState(false);
  const [firma, setFirma] = useState<string | null>(null);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [fechaHoy] = useState(new Date().toLocaleDateString());

  // --- ESTADOS DEL FORMULARIO ---
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState<'hombre' | 'mujer' | null>(null);
  const [medidas, setMedidas] = useState({ cuello: '', cintura: '', brazoR: '', brazoF: '', muslo: '', pierna: '' });
  const [ciclo, setCiclo] = useState('');
  const [anticonceptivo, setAnticonceptivo] = useState('');
  const [ipaq, setIpaq] = useState({ vigorosaDias: '', vigorosaMin: '', vigorosaNada: false, moderadaDias: '', moderadaMin: '', moderadaNada: false, caminataDias: '', caminataMin: '', caminataNada: false, sentadoHoras: '' });
  
  // Salud
  const [enfFamiliares, setEnfFamiliares] = useState<string[]>([]);
  const [otrosFam, setOtrosFam] = useState('');
  const [enfPersonales, setEnfPersonales] = useState<string[]>([]);
  const [otrosPers, setOtrosPers] = useState('');
  const [alergiaMedicamento, setAlergiaMedicamento] = useState('');

  // Preferencias y Plan
  const [numComidas, setNumComidas] = useState<number | null>(null);
  const [alergiaAlimento, setAlergiaAlimento] = useState('');
  const [diasEntreno, setDiasEntreno] = useState<number | null>(null);
  const [tuvoLesion, setTuvoLesion] = useState<string | null>(null);
  const [detalleLesion, setDetalleLesion] = useState('');
  const [tuvoOperacion, setTuvoOperacion] = useState<string | null>(null);
  const [detalleOperacion, setDetalleOperacion] = useState('');
  const [objetivoDeseado, setObjetivoDeseado] = useState('');
  const [frecuenciasAlimentos, setFrecuenciasAlimentos] = useState<any>({});

  // --- EFECTOS (MODIFICADO PARA REVISAR SI YA EXISTE REGISTRO) ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usuario) => {
      setUser(usuario);
      if (usuario) {
        try {
          // Consultamos si el UID actual ya tiene una revisión enviada
          const q = query(collection(db, "revisiones_pendientes"), where("uid", "==", usuario.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setPaso('espera'); // Si ya tiene datos, lo mandamos a la pantalla final
          }
        } catch (error) {
          console.log("Error verificando registro previo:", error);
        }
      }
      setCargandoAuth(false);
    });
    return unsub;
  }, []);

  // --- FUNCIONES ---
  const siguienteSeccion = (actual: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (actual === 2 && genero === 'hombre') {
      setSeccionActiva(4);
    } else {
      setSeccionActiva(actual + 1);
    }
  };

  const toggleChip = (lista: string[], setLista: Function, valor: string) => {
    lista.includes(valor) ? setLista(lista.filter(item => item !== valor)) : setLista([...lista, valor]);
  };

  const enviarAlCoach = async () => {
    if (!nombre || !firma || !aceptarTerminos || !genero) {
      Alert.alert("Atención", "Es obligatorio completar nombre, género, aceptar términos y firmar.");
      return;
    }
    setPaso('espera');
    try {
      await addDoc(collection(db, "revisiones_pendientes"), {
        uid: user.uid,
        nombre, telefono, email: user.email, peso, altura, edad, genero, medidas,
        salud: { enfFamiliares, otrosFam, enfPersonales, otrosPers, alergiaMedicamento, ciclo: genero === 'mujer' ? { tipo: ciclo, anticonceptivo } : 'N/A' },
        actividadFisica: ipaq,
        plan: { numComidas, alergiaAlimento, diasEntreno, tuvoLesion, detalleLesion, tuvoOperacion, detalleOperacion, objetivoDeseado },
        frecuenciaAlimentos: frecuenciasAlimentos,
        firmaCliente: firma,
        fechaConsentimiento: fechaHoy,
        status: 'pendiente',
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.log("Error de red:", e);
    }
  };

  if (cargandoAuth) {
    return <View style={styles.esperaContainer}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (paso === 'espera') {
    return (
      <View style={styles.esperaContainer}>
        <StatusBar barStyle="dark-content" />
        <FontAwesome5 name="check-circle" size={100} color="#10b981" />
        <Text style={styles.esperaTitle}>¡Todo listo!</Text>
        <View style={styles.planCard}>
          <Text style={styles.planTag}>FASE 1</Text>
          <Text style={styles.planNombre}>Análisis FitTech</Text>
          <Text style={styles.planStatus}>Estado: <Text style={{color: '#f59e0b', fontWeight: 'bold'}}>En revisión</Text></Text>
        </View>
        <Text style={styles.esperaSub}>Hemos recibido tu información. Tu Coach diseñará tu estrategia personalizada pronto.</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={{marginTop: 30}}><Text style={{color: '#ef4444'}}>Cerrar Sesión</Text></TouchableOpacity>
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Check-in FitTech</Text>
        
        {/* 1. DATOS PERSONALES */}
        <View style={styles.card}>
          <SectionHeader num={1} title="Datos Personales" color="#3b82f6" icon="user-alt" activa={seccionActiva} setActiva={setSeccionActiva} />
          {seccionActiva === 1 && (
            <View style={styles.content}>
              <TextInput style={styles.input} placeholder="Nombre Completo" value={nombre} onChangeText={setNombre} />
              <TextInput style={styles.input} placeholder="Teléfono" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
              <TextInput style={styles.input} placeholder="Email de contacto" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="Peso (kg)" keyboardType="numeric" value={peso} onChangeText={setPeso} />
                <TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} placeholder="Altura (cm)" keyboardType="numeric" value={altura} onChangeText={setAltura} />
              </View>
              <TextInput style={styles.input} placeholder="Edad" keyboardType="numeric" value={edad} onChangeText={setEdad} />
              <View style={styles.row}>
                <TouchableOpacity style={[styles.btnG, genero === 'hombre' && styles.btnActive]} onPress={() => { setGenero('hombre'); siguienteSeccion(1); }}><Text style={genero === 'hombre' ? styles.txtW : styles.txtB}>HOMBRE</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.btnG, genero === 'mujer' && styles.btnActive]} onPress={() => { setGenero('mujer'); siguienteSeccion(1); }}><Text style={genero === 'mujer' ? styles.txtW : styles.txtB}>MUJER</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 2. MEDIDAS */}
        <View style={[styles.card, {marginTop: 10}]}>
          <SectionHeader num={2} title="Medidas Corporales (cm)" color="#10b981" icon="ruler-combined" activa={seccionActiva} setActiva={setSeccionActiva} />
          {seccionActiva === 2 && (
            <View style={styles.content}>
              <View style={styles.row}><TextInput style={[styles.input,{flex:1, marginRight:5}]} placeholder="Cintura" value={medidas.cintura} onChangeText={t=>setMedidas({...medidas, cintura:t})} keyboardType="numeric" /><TextInput style={[styles.input,{flex:1, marginLeft:5}]} placeholder="Cuello" value={medidas.cuello} onChangeText={t=>setMedidas({...medidas, cuello:t})} keyboardType="numeric" /></View>
              <View style={styles.row}><TextInput style={[styles.input,{flex:1, marginRight:5}]} placeholder="Brazo R." value={medidas.brazoR} onChangeText={t=>setMedidas({...medidas, brazoR:t})} keyboardType="numeric" /><TextInput style={[styles.input,{flex:1, marginLeft:5}]} placeholder="Brazo F." value={medidas.brazoF} onChangeText={t=>setMedidas({...medidas, brazoF:t})} keyboardType="numeric" /></View>
              <View style={styles.row}><TextInput style={[styles.input,{flex:1, marginRight:5}]} placeholder="Muslo" value={medidas.muslo} onChangeText={t=>setMedidas({...medidas, muslo:t})} keyboardType="numeric" /><TextInput style={[styles.input,{flex:1, marginLeft:5}]} placeholder="Pierna" value={medidas.pierna} onChangeText={t=>setMedidas({...medidas, pierna:t})} keyboardType="numeric" /></View>
              <TouchableOpacity style={styles.btnNext} onPress={() => siguienteSeccion(2)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. MUJER */}
        {genero === 'mujer' && (
          <View style={[styles.card, {marginTop: 10}]}>
            <SectionHeader num={3} title="Ciclo Menstrual" color="#f472b6" icon="calendar-heart" lib="MaterialCommunityIcons" activa={seccionActiva} setActiva={setSeccionActiva} />
            {seccionActiva === 3 && (
              <View style={styles.content}>
                <Text style={styles.labelSub}>Tipo de ciclo:</Text>
                <View style={styles.chipContainer}>{TIPOS_CICLO.map(t => (<TouchableOpacity key={t} style={[styles.chip, ciclo === t && {backgroundColor:'#f472b6'}]} onPress={() => setCiclo(t)}><Text style={[styles.chipText, ciclo === t && styles.txtW]}>{t}</Text></TouchableOpacity>))}</View>
                <Text style={styles.labelSub}>Anticonceptivo:</Text>
                <View style={styles.chipContainer}>{ANTICONCEPTIVOS.map(a => (<TouchableOpacity key={a} style={[styles.chip, anticonceptivo === a && {backgroundColor:'#f472b6'}]} onPress={() => { setAnticonceptivo(a); siguienteSeccion(3); }}><Text style={[styles.chipText, anticonceptivo === a && styles.txtW]}>{a}</Text></TouchableOpacity>))}</View>
              </View>
            )}
          </View>
        )}

        {/* 4. IPAQ */}
        <View style={[styles.card, {marginTop: 10}]}>
          <SectionHeader num={4} title="Actividad Física (IPAQ)" color="#f59e0b" icon="running" activa={seccionActiva} setActiva={setSeccionActiva} />
          {seccionActiva === 4 && (
            <View style={styles.content}>
              {['vigorosa', 'moderada', 'caminata'].map((tipo) => (
                <View key={tipo} style={{marginBottom: 10}}>
                   <View style={styles.ipaqHeader}><Text style={styles.labelSubIpaq}>{tipo.toUpperCase()}:</Text><TouchableOpacity style={[styles.nadaBtn, (ipaq as any)[`${tipo}Nada`] && styles.nadaBtnActive]} onPress={() => setIpaq({...ipaq, [`${tipo}Nada`]: !(ipaq as any)[`${tipo}Nada`], [`${tipo}Dias`]: '', [`${tipo}Min`]: ''})}><Text style={styles.nadaTxt}>Nada</Text></TouchableOpacity></View>
                  <View style={styles.row}><TextInput style={[styles.input, {flex: 1, marginRight: 5}]} editable={!(ipaq as any)[`${tipo}Nada`]} placeholder="Días" value={(ipaq as any)[`${tipo}Dias`]} onChangeText={t => setIpaq({...ipaq, [`${tipo}Dias`]: t})} keyboardType="numeric" /><TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} editable={!(ipaq as any)[`${tipo}Nada`]} placeholder="Min" value={(ipaq as any)[`${tipo}Min`]} onChangeText={t => setIpaq({...ipaq, [`${tipo}Min`]: t})} keyboardType="numeric" /></View>
                </View>
              ))}
              <TextInput style={styles.input} placeholder="Horas sentado al día" value={ipaq.sentadoHoras} onChangeText={t => setIpaq({...ipaq, sentadoHoras: t})} keyboardType="numeric" />
              <TouchableOpacity style={[styles.btnNext, {backgroundColor:'#f59e0b'}]} onPress={() => siguienteSeccion(4)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
            </View>
          )}
        </View>

        {/* 5. SALUD */}
        <View style={[styles.card, {marginTop: 10}]}>
          <SectionHeader num={5} title="Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva} />
          {seccionActiva === 5 && (
            <View style={styles.content}>
              <Text style={styles.labelSub}>Enfermedades Familiares:</Text>
              <View style={styles.chipContainer}>{ENFERMEDADES_BASE.map(e => (<TouchableOpacity key={e} style={[styles.chip, enfFamiliares.includes(e) && styles.chipSelected]} onPress={() => toggleChip(enfFamiliares, setEnfFamiliares, e)}><Text style={[styles.chipText, enfFamiliares.includes(e) && styles.txtW]}>{e}</Text></TouchableOpacity>))}</View>
              {enfFamiliares.includes("Otra") && <TextInput style={styles.input} placeholder="Especifique enfermedad familiar" value={otrosFam} onChangeText={setOtrosFam} />}
              <Text style={[styles.labelSub, {marginTop: 15}]}>Mis Enfermedades:</Text>
              <View style={styles.chipContainer}>{ENFERMEDADES_BASE.map(e => (<TouchableOpacity key={e} style={[styles.chip, enfPersonales.includes(e) && styles.chipSelected]} onPress={() => toggleChip(enfPersonales, setEnfPersonales, e)}><Text style={[styles.chipText, enfPersonales.includes(e) && styles.txtW]}>{e}</Text></TouchableOpacity>))}</View>
              {enfPersonales.includes("Otra") && <TextInput style={styles.input} placeholder="Especifique mi enfermedad" value={otrosPers} onChangeText={setOtrosPers} />}
              <Text style={[styles.labelSub, {marginTop: 15}]}>¿Alergia a algún medicamento?</Text>
              <TextInput style={styles.input} placeholder="Escriba el medicamento o 'Ninguno'" value={alergiaMedicamento} onChangeText={setAlergiaMedicamento} />
              <TouchableOpacity style={[styles.btnNext, {backgroundColor:'#ef4444'}]} onPress={() => siguienteSeccion(5)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
            </View>
          )}
        </View>

        {/* 6. PREFERENCIAS Y PLAN */}
        <View style={[styles.card, {marginTop: 10}]}>
          <SectionHeader num={6} title="Preferencias y Plan" color="#6366f1" icon="list-ul" lib="FontAwesome" activa={seccionActiva} setActiva={setSeccionActiva} />
          {seccionActiva === 6 && (
            <View style={styles.content}>
              <Text style={styles.labelSub}>Comidas al día:</Text>
              <View style={styles.rowNum}>{[3, 4, 5, 6].map(n => (<TouchableOpacity key={n} style={[styles.btnNum, numComidas === n && styles.btnNumActive]} onPress={() => setNumComidas(n)}><Text style={[styles.numTxt, numComidas === n && styles.txtW]}>{n}</Text></TouchableOpacity>))}</View>
              <Text style={[styles.labelSub, {marginTop: 15}]}>¿Alergia a algún alimento?</Text>
              <TextInput style={styles.input} placeholder="Escriba el alimento o 'Ninguno'" value={alergiaAlimento} onChangeText={setAlergiaAlimento} />
              <Text style={[styles.labelSub, {marginTop: 15}]}>Días de entrenamiento:</Text>
              <View style={styles.rowNum}>{[3, 4, 5, 6].map(n => (<TouchableOpacity key={n} style={[styles.btnNum, diasEntreno === n && styles.btnNumActive]} onPress={() => setDiasEntreno(n)}><Text style={[styles.numTxt, diasEntreno === n && styles.txtW]}>{n}</Text></TouchableOpacity>))}</View>
              <Text style={[styles.labelSub, {marginTop: 15}]}>¿Ha tenido alguna lesión?</Text>
              <View style={styles.row}><TouchableOpacity style={[styles.btnG, tuvoLesion === 'si' && styles.btnActive]} onPress={() => setTuvoLesion('si')}><Text style={tuvoLesion === 'si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, tuvoLesion === 'no' && styles.btnActive]} onPress={() => {setTuvoLesion('no'); setDetalleLesion('');}}><Text style={tuvoLesion === 'no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity></View>
              {tuvoLesion === 'si' && <TextInput style={styles.input} placeholder="Describa la lesión" value={detalleLesion} onChangeText={setDetalleLesion} />}
              <Text style={[styles.labelSub, {marginTop: 15}]}>¿Ha tenido alguna operación?</Text>
              <View style={styles.row}><TouchableOpacity style={[styles.btnG, tuvoOperacion === 'si' && styles.btnActive]} onPress={() => setTuvoOperacion('si')}><Text style={tuvoOperacion === 'si' ? styles.txtW : styles.txtB}>SÍ</Text></TouchableOpacity><TouchableOpacity style={[styles.btnG, tuvoOperacion === 'no' && styles.btnActive]} onPress={() => {setTuvoOperacion('no'); setDetalleOperacion('');}}><Text style={tuvoOperacion === 'no' ? styles.txtW : styles.txtB}>NO</Text></TouchableOpacity></View>
              {tuvoOperacion === 'si' && <TextInput style={styles.input} placeholder="Describa la operación" value={detalleOperacion} onChangeText={setDetalleOperacion} />}
              <Text style={[styles.labelSub, {marginTop: 15}]}>Objetivo Deseado:</Text>
              <TextInput style={[styles.input, {height: 60}]} placeholder="Ej: Bajar de peso, ganar músculo..." value={objetivoDeseado} onChangeText={setObjetivoDeseado} multiline />
              <TouchableOpacity style={[styles.btnNext, {backgroundColor:'#6366f1'}]} onPress={() => siguienteSeccion(6)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
            </View>
          )}
        </View>

        {/* 7. FRECUENCIA */}
        <View style={[styles.card, {marginTop: 10}]}>
          <SectionHeader num={7} title="Frecuencia Alimentos" color="#8b5cf6" icon="clipboard-list" activa={seccionActiva} setActiva={setSeccionActiva} />
          {seccionActiva === 7 && (
            <View style={styles.content}>
              {LISTA_ALIMENTOS_FRECUENCIA.map(al => (
                <View key={al} style={{marginBottom: 12}}><Text style={styles.alimentoTxt}>{al}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{OPCIONES_FRECUENCIA.map(op => (<TouchableOpacity key={op} style={[styles.miniChip, frecuenciasAlimentos[al] === op && styles.miniChipActive]} onPress={() => setFrecuenciasAlimentos({...frecuenciasAlimentos, [al]: op})}><Text style={[styles.miniText, frecuenciasAlimentos[al] === op && styles.txtW]}>{op}</Text></TouchableOpacity>))}</ScrollView></View>
              ))}
              <TouchableOpacity style={[styles.btnNext, {backgroundColor:'#8b5cf6'}]} onPress={() => siguienteSeccion(7)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>
            </View>
          )}
        </View>

        {/* 8. CONSENTIMIENTO ÍNTEGRO */}
        <View style={[styles.card, {marginTop: 10}]}>
          <SectionHeader num={8} title="Consentimiento y Firma" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva} />
          {seccionActiva === 8 && (
            <View style={styles.content}>
              <View style={styles.legalContainer}><ScrollView nestedScrollEnabled style={{height: 350}}>
                <Text style={styles.legalTitle}>CONSENTIMIENTO INFORMADO</Text>
                <Text style={styles.legalBody}>
                  PARA LA PARTICIPACIÓN EN UN PROGRAMA DE ENTRENAMIENTO PERSONAL DE ACONDICIONAMIENTO FÍSICO DE ADULTOS APARENTEMENTE SANOS (SIN CONOCIMIENTO O SOSPECHA DE ENFERMEDADES CARDÍACAS){"\n\n"}
                  <Text style={{fontWeight: 'bold', color: '#3b82f6'}}>Nombre: {nombre.toUpperCase() || "____________________"}</Text>{"\n\n"}
                  1. Propósito y explicación de los procedimientos: Mediante este documento acepto voluntariamente participar en un plan de entrenamiento personal de acondicionamiento físico. También acepto tomar parte en las actividades del programa de entrenamiento personal que se me recomienden para la mejora de mi salud y bienestar general. Estas pueden incluir asesoramiento dietético, gestión del estrés y actividades formativas sobre salud y acondicionamiento físico.{"\n\n"}
                  2. Riesgos: Manifiesto que se me ha informado de que existe la posibilidad, aunque remota, de efectos negativos durante el ejercicio, como por ejemplo (y sin excluir otros) alteración de la presión arterial, mareos, trastornos del ritmo cardíaco y casos excepcionales de infarto, derrames o incluso riesgo de muerte. Asimismo, se me ha explicado que existe el riesgo de lesiones corporales, como por ejemplo (sin excluir otras) lesiones musculares, de ligamentos, tendones y articulaciones. Se me ha comunicado que se pondrán todos los medios disponibles para minimizar que estas incidencias se produzcan mediante controles adecuados de mi estado antes de cada sesión de entrenamiento y supervisión del personal durante el ejercicio, así como de mi prudencia frente al esfuerzo.{"\n\n"}
                  3. Beneficios que cabe esperar y alternativas disponibles a la prueba de esfuerzo: Soy consciente de que este programa puede o no reportar beneficios a mi condición física o salud general. Comprendo que la participación en sesiones de ejercicio y entrenamiento personal me permitirá aprender cómo realizar adecuadamente ejercicios de acondicionamiento físico, usar los diversos aparatos y regular el esfuerzo físico. Por tanto, debería sacar provecho de estas experiencias, ya que indicarían la manera en que mis limitaciones físicas pueden afectar mi capacidad de realizar las diversas actividades físicas.{"\n\n"}
                  4. Confidencialidad y uso de la información: Se me ha informado de que la información obtenida durante este programa de entrenamiento personal se tratará con máxima confidencialidad y, en consecuencia, no se proporcionará o revelará a nadie sin mi consentimiento expreso por escrito. Acepto, en cambio, que se utilice cualquier información con propósito de investigación o estadístico siempre que no pueda llevar a la identificación de mi persona.{"\n\n"}
                  Confirmo que he leído este documento en su totalidad o que se me ha leído en caso de no ser capaz de leerlo personalmente. Doy mi autorización expresa a que se lleven a cabo todos los servicios y procedimientos tal y como me ha comunicado el personal del programa.{"\n\n"}
                  <Text style={{fontWeight: 'bold'}}>Fecha: {fechaHoy}</Text>
                </Text>
              </ScrollView></View>
              <TouchableOpacity style={styles.rowCheck} onPress={() => setAceptarTerminos(!aceptarTerminos)}>
                <MaterialCommunityIcons name={aceptarTerminos ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color={aceptarTerminos ? "#10b981" : "#64748b"} />
                <Text style={styles.checkTxt}>Acepto los términos y condiciones de salud.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnFirma, firma && {backgroundColor: '#e2e8f0'}]} onPress={() => setModalFirma(true)}>
                <Text style={styles.btnFirmaText}>{firma ? "✓ Firmado" : "Tocar para firmar"}</Text>
              </TouchableOpacity>
              {firma && <TouchableOpacity style={[styles.btnNext, {backgroundColor:'#1e293b', marginTop: 15}]} onPress={() => siguienteSeccion(8)}><Text style={styles.txtW}>Siguiente</Text></TouchableOpacity>}
            </View>
          )}
        </View>

        {/* 9. AVISO DE PRIVACIDAD */}
        <View style={[styles.card, {marginTop: 10, marginBottom: 50}]}>
          <SectionHeader num={9} title="Aviso de Privacidad" color="#64748b" icon="shield-lock" lib="MaterialCommunityIcons" activa={seccionActiva} setActiva={setSeccionActiva} />
          {seccionActiva === 9 && (
            <View style={styles.content}>
              <Text style={styles.legalBody}>En cumplimiento con la Ley Federal de Protección de Datos Personales, informamos que sus datos serán tratados únicamente para fines de seguimiento deportivo y nutricional por parte de su Coach bajo estándares de privacidad estrictos.</Text>
              <TouchableOpacity style={styles.btnEnviar} onPress={enviarAlCoach}>
                <Text style={styles.btnText}>ENVIAR AL COACH 🚀</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalFirma} animationType="slide">
        <View style={{flex: 1, backgroundColor: '#fff', paddingTop: 50}}>
          <SignatureScreen onOK={(s) => { setFirma(s); setModalFirma(false); }} descriptionText="Firma" clearText="Borrar" confirmText="Guardar" />
          <TouchableOpacity onPress={() => setModalFirma(false)} style={{padding: 20, alignItems: 'center'}}><Text style={{color: 'red', fontWeight: 'bold'}}>Cancelar</Text></TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const SectionHeader = ({ num, title, color, icon, lib = "FontAwesome5", activa, setActiva }: any) => (
  <TouchableOpacity style={styles.headerToggle} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiva(activa === num ? null : num); }}>
    <View style={styles.titleRow}><View style={[styles.numCircle, {backgroundColor: color}]}><Text style={styles.numText}>{num}</Text></View>
    {lib === "FontAwesome5" ? <FontAwesome5 name={icon} size={14} color={color} /> : lib === "MaterialCommunityIcons" ? <MaterialCommunityIcons name={icon} size={16} color={color} /> : <FontAwesome name={icon} size={14} color={color} />}
    <Text style={styles.sectionTitle}>{title}</Text></View>
    <FontAwesome name={activa === num ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', paddingTop: 50 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  userEmail: { fontSize: 12, color: '#64748b' },
  scroll: { padding: 15 },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 15, overflow: 'hidden' },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold' },
  content: { padding: 18, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  input: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 5 },
  btnG: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#3b82f6', alignItems: 'center', marginHorizontal: 5 },
  btnActive: { backgroundColor: '#3b82f6' },
  txtB: { color: '#3b82f6', fontWeight: 'bold' },
  txtW: { color: '#fff', fontWeight: 'bold' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  chipSelected: { backgroundColor: '#1e293b' },
  chipText: { fontSize: 11 },
  labelSub: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  ipaqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  labelSubIpaq: { fontSize: 11, color: '#475569', flex: 1 },
  nadaBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  nadaBtnActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  nadaTxt: { fontSize: 10, fontWeight: 'bold' },
  rowNum: { flexDirection: 'row', justifyContent: 'space-between' },
  btnNum: { width: 45, height: 40, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  btnNumActive: { backgroundColor: '#6366f1' },
  numTxt: { fontWeight: 'bold' },
  alimentoTxt: { fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  miniChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9', marginRight: 6 },
  miniChipActive: { backgroundColor: '#8b5cf6' },
  miniText: { fontSize: 10 },
  legalContainer: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  legalTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  legalBody: { fontSize: 11, textAlign: 'justify', lineHeight: 16 },
  rowCheck: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  checkTxt: { marginLeft: 10, fontSize: 11, fontWeight: 'bold' },
  btnFirma: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#3b82f6', borderStyle: 'dashed', alignItems: 'center' },
  btnFirmaText: { color: '#3b82f6', fontWeight: 'bold' },
  btnEnviar: { backgroundColor: '#10b981', padding: 18, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  btnNext: { padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#3b82f6', marginTop: 10 },
  esperaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#f1f5f9' },
  esperaTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 25 },
  planCard: { backgroundColor: '#fff', padding: 25, borderRadius: 25, width: '100%', marginVertical: 35, alignItems: 'center', elevation: 4 },
  planTag: { backgroundColor: '#10b981', color: '#fff', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 12, fontSize: 11, fontWeight: 'bold', marginBottom: 12 },
  planNombre: { fontSize: 20, fontWeight: 'bold' },
  planStatus: { fontSize: 16, color: '#64748b', marginTop: 8 },
  esperaSub: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24 }
});