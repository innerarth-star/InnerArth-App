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

  const handleSignOut = () => signOut(auth);

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
      <Text style={styles.itemValue}>{value || '—'}</Text>
    </View>
  );

  // --- COMPONENTE DEL EXPEDIENTE (10 BLOQUES COMPLETOS) ---
  if (clienteSeleccionado) {
    const c = clienteSeleccionado;
    return (
      <SafeAreaView style={styles.container}>
        {/* Barra de herramientas - Solo visible en pantalla */}
        <View style={styles.noPrintToolbar}>
          <Pressable onPress={() => setClienteSeleccionado(null)} style={styles.btnNav}>
            <FontAwesome5 name="arrow-left" size={14} color="#334155" />
            <Text style={{fontWeight:'bold', marginLeft:10}}>VOLVER AL LISTADO</Text>
          </Pressable>
          <Pressable onPress={() => window.print()} style={styles.btnPdfAccion}>
            <FontAwesome5 name="print" size={16} color="#fff" />
            <Text style={{color:'#fff', fontWeight:'bold', marginLeft:10}}>IMPRIMIR PDF COMPLETO</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollExpediente}>
          <View style={styles.hojaPapel}>
            <View style={styles.headerExpediente}>
              <Text style={styles.tituloClinico}>INNERARTH CO.</Text>
              <Text style={styles.subTituloClinico}>REPORTE DE EVALUACIÓN INICIAL - 10 BLOQUES</Text>
            </View>

            {/* BLOQUES RESTAURADOS AL 100% */}
            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>1. DATOS PERSONALES</Text>
              <View style={styles.fila}><ItemDato label="Nombre" value={c.nombre} /><ItemDato label="Edad" value={c.datosFisicos?.edad} /></View>
              <View style={styles.fila}><ItemDato label="Peso" value={`${c.datosFisicos?.peso} kg`} /><ItemDato label="Altura" value={`${c.datosFisicos?.altura} cm`} /></View>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>2. MEDIDAS CORPORALES</Text>
              <View style={styles.grid3}><ItemDato label="Cuello" value={c.medidas?.cuello} /><ItemDato label="Pecho" value={c.medidas?.pecho} /><ItemDato label="Brazo R" value={c.medidas?.brazoR} /><ItemDato label="Brazo F" value={c.medidas?.brazoF} /><ItemDato label="Cintura" value={c.medidas?.cintura} /><ItemDato label="Cadera" value={c.medidas?.cadera} /><ItemDato label="Muslo" value={c.medidas?.muslo} /><ItemDato label="Pierna" value={c.medidas?.pierna} /></View>
            </View>

            {c.datosFisicos?.genero === 'mujer' && (
              <View style={styles.bloque}><Text style={styles.bloqueTitulo}>3. CICLO MENSTRUAL</Text>
                <View style={styles.fila}><ItemDato label="Tipo" value={c.ciclo?.tipo} /><ItemDato label="Anticonceptivo" value={c.ciclo?.anticonceptivo} /></View>
              </View>
            )}

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>4. SALUD</Text>
              <ItemDato label="Enfermedades Propias" value={c.salud?.enfPers?.join(', ')} />
              <ItemDato label="Lesión" value={c.salud?.lesion === 'si' ? c.salud.detalleLesion : 'No'} />
              <ItemDato label="FCR" value={c.salud?.frecuenciaCardiaca} />
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>5. ESTILO DE VIDA (IPAQ)</Text>
              <View style={styles.grid3}><ItemDato label="Vigorosa" value={c.ipaq?.vDias} /><ItemDato label="Moderada" value={c.ipaq?.mDias} /><ItemDato label="Horas Sueño" value={c.ipaq?.horasSueno} /></View>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>6. PAR-Q</Text>
              {Object.entries(c.salud?.parq || {}).map(([key, val]: any) => (
                <Text key={key} style={styles.txtP}>• {key}: {val}</Text>
              ))}
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>7. NUTRICIÓN</Text>
              <ItemDato label="Objetivo" value={c.nutricion?.objetivo} />
              <Text style={styles.txtArea}>{c.nutricion?.descAct}</Text>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>8. FRECUENCIA ALIMENTOS</Text>
              <View style={styles.grid3}>{Object.entries(c.frecuenciaAlimentos || {}).map(([a, f]: any) => (<ItemDato key={a} label={a} value={f} />))}</View>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>9 / 10. FIRMA</Text>
              {c.firma?.includes('data:image') ? <Image source={{uri: c.firma}} style={styles.imgFirma} resizeMode="contain" /> : <Text style={styles.firmaTexto}>{c.firma}</Text>}
            </View>

            <View style={styles.noPrintActions}>
              <Pressable style={styles.btnRechazar} onPress={() => gestionarCliente('rechazar')}><Text style={{color:'#ef4444', fontWeight:'bold'}}>BORRAR</Text></Pressable>
              <Pressable style={styles.btnAceptar} onPress={() => gestionarCliente('aceptar')}><Text style={{color:'#fff', fontWeight:'bold'}}>ACEPTAR ALUMNO</Text></Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- LISTADO PRINCIPAL ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerHome}><Text style={styles.titleHome}>Panel Coach</Text><Pressable onPress={handleSignOut}><Text style={{color:'#ef4444'}}>Salir</Text></Pressable></View>
      <View style={styles.listContainer}>
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.itemCard} onPress={() => setClienteSeleccionado(item)}>
              <Text style={styles.itemName}>{item.nombre}</Text>
              <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
            </Pressable>
          )}
          contentContainerStyle={{ padding: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerHome: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  titleHome: { fontSize: 20, fontWeight: 'bold' },
  listContainer: { flex: 1, maxWidth: 800, width: '100%', alignSelf: 'center' },
  itemCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  itemName: { fontWeight: 'bold', fontSize: 16 },

  noPrintToolbar: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#ddd' },
  btnNav: { flexDirection: 'row', alignItems: 'center' },
  btnPdfAccion: { backgroundColor: '#1e293b', padding: 10, borderRadius: 8, flexDirection: 'row' },
  
  scrollExpediente: { flex: 1 },
  reporteScroll: { paddingVertical: 20 },
  hojaPapel: { backgroundColor: '#fff', width: '95%', maxWidth: 800, alignSelf: 'center', padding: 40, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  headerExpediente: { borderBottomWidth: 3, borderColor: '#1e293b', paddingBottom: 10, marginBottom: 20 },
  tituloClinico: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  subTituloClinico: { fontSize: 10, textAlign: 'center', color: '#64748b' },
  bloque: { marginBottom: 20, borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 10 },
  bloqueTitulo: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, color: '#1e293b' },
  fila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  itemDato: { minWidth: 120, marginBottom: 5 },
  itemLabel: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  itemValue: { fontSize: 13, fontWeight: '600' },
  txtP: { fontSize: 11, marginBottom: 2 },
  txtArea: { backgroundColor: '#f8fafc', padding: 10, fontSize: 12, fontStyle: 'italic' },
  imgFirma: { width: 150, height: 60, marginTop: 10 },
  firmaTexto: { fontSize: 20, fontStyle: 'italic' },
  noPrintActions: { flexDirection: 'row', gap: 15, marginTop: 20 },
  btnAceptar: { flex: 2, backgroundColor: '#10b981', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnRechazar: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' }
});