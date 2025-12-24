import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator, SafeAreaView, Image, Alert } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5, Ionicons, FontAwesome } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function CoachPanel() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);
  const [seccionActiva, setSeccionActiva] = useState<number | null>(1);

  useEffect(() => {
    const q = query(collection(db, "revisiones_pendientes"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(lista);
      setCargando(false);
    });
    return unsub;
  }, []);

  const exportarPDF = async (a: any) => {
    const htmlContent = `
      <html>
        <head>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: 'Helvetica', sans-serif; color: #1e293b; line-height: 1.2; font-size: 10px; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; margin-bottom: 10px; padding-bottom: 5px; }
            h2 { background: #3b82f6; color: white; padding: 5px; font-size: 11px; margin-top: 10px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
            td { padding: 5px; border: 1px solid #e2e8f0; }
            .label { font-weight: bold; background: #f8fafc; width: 30%; }
            .page-break { page-break-before: always; }
            .legal { font-size: 8px; text-align: justify; color: #475569; }
            .firma-img { width: 200px; height: auto; display: block; margin: 10px auto; border-bottom: 1px solid #000; }
          </style>
        </head>
        <body>
          <div class="header"><h1>EXPEDIENTE FITTECH</h1><p>${a.nombre} | ${a.email}</p></div>

          <h2>1. Datos Personales</h2>
          <table>
            <tr><td class="label">Nombre</td><td>${a.nombre}</td></tr>
            <tr><td class="label">Teléfono</td><td>${a.telefono}</td></tr>
            <tr><td class="label">Edad / Género</td><td>${a.datosFisicos?.edad} años / ${a.datosFisicos?.genero}</td></tr>
            <tr><td class="label">Peso</td><td>${a.datosFisicos?.peso} kg</td></tr>
            <tr><td class="label">Altura</td><td>${a.datosFisicos?.altura} cm</td></tr>
          </table>

          <h2>2. Medidas Corporales</h2>
          <table>
            <tr><td class="label">Cuello</td><td>${a.medidas?.cuello} cm</td><td class="label">Pecho</td><td>${a.medidas?.pecho} cm</td></tr>
            <tr><td class="label">Cintura</td><td>${a.medidas?.cintura} cm</td><td class="label">Cadera</td><td>${a.medidas?.cadera} cm</td></tr>
            <tr><td class="label">Brazo Relajado</td><td>${a.medidas?.brazoR} cm</td><td class="label">Brazo Flex</td><td>${a.medidas?.brazoF} cm</td></tr>
            <tr><td class="label">Muslo</td><td>${a.medidas?.muslo} cm</td><td class="label">Pierna</td><td>${a.medidas?.pierna} cm</td></tr>
          </table>

          ${a.datosFisicos?.genero === 'mujer' ? `<h2>3. Ciclo Menstrual</h2><table><tr><td class="label">Ciclo</td><td>${a.ciclo?.tipo}</td><td class="label">Método</td><td>${a.ciclo?.anticonceptivo}</td></tr></table>` : ''}

          <h2>4. Historial de Salud</h2>
          <table>
            <tr><td class="label">Enf. Familiares</td><td>${a.salud?.enfFam?.join(', ') || 'Ninguna'}</td></tr>
            <tr><td class="label">Enf. Personales</td><td>${a.salud?.enfPers?.join(', ') || 'Ninguna'}</td></tr>
            <tr><td class="label">Lesión</td><td>${a.salud?.detalleLesion || 'No'}</td></tr>
            <tr><td class="label">Operación</td><td>${a.salud?.detalleOperacion || 'No'}</td></tr>
          </table>

          <div class="page-break"></div>

          <h2>5. Estilo de Vida (IPAQ)</h2>
          <table>
            <tr><td class="label">Vigorosa</td><td>${a.ipaq?.vDias} días / ${a.ipaq?.vMin} min</td></tr>
            <tr><td class="label">Moderada</td><td>${a.ipaq?.mDias} días / ${a.ipaq?.mMin} min</td></tr>
            <tr><td class="label">Caminata</td><td>${a.ipaq?.cDias} días / ${a.ipaq?.cMin} min</td></tr>
            <tr><td class="label">Sedentario</td><td>${a.ipaq?.sentado} horas/día</td></tr>
          </table>

          <h2>6. Nutrición y Objetivos</h2>
          <table>
            <tr><td class="label">Comidas Actuales</td><td>${a.nutricion?.comidasAct} al día</td></tr>
            <tr><td class="label">Descripción Diario</td><td>${a.nutricion?.descAct}</td></tr>
            <tr><td class="label">Alcohol/Sust</td><td>Alc: ${a.nutricion?.alcoholFreq || 'No'} | Sust: ${a.nutricion?.sustFreq || 'No'}</td></tr>
            <tr><td class="label">Días Entreno</td><td>${a.nutricion?.entrenos} días</td></tr>
            <tr><td class="label">Comidas Plan</td><td>${a.nutricion?.comidasDes} comidas</td></tr>
            <tr><td class="label">Objetivo</td><td style="color:blue"><b>${a.nutricion?.objetivo}</b></td></tr>
          </table>

          <h2>7. Frecuencia de Alimentos</h2>
          <table>
            ${Object.entries(a.frecuenciaAlimentos || {}).map(([k, v]) => `<tr><td class="label">${k}</td><td>${v}</td></tr>`).join('')}
          </table>

          <div class="page-break"></div>

          <h2>8 y 9. Consentimiento Completo</h2>
          <div class="legal">
            <p><b>1. Propósito y explicación:</b> Acepto participar en un plan de entrenamiento personal de acondicionamiento físico. Soy consciente de que se me puede requerir una prueba graduada de esfuerzo. Me comprometo a realizar las sesiones y seguir instrucciones de dieta y ejercicio.</p>
            <p><b>2. Riesgos:</b> Se me ha informado de efectos negativos como alteración de presión arterial, mareos, trastornos del ritmo cardíaco, lesiones musculares, de ligamentos e incluso riesgo de muerte.</p>
            <p><b>3. Beneficios:</b> Comprendo que el programa mejorará mi capacidad física tras un período de 3 a 6 meses si sigo las instrucciones cuidadosamente.</p>
            <p><b>4. Confidencialidad:</b> La información obtenida será tratada con máxima confidencialidad bajo la ley de protección de datos.</p>
          </div>
          <div style="text-align:center; margin-top:30px;">
            <p>FIRMA DEL ALUMNO:</p>
            <img src="${a.firma}" class="firma-img" />
            <p><b>${a.nombre}</b><br/>Fecha: ${a.timestamp?.toDate().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error", "Generación fallida"); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPrincipal}>
        <Text style={styles.title}>Panel Coach</Text>
        <TouchableOpacity onPress={() => signOut(auth)}><Ionicons name="log-out-outline" size={26} color="#ef4444" /></TouchableOpacity>
      </View>

      <FlatList
        data={alumnos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cardAlumno} onPress={() => { setAlumnoSeleccionado(item); setSeccionActiva(1); }}>
            <View style={styles.infoRow}>
              <View style={styles.avatar}><Text style={styles.avatarTxt}>{item.nombre?.charAt(0)}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.nombreAlumno}>{item.nombre}</Text><Text style={styles.emailAlumno}>{item.email}</Text></View>
              <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />

      <Modal visible={!!alumnoSeleccionado} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: '#f1f5f9'}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAlumnoSeleccionado(null)}><Ionicons name="arrow-back" size={28} color="#1e293b" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Detalle del Alumno</Text>
            <TouchableOpacity onPress={() => exportarPDF(alumnoSeleccionado)}><FontAwesome5 name="file-pdf" size={24} color="#3b82f6" /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{padding: 15}}>
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
               <Dato label="Lesión" value={alumnoSeleccionado?.salud?.detalleLesion} />
               <Dato label="Cirugía" value={alumnoSeleccionado?.salud?.detalleOperacion} />
            </Section>

            <Section num={5} title="Estilo de Vida (IPAQ)" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Vigorosa" value={`${alumnoSeleccionado?.ipaq?.vDias} días / ${alumnoSeleccionado?.ipaq?.vMin}m`} />
               <Dato label="Moderada" value={`${alumnoSeleccionado?.ipaq?.mDias} días / ${alumnoSeleccionado?.ipaq?.mMin}m`} />
               <Dato label="Caminata" value={`${alumnoSeleccionado?.ipaq?.cDias} días / ${alumnoSeleccionado?.ipaq?.cMin}m`} />
               <Dato label="Horas sentado" value={alumnoSeleccionado?.ipaq?.sentado} />
            </Section>

            <Section num={6} title="Nutrición y Objetivos" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Comidas Actuales" value={alumnoSeleccionado?.nutricion?.comidasAct} />
               <Dato label="Descripción Día" value={alumnoSeleccionado?.nutricion?.descAct} />
               <Dato label="Días Entrenamiento" value={alumnoSeleccionado?.nutricion?.entrenos} />
               <Dato label="Comidas en Plan" value={alumnoSeleccionado?.nutricion?.comidasDes} />
               <Dato label="Objetivo" value={alumnoSeleccionado?.nutricion?.objetivo} />
            </Section>

            <Section num={7} title="Frecuencia Alimentos" color="#22c55e" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
               {alumnoSeleccionado?.frecuenciaAlimentos && Object.entries(alumnoSeleccionado.frecuenciaAlimentos).map(([k, v]: any) => (
                 <Dato key={k} label={k} value={v} />
               ))}
            </Section>

            <Section num={8} title="Consentimiento y Firma" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Text style={styles.consentFull}>
                1. Propósito: Acepto participar en un plan de entrenamiento personal de acondicionamiento físico. Soy consciente de que se me puede requerir una prueba graduada de esfuerzo. Me comprometo a realizar las sesiones y seguir instrucciones de dieta y ejercicio.{"\n\n"}
                2. Riesgos: Se me ha informado de efectos negativos durante el ejercicio como alteración de presión arterial, mareos, trastornos del ritmo cardíaco, lesiones musculares, de ligamentos e incluso riesgo de muerte.{"\n\n"}
                3. Beneficios: Comprendo que el programa mejorará mi capacidad física tras un período de 3 a 6 meses si sigo las instrucciones cuidadosamente.{"\n\n"}
                4. Confidencialidad: Mis datos se tratarán con máxima privacidad.
               </Text>
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
        <FontAwesome5 name={icon} size={13} color={color} /><Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <FontAwesome name={activa === num ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
    </TouchableOpacity>
    {activa === num && <View style={styles.content}>{children}</View>}
  </View>
);

const Dato = ({ label, value }: any) => (
  <View style={styles.datoBox}><Text style={styles.datoLabel}>{label}</Text><Text style={styles.datoValue}>{value || '---'}</Text></View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerPrincipal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  list: { padding: 20 },
  cardAlumno: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontWeight: 'bold' },
  nombreAlumno: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  emailAlumno: { fontSize: 11, color: '#64748b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
  modalTitle: { fontSize: 17, fontWeight: 'bold' },
  cardSection: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, elevation: 1 },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  content: { padding: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fafafa' },
  datoBox: { marginBottom: 10, flex: 1 },
  datoLabel: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' },
  datoValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  row: { flexDirection: 'row', gap: 15 },
  firmaPreview: { width: '100%', height: 100, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: 5 },
  consentFull: { fontSize: 10, color: '#64748b', textAlign: 'justify' }
});