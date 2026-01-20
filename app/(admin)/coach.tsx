import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator, Platform, SafeAreaView, ScrollView, Image } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5 } from '@expo/vector-icons';

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
        await addDoc(collection(db, "alumnos_activos"), { ...clienteSeleccionado, fechaAceptado: serverTimestamp() });
      }
      await deleteDoc(doc(db, "revisiones_pendientes", clienteSeleccionado.id));
      setClienteSeleccionado(null);
    } catch (e) { console.error(e); }
  };

  const ItemDato = ({ label, value }: any) => (
    <View style={styles.itemDato}>
      <Text style={styles.itemLabel}>{label}:</Text>
      <Text style={styles.itemValue}>{value || 'Sin dato'}</Text>
    </View>
  );

  if (clienteSeleccionado) {
    const c = clienteSeleccionado;
    return (
      <SafeAreaView style={styles.container}>
        {/* Barra de Herramientas (Ocultar en PDF con CSS en Vercel) */}
        <View style={styles.toolbar}>
          <Pressable onPress={() => setClienteSeleccionado(null)} style={styles.btnNav}>
            <FontAwesome5 name="arrow-left" size={14} color="#334155" />
            <Text style={{fontWeight:'bold', marginLeft:10}}>VOLVER</Text>
          </Pressable>
          <Pressable onPress={() => window.print()} style={styles.btnPdfAccion}>
            <FontAwesome5 name="print" size={16} color="#fff" />
            <Text style={{color:'#fff', fontWeight:'bold', marginLeft:10}}>IMPRIMIR REPORTE</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.reporteScroll}>
          <View style={styles.hojaFisica}>
            <Text style={styles.headerClinico}>INNERARTH RECOMPOSICIÓN CORPORAL</Text>
            <Text style={styles.subHeader}>EXPEDIENTE TÉCNICO COMPLETO - {c.nombre.toUpperCase()}</Text>

            {/* BLOQUE 1: DATOS PERSONALES */}
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>1. DATOS PERSONALES</Text>
              <View style={styles.fila}>
                <ItemDato label="Nombre" value={c.nombre} />
                <ItemDato label="Teléfono" value={c.telefono} />
              </View>
              <View style={styles.fila}>
                <ItemDato label="Edad" value={c.datosFisicos?.edad} />
                <ItemDato label="Género" value={c.datosFisicos?.genero} />
                <ItemDato label="Peso" value={`${c.datosFisicos?.peso} kg`} />
                <ItemDato label="Altura" value={`${c.datosFisicos?.altura} cm`} />
              </View>
            </View>

            {/* BLOQUE 2: MEDIDAS COMPLETAS */}
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>2. MEDIDAS CORPORALES (CM)</Text>
              <View style={styles.gridMedidas}>
                <ItemDato label="Cuello" value={c.medidas?.cuello} />
                <ItemDato label="Pecho" value={c.medidas?.pecho} />
                <ItemDato label="Brazo Relajado" value={c.medidas?.brazoR} />
                <ItemDato label="Brazo Flexionado" value={c.medidas?.brazoF} />
                <ItemDato label="Cintura" value={c.medidas?.cintura} />
                <ItemDato label="Cadera" value={c.medidas?.cadera} />
                <ItemDato label="Muslo" value={c.medidas?.muslo} />
                <ItemDato label="Pierna" value={c.medidas?.pierna} />
              </View>
            </View>

            {/* BLOQUE 3: CICLO (Solo Mujeres) */}
            {c.datosFisicos?.genero === 'mujer' && (
              <View style={styles.bloque}>
                <Text style={styles.bloqueTitulo}>3. CICLO MENSTRUAL</Text>
                <View style={styles.fila}>
                  <ItemDato label="Tipo de Ciclo" value={c.ciclo?.tipo} />
                  <ItemDato label="Anticonceptivo" value={c.ciclo?.anticonceptivo} />
                </View>
              </View>
            )}

            {/* BLOQUE 4: SALUD */}
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>4. HISTORIAL DE SALUD</Text>
              <ItemDato label="Enfermedades Familiares" value={c.salud?.enfFam?.join(', ')} />
              <ItemDato label="Enfermedades Propias" value={c.salud?.enfPers?.join(', ')} />
              <View style={styles.fila}>
                <ItemDato label="¿Lesión?" value={c.salud?.lesion === 'si' ? c.salud.detalleLesion : 'No'} />
                <ItemDato label="¿Operación?" value={c.salud?.operacion === 'si' ? c.salud.detalleOperacion : 'No'} />
              </View>
              <ItemDato label="Frecuencia Cardíaca Reposo (FCR)" value={c.salud?.frecuenciaCardiaca} />
            </View>

            {/* BLOQUE 5: ESTILO DE VIDA IPAQ */}
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>5. ESTILO DE VIDA (IPAQ)</Text>
              <View style={styles.gridMedidas}>
                <ItemDato label="Vigorosa" value={`${c.ipaq?.vDias} días / ${c.ipaq?.vMin} min`} />
                <ItemDato label="Moderada" value={`${c.ipaq?.mDias} días / ${c.ipaq?.mMin} min`} />
                <ItemDato label="Caminata" value={`${c.ipaq?.cDias} días / ${c.ipaq?.cMin} min`} />
                <ItemDato label="Horas Sentado" value={c.ipaq?.sentado} />
                <ItemDato label="Horas Sueño" value={c.ipaq?.horasSueno} />
              </View>
            </View>

            {/* BLOQUE 6: PAR-Q */}
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>6. CUESTIONARIO PAR-Q</Text>
              {Object.entries(c.salud?.parq || {}).map(([id, resp]: any) => (
                <Text key={id} style={styles.textoLista}>• {id.toUpperCase()}: <Text style={{fontWeight:'bold'}}>{resp}</Text></Text>
              ))}
            </View>

            {/* BLOQUE 7: NUTRICIÓN */}
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>7. NUTRICIÓN Y HÁBITOS</Text>
              <ItemDato label="Objetivos" value={c.nutricion?.objetivo} />
              <ItemDato label="Comidas Actuales" value={c.nutricion?.comidasAct} />
              <ItemDato label="Comidas Deseadas" value={c.nutricion?.comidasDes} />
              <ItemDato label="Días Entrenamiento" value={c.nutricion?.entrenos} />
              <View style={styles.fila}>
                <ItemDato label="Alcohol" value={c.nutricion?.alcohol === 'si' ? c.nutricion.alcoholFreq : 'No'} />
                <ItemDato label="Sustancias/Fuma" value={c.nutricion?.sust === 'si' ? c.nutricion.sustFreq : 'No'} />
              </View>
              <Text style={styles.labelSub}>Descripción Dieta Actual:</Text>
              <Text style={styles.textoArea}>{c.nutricion?.descAct}</Text>
            </View>

            {/* BLOQUE 8: FRECUENCIA ALIMENTOS */}
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>8. FRECUENCIA DE ALIMENTOS</Text>
              <View style={styles.gridMedidas}>
                {Object.entries(c.frecuenciaAlimentos || {}).map(([ali, freq]: any) => (
                  <ItemDato key={ali} label={ali} value={freq} />
                ))}
              </View>
            </View>

            {/* BLOQUE 9 Y 10: FIRMA */}
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>9 / 10. CONSENTIMIENTO Y FIRMA</Text>
              <Text style={styles.textoLegal}>El usuario confirma la veracidad de los datos y acepta los términos del servicio.</Text>
              {c.firma?.includes('data:image') ? (
                <Image source={{ uri: c.firma }} style={styles.firmaImagen} resizeMode="contain" />
              ) : <Text style={styles.firmaNombre}>{c.firma}</Text>}
            </View>

            {/* ACCIONES (Se ocultan en el PDF al imprimir en Web) */}
            <View style={styles.accionesFinales}>
              <Pressable style={styles.btnRechazar} onPress={() => gestionarCliente('rechazar')}>
                <Text style={{color:'#ef4444', fontWeight:'bold'}}>RECHAZAR</Text>
              </Pressable>
              <Pressable style={styles.btnAceptar} onPress={() => gestionarCliente('aceptar')}>
                <Text style={{color:'#fff', fontWeight:'bold'}}>ACEPTAR ALUMNO</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- LISTADO DE COACH ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerLista}>
        <Text style={styles.headerTitle}>InnerArth Coach</Text>
        <Pressable onPress={() => signOut(auth)}><Text style={{color:'#ef4444'}}>Salir</Text></Pressable>
      </View>
      <FlatList
        data={clientes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.cardLista} onPress={() => setClienteSeleccionado(item)}>
            <View>
              <Text style={styles.nombreLista}>{item.nombre}</Text>
              <Text style={styles.emailLista}>{item.email}</Text>
            </View>
            <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
          </Pressable>
        )}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={{textAlign:'center', marginTop: 40}}>No hay revisiones.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  btnNav: { flexDirection: 'row', alignItems: 'center' },
  btnPdfAccion: { backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  reporteScroll: { paddingVertical: 20 },
  hojaFisica: { backgroundColor: '#fff', width: '95%', maxWidth: 800, alignSelf: 'center', padding: 40, borderTopWidth: 8, borderTopColor: '#1e293b' },
  headerClinico: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subHeader: { fontSize: 10, color: '#64748b', textAlign: 'center', marginBottom: 30, letterSpacing: 1 },
  bloque: { marginBottom: 25, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 15 },
  bloqueTitulo: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  gridMedidas: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  itemDato: { minWidth: 120 },
  itemLabel: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  itemValue: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
  textoLista: { fontSize: 11, color: '#475569', marginBottom: 4 },
  labelSub: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginTop: 15 },
  textoArea: { backgroundColor: '#f8fafc', padding: 10, fontSize: 12, fontStyle: 'italic', marginTop: 5 },
  textoLegal: { fontSize: 10, color: '#94a3b8', marginBottom: 10 },
  firmaImagen: { width: 150, height: 60, marginTop: 10 },
  firmaNombre: { fontSize: 20, fontStyle: 'italic', marginTop: 10 },
  accionesFinales: { flexDirection: 'row', gap: 15, marginTop: 30 },
  btnAceptar: { flex: 2, backgroundColor: '#10b981', padding: 18, borderRadius: 10, alignItems: 'center' },
  btnRechazar: { flex: 1, backgroundColor: '#fff', padding: 18, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  headerLista: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  cardLista: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  nombreLista: { fontWeight: 'bold', fontSize: 16 },
  emailLista: { fontSize: 12, color: '#64748b' }
});