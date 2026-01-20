import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator, Platform, SafeAreaView, ScrollView, Image } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5 } from '@expo/vector-icons';

export default function CoachPanel() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  // ESTADO CLAVE: Controla qué vemos
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

  const handleSignOut = () => signOut(auth).catch(err => console.log(err));

  const eliminarRegistro = async (id: string, nombre: string) => {
    if (Platform.OS === 'web' ? window.confirm(`¿Borrar a ${nombre}?`) : true) {
      await deleteDoc(doc(db, "revisiones_pendientes", id));
    }
  };

  // --- VISTA 1: EL EXPEDIENTE DETALLADO ---
  if (clienteSeleccionado) {
    const c = clienteSeleccionado;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setClienteSeleccionado(null)} style={styles.btnBack}>
            <FontAwesome5 name="arrow-left" size={16} color="#3b82f6" />
            <Text style={{color:'#3b82f6', fontWeight:'bold'}}> Volver</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Expediente</Text>
          <View style={{width: 80}} /> 
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.mainWrapper}>
            <Text style={styles.nombreDetalle}>{c.nombre}</Text>
            
            {/* Bloque Físico */}
            <View style={styles.cardDetalle}>
              <Text style={styles.seccionTitulo}>Composición</Text>
              <Text>Edad: {c.datosFisicos?.edad} | Peso: {c.datosFisicos?.peso}kg | Altura: {c.datosFisicos?.altura}cm</Text>
            </View>

            {/* Bloque Medidas */}
            <View style={styles.cardDetalle}>
              <Text style={styles.seccionTitulo}>Medidas (cm)</Text>
              <View style={{flexDirection:'row', flexWrap:'wrap', gap:10}}>
                <Text>Cintura: {c.medidas?.cintura}</Text>
                <Text>Cadera: {c.medidas?.cadera}</Text>
                <Text>Pecho: {c.medidas?.pecho}</Text>
                <Text>Brazo: {c.medidas?.brazoR}</Text>
              </View>
            </View>

            {/* Bloque Nutrición */}
            <View style={styles.cardDetalle}>
              <Text style={styles.seccionTitulo}>Objetivo y Dieta</Text>
              <Text style={{fontWeight:'bold'}}>{c.nutricion?.objetivo}</Text>
              <Text style={{marginTop:5, color:'#64748b'}}>{c.nutricion?.descAct}</Text>
            </View>

             {/* Firma */}
             <View style={styles.cardDetalle}>
              <Text style={styles.seccionTitulo}>Firma de Conformidad</Text>
              {c.firma?.includes('data:image') ? (
                <Image source={{uri: c.firma}} style={{width:'100%', height:100}} resizeMode="contain" />
              ) : <Text style={{fontStyle:'italic', fontSize:18}}>{c.firma}</Text>}
            </View>

            <Pressable style={styles.btnPdf} onPress={() => window.print()}>
              <Text style={{color:'#fff', fontWeight:'bold'}}>IMPRIMIR / PDF</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- VISTA 2: LA LISTA DE CLIENTES ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.headerTitle}>Panel Coach</Text>
          <Pressable onPress={handleSignOut} style={styles.btnSalir}>
            <Text style={styles.txtSalir}>Salir</Text>
            <FontAwesome5 name="sign-out-alt" size={14} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      <View style={styles.mainWrapper}>
        {cargando ? <ActivityIndicator size="large" color="#3b82f6" style={{marginTop:50}} /> : (
          <FlatList
            data={clientes}
            keyExtractor={(item) => item.id}
            renderItem={({item}) => (
              <View style={styles.card}>
                <View style={{flex:1}}>
                  <Text style={styles.clienteNombre}>{item.nombre}</Text>
                  <Text style={{fontSize:12, color:'#64748b'}}>{item.email}</Text>
                </View>
                <View style={{flexDirection:'row', gap:10}}>
                  <Pressable style={styles.btnIcono} onPress={() => setClienteSeleccionado(item)}>
                    <FontAwesome5 name="eye" size={16} color="#3b82f6" />
                  </Pressable>
                  <Pressable style={styles.btnIcono} onPress={() => eliminarRegistro(item.id, item.nombre)}>
                    <FontAwesome5 name="trash" size={16} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.vacio}>No hay pendientes</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', alignItems: 'center' },
  headerInner: { width: '100%', maxWidth: 800, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  btnSalir: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  txtSalir: { color: '#ef4444', fontWeight: 'bold' },
  mainWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center', padding: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  clienteNombre: { fontWeight: 'bold', fontSize: 16 },
  btnIcono: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 8 },
  scrollContent: { paddingBottom: 40 },
  nombreDetalle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  cardDetalle: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  seccionTitulo: { fontWeight: 'bold', color: '#3b82f6', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eff6ff' },
  btnBack: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  btnPdf: { backgroundColor: '#1e293b', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  vacio: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});