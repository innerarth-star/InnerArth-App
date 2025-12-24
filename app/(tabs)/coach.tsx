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
  const [seccionActiva, setSeccionActiva] = useState<number | null>(null); // Inicia cerrado

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
    if (!val || val === '' || val === 'no' || val === 'Ninguna' || (Array.isArray(val) && val.length === 0)) return "NO";
    return val;
  };

  const exportarPDF = async (a: any) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Helvetica', sans-serif; color: #334155; margin: 0; padding: 0; }
          .container { padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 4px solid #3b82f6; padding-bottom: 10px; }
          .header h1 { color: #1e3a8a; font-size: 26px; margin: 0; }
          .header p { font-size: 12px; color: #64748b; margin: 5px 0; }
          .section-title { background: #3b82f6; color: white; padding: 10px 15px; border-radius: 8px; font-size: 14px; margin-top: 25px; font-weight: bold; text-transform: uppercase; }
          .grid { display: flex; flex-wrap: wrap; margin-top: 10px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .item { width: 50%; padding: 10px; border: 0.5px solid #f1f5f9; box-sizing: border-box; }
          .full { width: 100%; }
          .label { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; display: block; }
          .value { font-size: 13px; color: #0f172a; font-weight: 600; margin-top: 2px; }
          .page-break { page-break-before: always; }
          .legal-text { font-size: 10px; line-height: 1.6; text-align: justify; color: #475569; background: #f8fafc; padding: 20px; border-radius: 10px; margin-top: 15px; }
          .signature-box { margin-top: 40px; text-align: center; }
          .signature-img { width: 280px; height: auto; border-bottom: 2px solid #1e293b; padding-bottom: 10px; }
          .no-val { color: #ef4444; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EXPEDIENTE DE RECOMPOSICIÓN FITTECH</h1>
            <p>Reporte de Evaluación de Salud y Acondicionamiento Físico</p>
          </div>

          <div class="section-title">1. Datos Personales y Antropometría</div>
          <div class="grid">
            <div class="item"><span class="label">Nombre completo</span><span class="value">${a.nombre}</span></div>
            <div class="item"><span class="label">Teléfono</span><span class="value">${a.telefono}</span></div>
            <div class="item"><span class="label">Edad</span><span class="value">${a.datosFisicos?.edad} años</span></div>
            <div class="item"><span class="label">Género</span><span class="value">${a.datosFisicos?.genero}</span></div>
            <div class="item"><span class="label">Peso Actual</span><span class="value">${a.datosFisicos?.peso} kg</span></div>
            <div class="item"><span class="label">Estatura</span><span class="value">${a.datosFisicos?.altura} cm</span></div>
          </div>

          <div class="section-title">2. Medidas Corporales (CM)</div>
          <div class="grid">
            <div class="item"><span class="label">Cuello</span><span class="value">${a.medidas?.cuello}</span></div>
            <div class="item"><span class="label">Pecho</span><span class="value">${a.medidas?.pecho}</span></div>
            <div class="item"><span class="label">Brazo Relajado</span><span class="value">${a.medidas?.brazoR}</span></div>
            <div class="item"><span class="label">Brazo Flexionado</span><span class="value">${a.medidas?.brazoF}</span></div>
            <div class="item"><span class="label">Cintura</span><span class="value">${a.medidas?.cintura}</span></div>
            <div class="item"><span class="label">Cadera</span><span class="value">${a.medidas?.cadera}</span></div>
            <div class="item"><span class="label">Muslo</span><span class="value">${a.medidas?.muslo}</span></div>
            <div class="item"><span class="label">Pierna</span><span class="value">${a.medidas?.pierna}</span></div>
          </div>

          <div class="section-title">4. Historial Médico</div>
          <div class="grid">
            <div class="full" style="padding:10px; border-bottom: 1px solid #f1f5f9;"><span class="label">Enfermedades Familiares</span><span class="value">${a.salud?.enfFam?.join(', ') || 'NINGUNA'}</span></div>
            <div class="full" style="padding:10px; border-bottom: 1px solid #f1f5f9;"><span class="label">Enfermedades Propias</span><span class="value">${a.salud?.enfPers?.join(', ') || 'NINGUNA'}</span></div>
            <div class="item"><span class="label">Lesiones</span><span class="value">${validarValor(a.salud?.detalleLesion)}</span></div>
            <div class="item"><span class="label">Cirugías</span><span class="value">${validarValor(a.salud?.detalleOperacion)}</span></div>
          </div>

          <div class="page-break"></div>

          <div class="section-title">5. Actividad Física (IPAQ)</div>
          <div class="grid">
            <div class="item"><span class="label">Vigorosa</span><span class="value">${a.ipaq?.vDias} días / ${a.ipaq?.vMin} min</span></div>
            <div class="item"><span class="label">Moderada</span><span class="value">${a.ipaq?.mDias} días / ${a.ipaq?.mMin} min</span></div>
            <div class="item"><span class="label">Caminata</span><span class="value">${a.ipaq?.cDias} días / ${a.ipaq?.cMin} min</span></div>
            <div class="item"><span class="label">Sedentario</span><span class="value">${a.ipaq?.sentado} hrs/día</span></div>
          </div>

          <div class="section-title">6. Nutrición y Objetivos</div>
          <div class="grid">
            <div class="full" style="padding:10px; border-bottom: 1px solid #f1f5f9;"><span class="label">Comidas actuales</span><span class="value">${a.nutricion?.comidasAct} comidas (${a.nutricion?.descAct})</span></div>
            <div class="item"><span class="label">Alcohol</span><span class="value">${validarValor(a.nutricion?.alcoholFreq)}</span></div>
            <div class="item"><span class="label">Sustancias</span><span class="value">${validarValor(a.nutricion?.sustFreq)}</span></div>
            <div class="item"><span class="label">Días Entreno</span><span class="value">${a.nutricion?.entrenos} días</span></div>
            <div class="item"><span class="label">Comidas en Plan</span><span class="value">${a.nutricion?.comidasDes}</span></div>
            <div class="full" style="padding:10px; background:#eff6ff;"><span class="label">OBJETIVO PRINCIPAL</span><span class="value" style="color:#1d4ed8; font-size:16px;">${a.nutricion?.objetivo}</span></div>
          </div>

          <div class="section-title">7. Frecuencia de Alimentos</div>
          <div class="grid">
            ${Object.entries(a.frecuenciaAlimentos || {}).map(([k, v]) => `
              <div class="item"><span class="label">${k}</span><span class="value">${v}</span></div>
            `).join('')}
          </div>

          <div class="page-break"></div>

          <div class="section-title">8 y 9. Consentimiento Informado</div>
          <div class="legal-text">
            <b>1. Propósito y explicación de los procedimientos:</b> Mediante este documento acepto voluntariamente participar en un plan de entrenamiento personal de acondicionamiento físico. Estas pueden incluir asesoramiento dietético y actividades formativas sobre salud. Entrenadores capacitados dirigirán mis actividades y evaluarán mi esfuerzo.
            <br/><br/>
            <b>2. Riesgos:</b> Se me ha informado de efectos negativos durante el ejercicio como alteración de presión arterial, mareos, trastornos del ritmo cardíaco, lesiones musculares, derrames e incluso riesgo de muerte.
            <br/><br/>
            <b>3. Beneficios:</b> Soy consciente de que si sigo cuidadosamente las instrucciones mejoraré mi forma física tras un período de 3 a 6 meses.
            <br/><br/>
            <b>4. Confidencialidad:</b> La información obtenida se tratará con máxima confidencialidad bajo la ley de protección de datos personales.
          </div>

          <div class="signature-box">
            <p style="font-size:12px; font-weight:bold; margin-bottom:10px;">ACEPTADO Y FIRMADO POR EL ALUMNO:</p>
            <img src="${a.firma}" class="signature-img" />
            <p><b>${a.nombre}</b></p>
            <p style="font-size:10px; color:#64748b;">Firmado el: ${a.timestamp?.toDate().toLocaleString()}<br/>UUID: ${a.uid}</p>
          </div>
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
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.logOutBtn}><Ionicons name="log-out" size={22} color="#ef4444" /></TouchableOpacity>
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
        ListEmptyComponent={<Text style={styles.empty}>Sin alumnos pendientes.</Text>}
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
               <Dato label="Vigorosa" value={`${alumnoSeleccionado?.ipaq?.vDias} días / ${alumnoSeleccionado?.ipaq?.vMin}m`} />
               <Dato label="Moderada" value={`${alumnoSeleccionado?.ipaq?.mDias} días / ${alumnoSeleccionado?.ipaq?.mMin}m`} />
               <Dato label="Caminata" value={`${alumnoSeleccionado?.ipaq?.cDias} días / ${alumnoSeleccionado?.ipaq?.cMin}m`} />
               <Dato label="Horas sentado" value={alumnoSeleccionado?.ipaq?.sentado} />
            </Section>

            <Section num={6} title="Nutrición y Objetivos" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Comidas Actuales" value={alumnoSeleccionado?.nutricion?.comidasAct} />
               <Dato label="Descripción Diario" value={alumnoSeleccionado?.nutricion?.descAct} />
               <Dato label="Días Entrenamiento" value={alumnoSeleccionado?.nutricion?.entrenos} />
               <Dato label="Comidas en Plan" value={alumnoSeleccionado?.nutricion?.comidasDes} />
               <Dato label="Objetivo principal" value={alumnoSeleccionado?.nutricion?.objetivo} />
            </Section>

            <Section num={7} title="Frecuencia Alimentos" color="#22c55e" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
               {alumnoSeleccionado?.frecuenciaAlimentos && Object.entries(alumnoSeleccionado.frecuenciaAlimentos).map(([k, v]: any) => (
                 <Dato key={k} label={k} value={v} />
               ))}
            </Section>

            <Section num={8} title="Firma y Consentimiento" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Text style={styles.consentTxt}>
                1. Propósito y explicación: Acepto participar en un plan de entrenamiento personal de acondicionamiento físico. Soy consciente de que se me puede requerir una prueba graduada de esfuerzo.{"\n\n"}
                2. Riesgos: Se me ha informado de efectos negativos como alteración de presión arterial, mareos, trastornos del ritmo cardíaco, lesiones musculares, derrames o muerte.{"\n\n"}
                3. Beneficios: Entiendo que los beneficios dependen de mi adherencia al programa de 3 a 6 meses.{"\n\n"}
                4. Confidencialidad: Mis datos se tratarán bajo la ley de protección de datos personales.
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
  cardAlumno: { backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
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
  datoBox: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', pb: 5 },
  datoLabel: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, fontWeight: '700' },
  datoValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  row: { flexDirection: 'row', gap: 20 },
  firmaPreview: { width: '100%', height: 120, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginTop: 10 },
  consentTxt: { fontSize: 10, color: '#64748b', textAlign: 'justify' },
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8' }
});