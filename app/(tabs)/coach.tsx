import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator, SafeAreaView, Image, Alert } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5, Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function CoachPanel() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);
  const [seccionActiva, setSeccionActiva] = useState<number | null>(null);

  useEffect(() => {
    const q = query(collection(db, "revisiones_pendientes"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(lista);
      setCargando(false);
    });
    return unsub;
  }, []);

  const validarValor = (val: any) => {
    if (val === undefined || val === null || val === '' || val === 'no' || val === 0 || val === '0') return "NO";
    return val;
  };

  const formatearActividad = (dias: any, min: any) => {
    if (!dias || dias === '0' || !min || min === '0') return "NO";
    return `${dias} días / ${min} min`;
  };

  const consentimientoCompleto = `1. Propósito y explicación de los procedimientos: Mediante este documento acepto voluntariamente participar en un plan de entrenamiento personal de acondicionamiento físico. También acepto tomar parte en las actividades del programa de entrenamiento personal que se me recomienden para la mejora de mi salud y bienestar general. Estas pueden incluir asesoramiento dietético, gestión del estrés y actividades formativas sobre salud y acondicionamiento físico. Los niveles de intensidad del ejercicio que se realizará se basarán en mi capacidad cardiorrespiratoria (corazón y pulmones) y muscular. Soy consciente de que se me puede requerir la realización de una prueba graduada de esfuerzo, así como otras pruebas físicas antes del comienzo del programa de entrenamiento personal para poder valorar y evaluar mi estado físico actual. Se me darán las instrucciones concretas en cuanto al tipo y volumen de ejercicio que debería realizar. Me comprometo a realizar 3 veces por semana las sesiones formales del programa. Entrenadores capacitados para ello dirigirán mis actividades, controlarán mi rendimiento y evaluarán mi esfuerzo. Según mi estado de salud, se me podrá requerir durante las sesiones un control de la presión arterial y la frecuencia cardíaca para mantener la intensidad dentro de unos límites deseables. Soy consciente de que se espera mi asistencia a todas las sesiones y que siga las instrucciones del personal relativas al ejercicio, la dieta, la gestión del estrés y otros programas relacionados (salud / acondicionamiento físico). En caso de estar tomando medicamentos, ya he informado de ello al personal del programa y me comprometo a comunicarles de inmediato cualquier cambio al respecto tanto por mi parte como por parte del médico. En caso de que sea conveniente, se me valorará y evaluará periódicamente a intervalos regulares tras el inicio del programa. Se me ha informado de que durante mi participación en este programa de entrenamiento personal se me pedirá que complete las actividades físicas salvo en caso de síntomas como fatiga, falta de aire, molestias en la zona pectoral o similares. Llegados a ese punto, se me ha informado de que tengo el derecho de disminuir la intensidad o poner fin al ejercicio y de que estoy obligado a informar al personal del programa de entrenamiento personal de mis síntomas. Así, declaro que se me ha informado de ello y me comprometo a informar al personal encargado de mi entrenamiento de mis síntomas, si se llegaran a producir. Soy consciente de que, durante el ejercicio, un entrenador personal supervisará periódicamente mi rendimiento con la posibilidad de que controle mi pulso y mi presión arterial o de que valore mi percepción del esfuerzo para así controlar mi progreso. Asimismo, soy consciente de que el entrenador personal puede reducir la intensidad o poner fin al programa de ejercicios para mi seguridad y beneficio según los parámetros anteriormente mencionados. También se me ha comunicado que durante el transcurso de mi programa de entrenamiento personal puede ser necesario el contacto físico y una colocación corporal adecuada de mi cuerpo para evaluar las reacciones musculares y corporales a ejercicios concretos, además de para asegurar que utilizo la técnica y postura adecuadas. Por ello doy mi autorización expresa para que se produzca el contacto físico por estos motivos.\n\n2. Riesgos: Manifiesto que se me ha informado de que existe la posibilidad, aunque remota, de efectos negativos durante el ejercicio, como por ejemplo (y sin excluir otros) alteración de la presión arterial, mareos, trastornos del ritmo cardíaco y casos excepcionales de infarto, derrames o incluso riesgo de muerte. Asimismo, se me ha explicado que existe el riesgo de lesiones corporales, como por ejemplo (sin excluir otras) lesiones musculares, de ligamentos, tendones y articulaciones. Se me ha comunicado que se pondrán todos los medios disponibles para minimizar que estas incidencias se produzcan mediante controles adecuados de mi estado antes de cada sesión de entrenamiento y supervisión del personal durante el ejercicio, así como de mi prudencia frente al esfuerzo. Conozco perfectamente los riesgos asociados con el ejercicio, como lesiones corporales, infartos, derrames e incluso la muerte, y aun conociendo estos riesgos, deseo tomar parte como ya he manifestado.\n\n3. Beneficios que cabe esperar y alternativas disponibles a la prueba de esfuerzo: Soy consciente de que este programa puede o no reportar beneficios a mi condición física o salud general. Comprendo que la participación en sesiones de ejercicio y entrenamiento personal me permitirá aprender cómo realizar adecuadamente ejercicios de acondicionamiento físico, usar los diversos aparatos y regular el esfuerzo físico. Por tanto, debería sacar provecho de estas experiencias, ya que indicarían la manera en que mis limitaciones físicas pueden afectar mi capacidad de realizar las diversas actividades físicas. Soy asimismo consciente de que si sigo cuidadosamente las instrucciones del programa mejoraré con toda probabilidad mi capacidad para el ejercicio físico y mi forma física tras un período de 3 a 6 meses.\n\n4. Confidencialidad y uso de la información: Se me ha informado de que la información obtenida durante este programa de entrenamiento personal se tratará con máxima confidencialidad y, en consecuencia, no se proporcionará o revelará a nadie sin mi consentimiento expreso por escrito. Acepto, en cambio, que se utilice cualquier información con propósito de investigación o estadístico siempre que no pueda llevar a la identificación de mi persona. También apruebo el uso de cualquier información con el propósito de consulta con otros profesionales de la salud o del fitness, incluido mi médico. En cambio, cualquier otra información obtenida se utilizará por parte del personal del programa únicamente por razones de prescripción de ejercicio y evaluación de mi progreso en el programa. Confirmo que he leído este documento en su totalidad o que se me ha leído en caso de no ser capaz de leerlo personalmente. Doy mi autorización expresa a que se lleven a cabo todos los servicios y procedimientos tal y como me ha comunicado el personal del programa.`;

  const exportarPDF = async (a: any) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Helvetica', sans-serif; color: #334155; line-height: 1.3; }
          .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
          h1 { color: #1e3a8a; font-size: 22px; margin: 0; }
          .section-title { background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; margin-top: 20px; font-weight: bold; }
          .grid { display: flex; flex-wrap: wrap; margin-top: 8px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
          .item { width: 50%; padding: 8px; border: 0.5px solid #f1f5f9; box-sizing: border-box; }
          .label { font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .value { font-size: 12px; color: #0f172a; font-weight: 600; display: block; }
          .no-val { color: #ef4444; }
          .page-break { page-break-before: always; }
          .legal-text { font-size: 10px; line-height: 1.5; text-align: justify; color: #475569; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .signature-box { margin-top: 30px; text-align: center; }
          .signature-img { width: 250px; border-bottom: 2px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="header"><h1>EXPEDIENTE TÉCNICO FITTECH</h1><p>Alumno: ${a.nombre} | Fecha: ${new Date().toLocaleDateString()}</p></div>

        <div class="section-title">1. Datos e Identificación</div>
        <div class="grid">
          <div class="item"><span class="label">Teléfono</span><span class="value">${a.telefono}</span></div>
          <div class="item"><span class="label">Género</span><span class="value">${a.datosFisicos?.genero}</span></div>
          <div class="item"><span class="label">Peso</span><span class="value">${a.datosFisicos?.peso} kg</span></div>
          <div class="item"><span class="label">Estatura</span><span class="value">${a.datosFisicos?.altura} cm</span></div>
        </div>

        <div class="section-title">2. Medidas Corporales</div>
        <div class="grid">
          <div class="item"><span class="label">Cuello / Pecho</span><span class="value">${a.medidas?.cuello} / ${a.medidas?.pecho}</span></div>
          <div class="item"><span class="label">Brazo R / F</span><span class="value">${a.medidas?.brazoR} / ${a.medidas?.brazoF}</span></div>
          <div class="item"><span class="label">Cintura / Cadera</span><span class="value">${a.medidas?.cintura} / ${a.medidas?.cadera}</span></div>
          <div class="item"><span class="label">Muslo / Pierna</span><span class="value">${a.medidas?.muslo} / ${a.medidas?.pierna}</span></div>
        </div>

        <div class="section-title">4. Historial de Salud</div>
        <div class="grid">
          <div class="item" style="width:100%"><span class="label">Enf. Familiares</span><span class="value">${a.salud?.enfFam?.join(', ') || 'NO'}</span></div>
          <div class="item" style="width:100%"><span class="label">Enf. Personales</span><span class="value">${a.salud?.enfPers?.join(', ') || 'NO'}</span></div>
          <div class="item"><span class="label">Lesiones</span><span class="value">${validarValor(a.salud?.detalleLesion)}</span></div>
          <div class="item"><span class="label">Cirugías</span><span class="value">${validarValor(a.salud?.detalleOperacion)}</span></div>
        </div>

        <div class="page-break"></div>

        <div class="section-title">5. Estilo de Vida e IPAQ</div>
        <div class="grid">
          <div class="item"><span class="label">Vigorosa</span><span class="value">${formatearActividad(a.ipaq?.vDias, a.ipaq?.vMin)}</span></div>
          <div class="item"><span class="label">Moderada</span><span class="value">${formatearActividad(a.ipaq?.mDias, a.ipaq?.mMin)}</span></div>
          <div class="item"><span class="label">Caminata</span><span class="value">${formatearActividad(a.ipaq?.cDias, a.ipaq?.cMin)}</span></div>
          <div class="item"><span class="label">Sentado</span><span class="value">${validarValor(a.ipaq?.sentado)} hrs/día</span></div>
        </div>

        <div class="section-title">6. Nutrición y Planificación</div>
        <div class="grid">
          <div class="item" style="width:100%"><span class="label">Comidas Actuales / Diario</span><span class="value">${a.nutricion?.comidasAct} (${a.nutricion?.descAct})</span></div>
          <div class="item"><span class="label">Días Entreno</span><span class="value">${validarValor(a.nutricion?.entrenos)}</span></div>
          <div class="item"><span class="label">Comidas en Plan</span><span class="value">${validarValor(a.nutricion?.comidasDes)}</span></div>
          <div class="item" style="width:100%; background:#f0f9ff;"><span class="label">Objetivo</span><span class="value" style="color:#2563eb">${a.nutricion?.objetivo}</span></div>
        </div>

        <div class="section-title">7. Frecuencia Alimentaria</div>
        <div class="grid">
          ${Object.entries(a.frecuenciaAlimentos || {}).map(([k, v]) => `<div class="item"><span class="label">${k}</span><span class="value">${v}</span></div>`).join('')}
        </div>

        <div class="page-break"></div>

        <div class="section-title">8 y 9. Consentimiento Informado Legal</div>
        <div class="legal-text">${consentimientoCompleto.replace(/\n/g, '<br/>')}</div>

        <div class="signature-box">
          <img src="${a.firma}" class="signature-img" />
          <p><b>FIRMA: ${a.nombre}</b><br/>ID: ${a.uid}</p>
        </div>
      </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error", "No se pudo generar el PDF"); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPrincipal}>
        <Text style={styles.title}>Panel Coach</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.logOutBtn}><Ionicons name="log-out" size={20} color="#ef4444" /></TouchableOpacity>
      </View>

      <FlatList
        data={alumnos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cardAlumno} onPress={() => { setAlumnoSeleccionado(item); setSeccionActiva(null); }}>
            <View style={styles.infoRow}>
              <View style={styles.avatar}><Text style={styles.avatarTxt}>{item.nombre?.charAt(0)}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.nombreAlumno}>{item.nombre}</Text><Text style={styles.emailAlumno}>{item.email}</Text></View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#3b82f6" />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />

      <Modal visible={!!alumnoSeleccionado} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: '#f1f5f9'}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAlumnoSeleccionado(null)}><Ionicons name="chevron-back" size={28} color="#1e293b" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Expediente Alumno</Text>
            <TouchableOpacity onPress={() => exportarPDF(alumnoSeleccionado)}><FontAwesome5 name="file-pdf" size={22} color="#3b82f6" /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{padding: 15}} showsVerticalScrollIndicator={false}>
            <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Nombre" value={alumnoSeleccionado?.nombre} />
               <Dato label="Teléfono" value={alumnoSeleccionado?.telefono} />
               <Dato label="Edad" value={alumnoSeleccionado?.datosFisicos?.edad} />
               <Dato label="Peso (kg)" value={alumnoSeleccionado?.datosFisicos?.peso} />
               <Dato label="Altura (cm)" value={alumnoSeleccionado?.datosFisicos?.altura} />
            </Section>

            <Section num={2} title="Medidas Corporales" color="#10b981" icon="ruler-horizontal" activa={seccionActiva} setActiva={setSeccionActiva}>
               <View style={styles.row}><Dato label="Cuello" value={alumnoSeleccionado?.medidas?.cuello} /><Dato label="Pecho" value={alumnoSeleccionado?.medidas?.pecho} /></View>
               <View style={styles.row}><Dato label="Brazo R" value={alumnoSeleccionado?.medidas?.brazoR} /><Dato label="Brazo F" value={alumnoSeleccionado?.medidas?.brazoF} /></View>
               <View style={styles.row}><Dato label="Cintura" value={alumnoSeleccionado?.medidas?.cintura} /><Dato label="Cadera" value={alumnoSeleccionado?.medidas?.cadera} /></View>
               <View style={styles.row}><Dato label="Muslo" value={alumnoSeleccionado?.medidas?.muslo} /><Dato label="Pierna" value={alumnoSeleccionado?.medidas?.pierna} /></View>
            </Section>

            {alumnoSeleccionado?.datosFisicos?.genero === 'mujer' && (
              <Section num={3} title="Ciclo Menstrual" color="#ec4899" icon="venus" activa={seccionActiva} setActiva={setSeccionActiva}>
                <Dato label="Estado" value={alumnoSeleccionado?.ciclo?.tipo} />
                <Dato label="Anticonceptivo" value={alumnoSeleccionado?.ciclo?.anticonceptivo} />
              </Section>
            )}

            <Section num={4} title="Historial Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Enf. Familiares" value={alumnoSeleccionado?.salud?.enfFam?.join(', ')} />
               <Dato label="Enf. Propias" value={alumnoSeleccionado?.salud?.enfPers?.join(', ')} />
               <Dato label="Lesión" value={validarValor(alumnoSeleccionado?.salud?.detalleLesion)} />
               <Dato label="Cirugía" value={validarValor(alumnoSeleccionado?.salud?.detalleOperacion)} />
            </Section>

            <Section num={5} title="Estilo de Vida (IPAQ)" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Vigorosa" value={formatearActividad(alumnoSeleccionado?.ipaq?.vDias, alumnoSeleccionado?.ipaq?.vMin)} />
               <Dato label="Moderada" value={formatearActividad(alumnoSeleccionado?.ipaq?.mDias, alumnoSeleccionado?.ipaq?.mMin)} />
               <Dato label="Caminata" value={formatearActividad(alumnoSeleccionado?.ipaq?.cDias, alumnoSeleccionado?.ipaq?.cMin)} />
               <Dato label="Horas sentado" value={validarValor(alumnoSeleccionado?.ipaq?.sentado)} />
            </Section>

            <Section num={6} title="Nutrición y Objetivos" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Comidas Actuales" value={alumnoSeleccionado?.nutricion?.comidasAct} />
               <Dato label="Descripción Diario" value={alumnoSeleccionado?.nutricion?.descAct} />
               <Dato label="Días Entrenamiento" value={validarValor(alumnoSeleccionado?.nutricion?.entrenos)} />
               <Dato label="Comidas en Plan" value={validarValor(alumnoSeleccionado?.nutricion?.comidasDes)} />
               <Dato label="Objetivo" value={alumnoSeleccionado?.nutricion?.objetivo} />
            </Section>

            <Section num={7} title="Frecuencia Alimentos" color="#22c55e" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
               {alumnoSeleccionado?.frecuenciaAlimentos && Object.entries(alumnoSeleccionado.frecuenciaAlimentos).map(([k, v]: any) => (
                 <Dato key={k} label={k} value={v} />
               ))}
            </Section>

            <Section num={8} title="Firma y Consentimiento" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Text style={styles.consentTxt}>{consentimientoCompleto}</Text>
               <Image source={{ uri: alumnoSeleccionado?.firma }} style={styles.firmaPreview} resizeMode="contain" />
            </Section>
            <View style={{height: 50}} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const Section = ({ num, title, color, icon, activa, setActiva, children }: any) => (
  <View style={styles.cardSection}>
    <TouchableOpacity style={styles.headerToggle} onPress={() => setActiva(activa === num ? null : num)}>
      <View style={styles.titleRow}>
        <View style={[styles.numCircle, {backgroundColor: color}]}><Text style={styles.numText}>{num}</Text></View>
        <FontAwesome5 name={icon} size={14} color={color} /><Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <FontAwesome name={activa === num ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
    </TouchableOpacity>
    {activa === num && <View style={styles.content}>{children}</View>}
  </View>
);

const Dato = ({ label, value }: any) => {
  const isNo = value === "NO" || !value;
  return (
    <View style={styles.datoBox}>
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={[styles.datoValue, isNo && {color: '#ef4444'}]}>{value || 'NO'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerPrincipal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  logOutBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  list: { padding: 20 },
  cardAlumno: { backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 12, elevation: 3 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  nombreAlumno: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  emailAlumno: { fontSize: 12, color: '#64748b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  cardSection: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, elevation: 2, overflow: 'hidden' },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  numCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  content: { padding: 16, borderTopWidth: 1, borderTopColor: '#f8fafc', backgroundColor: '#fafafa' },
  datoBox: { marginBottom: 12 },
  datoLabel: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, fontWeight: '700' },
  datoValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  row: { flexDirection: 'row', gap: 20 },
  firmaPreview: { width: '100%', height: 120, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginTop: 15 },
  consentTxt: { fontSize: 10, color: '#475569', textAlign: 'justify', lineHeight: 16 }
});