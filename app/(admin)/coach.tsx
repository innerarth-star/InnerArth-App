import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator, Platform, SafeAreaView, ScrollView, Image } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

export default function CoachPanel() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, "revisiones_pendientes"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: any[] = [];
      snapshot.forEach((doc) => { lista.push({ id: doc.id, ...doc.data() }); });
      setClientes(lista);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  const gestionarCliente = async (accion: 'aceptar' | 'rechazar') => {
    if (!clienteSeleccionado) return;
    try {
      if (accion === 'aceptar') {
        await addDoc(collection(db, "alumnos_activos"), {
          ...clienteSeleccionado,
          fechaAceptado: serverTimestamp(),
          estadoPlan: 'pendiente'
        });
      }
      await deleteDoc(doc(db, "revisiones_pendientes", clienteSeleccionado.id));
      setClienteSeleccionado(null);
    } catch (e) { console.log(e); }
  };

  // --- COMPONENTE DE SECCIÓN FORMAL ---
  const SeccionFormal = ({ title, icon, color, children }: any) => (
    <View style={styles.seccionCard}>
      <View style={[styles.seccionHeader, { borderLeftColor: color }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
        <Text style={[styles.seccionTitle, { color: color }]}>{title.toUpperCase()}</Text>
      </View>
      <View style={styles.seccionContent}>{children}</View>
    </View>
  );

  const FilaDato = ({ label, value, fullWidth = false }: any) => (
    <View style={[styles.datoContenedor, fullWidth ? { width: '100%' } : { width: '48%' }]}>
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={styles.datoValue}>{value || '—'}</Text>
    </View>
  );

  if (clienteSeleccionado) {
    const c = clienteSeleccionado;
    return (
      <SafeAreaView style={styles.container}>
        {/* Header de Navegación (No sale en el PDF) */}
        <View style={[styles.navHeader, { display: Platform.OS === 'web' ? 'flex' : 'flex' }]}>
          <Pressable onPress={() => setClienteSeleccionado(null)} style={styles.btnVolver}>
            <FontAwesome5 name="arrow-left" size={14} color="#64748b" />
            <Text style={styles.txtVolver}> Volver al Listado</Text>
          </Pressable>
          <Pressable onPress={() => window.print()} style={styles.btnDescargar}>
            <FontAwesome5 name="file-pdf" size={16} color="#fff" />
            <Text style={{color:'#fff', fontWeight:'bold', marginLeft:8}}>Generar Reporte PDF</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.reporteContainer}>
          <View style={styles.hojaA4}>
            
            {/* CABECERA DEL REPORTE */}
            <View style={styles.reporteHeader}>
              <View>
                <Text style={styles.reporteTitulo}>EXPEDIENTE TÉCNICO</Text>
                <Text style={styles.reporteSubtitulo}>Evaluación Inicial de Salud y Aptitud Física</Text>
              </View>
              <View style={styles.fechaContenedor}>
                <Text style={styles.fechaLabel}>FECHA DE REGISTRO</Text>
                <Text style={styles.fechaValor}>{new Date(c.timestamp?.seconds * 1000).toLocaleDateString()}</Text>
              </View>
            </View>

            {/* BLOQUE 1: IDENTIFICACIÓN */}
            <SeccionFormal title="Identificación del Cliente" icon="account-details" color="#1e293b">
              <View style={styles.filaWrap}>
                <FilaDato label="Nombre Completo" value={c.nombre} fullWidth />
                <FilaDato label="Correo Electrónico" value={c.email} />
                <FilaDato label="Teléfono / WhatsApp" value={c.telefono} />
              </View>
            </SeccionFormal>

            {/* BLOQUE 2: ANTROPOMETRÍA */}
            <SeccionFormal title="Composición y Antropometría" icon="scale-bathroom" color="#3b82f6">
              <View style={styles.filaWrap}>
                <FilaDato label="Edad" value={`${c.datosFisicos?.edad} años`} />
                <FilaDato label="Género" value={c.datosFisicos?.genero} />
                <FilaDato label="Peso Actual" value={`${c.datosFisicos?.peso} kg`} />
                <FilaDato label="Estatura" value={`${c.datosFisicos?.altura} cm`} />
              </View>
              <View style={[styles.filaWrap, { marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }]}>
                <FilaDato label="Cuello" value={c.medidas?.cuello} />
                <FilaDato label="Pecho" value={c.medidas?.pecho} />
                <FilaDato label="Cintura" value={c.medidas?.cintura} />
                <FilaDato label="Cadera" value={c.medidas?.cadera} />
                <FilaDato label="Bíceps R." value={c.medidas?.brazoR} />
                <FilaDato label="Bíceps F." value={c.medidas?.brazoF} />
                <FilaDato label="Muslo" value={c.medidas?.muslo} />
                <FilaDato label="Pierna" value={c.medidas?.pierna} />
              </View>
            </SeccionFormal>

            {/* BLOQUE 3: HISTORIAL CLÍNICO */}
            <SeccionFormal title="Antecedentes y Salud" icon="medical-bag" color="#ef4444">
              <FilaDato label="Enfermedades Familiares" value={c.salud?.enfFam?.join(', ')} fullWidth />
              <FilaDato label="Condiciones Personales" value={c.salud?.enfPers?.join(', ')} fullWidth />
              <View style={styles.filaWrap}>
                <FilaDato label="Lesiones" value={c.salud?.lesion === 'si' ? c.salud.detalleLesion : 'Ninguna'} />
                <FilaDato label="Operaciones" value={c.salud?.operacion === 'si' ? c.salud.detalleOperacion : 'Ninguna'} />
              </View>
            </SeccionFormal>

            {/* BLOQUE 4: NUTRICIÓN Y OBJETIVOS */}
            <SeccionFormal title="Análisis Nutricional y Metas" icon="food-apple" color="#10b981">
              <FilaDato label="Objetivo Principal" value={c.nutricion?.objetivo} fullWidth />
              <FilaDato label="Descripción Dietética Actual" value={c.nutricion?.descAct} fullWidth />
              <View style={styles.filaWrap}>
                <FilaDato label="Comidas al día" value={c.nutricion?.comidasDes} />
                <FilaDato label="Entrenamientos/Semana" value={c.nutricion?.entrenos} />
                <FilaDato label="Consumo Alcohol" value={c.nutricion?.alcohol === 'si' ? c.nutricion.alcoholFreq : 'No'} />
                <FilaDato label="Fuma / Sustancias" value={c.nutricion?.sust === 'si' ? c.nutricion.sustFreq : 'No'} />
              </View>
            </SeccionFormal>

            {/* BLOQUE 5: FIRMA LEGAL */}
            <SeccionFormal title="Validación y Consentimiento" icon="fountain-pen-tip" color="#1e293b">
              <Text style={styles.textoLegal}>El cliente declara que la información proporcionada es fidedigna y acepta los términos del programa de entrenamiento.</Text>
              {c.firma?.includes('data:image') ? (
                <Image source={{ uri: c.firma }} style={styles.imgFirma} resizeMode="contain" />
              ) : <Text style={styles.txtFirmaNombre}>{c.firma}</Text>}
            </SeccionFormal>

            {/* ACCIONES (No salen en PDF) */}
            <View style={styles.areaAcciones}>
              <Pressable style={styles.btnRechazar} onPress={() => gestionarCliente('rechazar')}>
                <Text style={styles.btnTexto}>RECHAZAR SOLICITUD</Text>
              </Pressable>
              <Pressable style={styles.btnAceptar} onPress={() => gestionarCliente('aceptar')}>
                <Text style={styles.btnTexto}>ADMITIR CLIENTE Y CREAR PERFIL</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- LISTADO PRINCIPAL ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSimple}>
        <Text style={styles.headerTitleSimple}>Gestión de Prospectos</Text>
        <Pressable onPress={() => signOut(auth)} style={styles.btnLogOut}>
          <Text style={{color:'#ef4444', fontWeight:'bold', fontSize:12}}>Cerrar Sesión</Text>
        </Pressable>
      </View>
      <View style={styles.mainWrapper}>
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.cardProspecto} onPress={() => setClienteSeleccionado(item)}>
              <View>
                <Text style={styles.prospectoNombre}>{item.nombre}</Text>
                <Text style={styles.prospectoEmail}>{item.email}</Text>
              </View>
              <View style={styles.badgePendiente}>
                <Text style={styles.badgeTexto}>REVISAR</Text>
              </View>
            </Pressable>
          )}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.vacio}>Sin solicitudes nuevas.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  mainWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  
  // Estilos de la Lista
  headerSimple: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitleSimple: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  btnLogOut: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 6 },
  cardProspecto: { backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  prospectoNombre: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  prospectoEmail: { fontSize: 13, color: '#64748b' },
  badgePendiente: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTexto: { color: '#3b82f6', fontSize: 10, fontWeight: '900' },

  // Estilos del Reporte (Vista PDF)
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  btnVolver: { flexDirection: 'row', alignItems: 'center' },
  txtVolver: { color: '#64748b', fontWeight: '600', marginLeft: 5 },
  btnDescargar: { backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8 },
  
  reporteContainer: { paddingVertical: 20 },
  hojaA4: { backgroundColor: '#fff', width: '95%', maxWidth: 850, alignSelf: 'center', padding: 30, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  reporteHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#1e293b', paddingBottom: 20, marginBottom: 30 },
  reporteTitulo: { fontSize: 24, fontWeight: '900', color: '#1e293b', letterSpacing: 1 },
  reporteSubtitulo: { fontSize: 12, color: '#64748b', marginTop: 4 },
  fechaContenedor: { alignItems: 'flex-end' },
  fechaLabel: { fontSize: 9, fontWeight: '900', color: '#94a3b8' },
  fechaValor: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },

  seccionCard: { marginBottom: 25 },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', borderLeftWidth: 4, paddingLeft: 10, marginBottom: 15 },
  seccionTitle: { fontSize: 13, fontWeight: '900' },
  
  // AQUÍ ESTABA EL ERROR: Añadida la propiedad faltante
  seccionContent: { paddingLeft: 14 }, 

  filaWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  datoContenedor: { marginBottom: 15 },
  datoLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  datoValue: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  textArea: { fontSize: 13, color: '#475569', lineHeight: 20, backgroundColor: '#f8fafc', padding: 12, borderRadius: 6, marginTop: 5, borderLeftWidth: 2, borderLeftColor: '#e2e8f0' },
  textoLegal: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginBottom: 15 },
  imgFirma: { width: 200, height: 80, backgroundColor: '#f8fafc', marginTop: 10 },
  txtFirmaNombre: { fontSize: 22, fontStyle: 'italic', marginTop: 10, color: '#1e293b' },

  areaAcciones: { flexDirection: 'row', gap: 15, marginTop: 40, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 30 },
  btnAceptar: { flex: 2, backgroundColor: '#10b981', padding: 18, borderRadius: 10, alignItems: 'center' },
  btnRechazar: { flex: 1, backgroundColor: '#fff', padding: 18, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  btnTexto: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  vacio: { textAlign: 'center', marginTop: 100, color: '#94a3b8' }
});