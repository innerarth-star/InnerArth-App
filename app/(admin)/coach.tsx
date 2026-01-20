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

  const generarPDFReal = (c: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const parqOrdenado = Object.keys(c.salud?.parq || {})
      .sort((a, b) => parseInt(a.replace('p', '')) - parseInt(b.replace('p', '')))
      .map(key => `<div class="dato"><b>${key.toUpperCase()}:</b> ${c.salud.parq[key]}</div>`)
      .join('');

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 3px solid #1e293b; margin-bottom: 20px; }
            .bloque { margin-bottom: 20px; border: 1px solid #eee; padding: 15px; border-radius: 8px; page-break-inside: avoid; }
            .titulo { background: #1e293b; color: white; padding: 5px 10px; font-size: 12px; margin: -15px -15px 15px -15px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .dato { font-size: 11px; }
            .firma-img { max-width: 200px; margin-top: 10px; border-bottom: 1px solid #000; }
          </style>
        </head>
        <body>
          <div class="header"><h1>INNERARTH</h1><p>EXPEDIENTE TÉCNICO COMPLETO</p></div>
          <div class="bloque"><div class="titulo">1. DATOS PERSONALES</div><div class="grid"><div class="dato">Nombre: ${c.nombre}</div><div class="dato">Tel: ${c.telefono}</div><div class="dato">Edad: ${c.datosFisicos?.edad}</div><div class="dato">Peso: ${c.datosFisicos?.peso}kg</div></div></div>
          <div class="bloque"><div class="titulo">2. MEDIDAS</div><div class="grid">${Object.entries(c.medidas || {}).map(([k, v]) => `<div class="dato">${k}: ${v}cm</div>`).join('')}</div></div>
          <div class="bloque"><div class="titulo">6. PAR-Q</div><div class="grid">${parqOrdenado}</div></div>
          <div class="bloque"><div class="titulo">8. FRECUENCIA ALIMENTOS</div><div class="grid">${Object.entries(c.frecuenciaAlimentos || {}).map(([a, f]) => `<div class="dato">${a}: ${f}</div>`).join('')}</div></div>
          <div class="firma" style="text-align:center; margin-top:50px;">
            ${c.firma?.includes('data:image') ? `<img src="${c.firma}" class="firma-img"/>` : `<h3>${c.firma}</h3>`}
            <p>FIRMA DEL CLIENTE</p>
          </div>
          <script>window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
        </body>
      </html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const ItemDato = ({ label, value }: any) => (
    <View style={styles.itemDato}><Text style={styles.itemLabel}>{label}:</Text><Text style={styles.itemValue}>{value || '—'}</Text></View>
  );

  if (clienteSeleccionado) {
    const c = clienteSeleccionado;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.toolbar}>
          <Pressable onPress={() => setClienteSeleccionado(null)} style={styles.btnNav}><FontAwesome5 name="arrow-left" size={14} color="#334155" /><Text style={{fontWeight:'bold', marginLeft:10}}>VOLVER</Text></Pressable>
          <Pressable onPress={() => generarPDFReal(c)} style={styles.btnPdfAccion}><FontAwesome5 name="file-pdf" size={16} color="#fff" /><Text style={{color:'#fff', fontWeight:'bold', marginLeft:10}}>PDF COMPLETO</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.reporteScroll}>
          <View style={styles.hojaFisica}>
            <Text style={styles.headerClinico}>INNERARTH COACHING</Text>
            
            {/* BLOQUE 1 */}
            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>1. DATOS PERSONALES</Text>
              <View style={styles.fila}><ItemDato label="Nombre" value={c.nombre} /><ItemDato label="Teléfono" value={c.telefono} /></View>
              <View style={styles.fila}><ItemDato label="Edad" value={c.datosFisicos?.edad} /><ItemDato label="Género" value={c.datosFisicos?.genero} /></View>
              <View style={styles.fila}><ItemDato label="Peso" value={`${c.datosFisicos?.peso} kg`} /><ItemDato label="Altura" value={`${c.datosFisicos?.altura} cm`} /></View>
            </View>

            {/* BLOQUE 2 */}
            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>2. MEDIDAS CORPORALES</Text>
              <View style={styles.gridMedidas}>
                {Object.entries(c.medidas || {}).map(([k, v]) => <ItemDato key={k} label={k} value={v} />)}
              </View>
            </View>

            {/* BLOQUE 4, 5 Y 6 */}
            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>4. SALUD Y PAR-Q</Text>
              <ItemDato label="Enfermedades" value={c.salud?.enfPers?.join(', ')} />
              <View style={styles.gridMedidas}>
                {Object.keys(c.salud?.parq || {}).sort().map(key => <ItemDato key={key} label={key.toUpperCase()} value={c.salud.parq[key]} />)}
              </View>
            </View>

            {/* BLOQUE 7 Y 8 */}
            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>7. NUTRICIÓN Y ALIMENTOS</Text>
              <ItemDato label="Objetivo" value={c.nutricion?.objetivo} />
              <Text style={styles.textoArea}>{c.nutricion?.descAct}</Text>
              <View style={styles.gridMedidas}>
                {Object.entries(c.frecuenciaAlimentos || {}).map(([a, f]) => <ItemDato key={a} label={a} value={f} />)}
              </View>
            </View>

            {/* BLOQUE 9 Y 10 */}
            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>10. FIRMA</Text>
              {c.firma?.includes('data:image') ? <Image source={{ uri: c.firma }} style={styles.firmaImagen} resizeMode="contain" /> : <Text style={styles.firmaNombre}>{c.firma}</Text>}
            </View>

            <View style={styles.accionesFinales}>
              <Pressable style={styles.btnRechazar} onPress={() => gestionarCliente('rechazar')}><Text style={{color:'#ef4444', fontWeight:'bold'}}>BORRAR</Text></Pressable>
              <Pressable style={styles.btnAceptar} onPress={() => gestionarCliente('aceptar')}><Text style={{color:'#fff', fontWeight:'bold'}}>ACEPTAR</Text></Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerLista}><View style={styles.headerInner}><Text style={styles.headerTitle}>InnerArth Coach</Text><Pressable onPress={() => signOut(auth)}><Text style={{color:'#ef4444', fontWeight:'bold'}}>Salir</Text></Pressable></View></View>
      <View style={styles.listWrapper}><FlatList data={clientes} keyExtractor={(item) => item.id} renderItem={({ item }) => (
        <Pressable style={styles.cardLista} onPress={() => setClienteSeleccionado(item)}><View><Text style={styles.nombreLista}>{item.nombre}</Text><Text style={styles.emailLista}>{item.email}</Text></View><FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" /></Pressable>
      )} contentContainerStyle={{ padding: 20 }} /></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerLista: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  headerInner: { width: '100%', maxWidth: 800, flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  listWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  btnNav: { flexDirection: 'row', alignItems: 'center' },
  btnPdfAccion: { backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  reporteScroll: { paddingVertical: 20 },
  hojaFisica: { backgroundColor: '#fff', width: '95%', maxWidth: 800, alignSelf: 'center', padding: 40, borderTopWidth: 8, borderTopColor: '#1e293b' },
  headerClinico: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  bloque: { marginBottom: 25, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 15 },
  bloqueTitulo: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  gridMedidas: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  itemDato: { minWidth: 120, marginBottom: 5 },
  itemLabel: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  itemValue: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
  textoArea: { backgroundColor: '#f8fafc', padding: 10, fontSize: 12, fontStyle: 'italic', marginVertical: 10 },
  firmaImagen: { width: 150, height: 60, marginTop: 10 },
  firmaNombre: { fontSize: 20, fontStyle: 'italic', marginTop: 10 },
  accionesFinales: { flexDirection: 'row', gap: 15, marginTop: 30 },
  btnAceptar: { flex: 2, backgroundColor: '#10b981', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnRechazar: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  cardLista: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  nombreLista: { fontWeight: 'bold', fontSize: 16 },
  emailLista: { fontSize: 12, color: '#64748b' }
});