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

  // --- FUNCIÓN DE PDF: 10 BLOQUES ORDENADOS ---
  const generarPDFReal = (c: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Ordenar PAR-Q para que no salga revuelto
    const parqOrdenado = Object.keys(c.salud?.parq || {})
      .sort((a, b) => parseInt(a.replace('p', '')) - parseInt(b.replace('p', '')))
      .map(key => `<div class="dato"><b>${key.toUpperCase()}:</b> ${c.salud.parq[key]}</div>`)
      .join('');

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1e293b; line-height: 1.4; }
            .h { text-align: center; border-bottom: 3px solid #1e293b; margin-bottom: 20px; }
            .b { margin-bottom: 15px; page-break-inside: avoid; border: 1px solid #eee; padding: 10px; border-radius: 5px; }
            .t { background: #1e293b; color: white; padding: 5px 10px; font-size: 12px; font-weight: bold; margin: -10px -10px 10px -10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
            .dato { font-size: 11px; margin-bottom: 4px; }
            .firma { text-align: center; margin-top: 30px; }
            .firma-img { max-width: 200px; border-bottom: 1px solid #000; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="h"><h2>INNERARTH - EXPEDIENTE TÉCNICO</h2><p>${c.nombre.toUpperCase()}</p></div>

          <div class="b"><div class="t">1. DATOS PERSONALES</div><div class="grid">
            <div class="dato"><b>Nombre:</b> ${c.nombre}</div><div class="dato"><b>Tel:</b> ${c.telefono}</div>
            <div class="dato"><b>Edad:</b> ${c.datosFisicos?.edad}</div><div class="dato"><b>Peso:</b> ${c.datosFisicos?.peso}kg</div>
            <div class="dato"><b>Altura:</b> ${c.datosFisicos?.altura}cm</div><div class="dato"><b>Género:</b> ${c.datosFisicos?.genero}</div>
          </div></div>

          <div class="b"><div class="t">2. MEDIDAS (CM)</div><div class="grid">
            <div class="dato">Cuello: ${c.medidas?.cuello}</div><div class="dato">Pecho: ${c.medidas?.pecho}</div>
            <div class="dato">Cintura: ${c.medidas?.cintura}</div><div class="dato">Cadera: ${c.medidas?.cadera}</div>
            <div class="dato">Brazo R: ${c.medidas?.brazoR}</div><div class="dato">Brazo F: ${c.medidas?.brazoF}</div>
            <div class="dato">Muslo: ${c.medidas?.muslo}</div><div class="dato">Pierna: ${c.medidas?.pierna}</div>
          </div></div>

          ${c.datosFisicos?.genero === 'mujer' ? `<div class="b"><div class="t">3. CICLO</div><div class="dato">Tipo: ${c.ciclo?.tipo} | Anticonceptivo: ${c.ciclo?.anticonceptivo}</div></div>` : ''}

          <div class="b"><div class="t">4. SALUD</div>
            <div class="dato"><b>Enfermedades:</b> ${c.salud?.enfPers?.join(', ')}</div>
            <div class="dato"><b>Lesión:</b> ${c.salud?.lesion === 'si' ? c.salud.detalleLesion : 'No'}</div>
            <div class="dato"><b>FCR:</b> ${c.salud?.frecuenciaCardiaca} lpm</div>
          </div>

          <div class="b"><div class="t">5. ESTILO VIDA (IPAQ)</div><div class="grid">
            <div class="dato">Vigorosa: ${c.ipaq?.vDias}d/${c.ipaq?.vMin}m</div><div class="dato">Moderada: ${c.ipaq?.mDias}d/${c.ipaq?.mMin}m</div>
            <div class="dato">Sentado: ${c.ipaq?.sentado}h</div><div class="dato">Sueño: ${c.ipaq?.horasSueno}h</div>
          </div></div>

          <div class="b"><div class="t">6. PAR-Q (ORDENADO)</div><div class="grid">${parqOrdenado}</div></div>

          <div class="b"><div class="t">7. NUTRICIÓN</div>
            <div class="dato"><b>Objetivo:</b> ${c.nutricion?.objetivo}</div>
            <div class="dato"><b>Actual:</b> ${c.nutricion?.descAct}</div>
            <div class="dato">Alcohol: ${c.nutricion?.alcoholFreq || 'No'} | Sustancias: ${c.nutricion?.sustFreq || 'No'}</div>
          </div>

          <div class="b"><div class="t">8. FRECUENCIA ALIMENTOS</div><div class="grid">
            ${Object.entries(c.frecuenciaAlimentos || {}).map(([a, f]) => `<div class="dato">${a}: ${f}</div>`).join('')}
          </div></div>

          <div class="b"><div class="t">9/10. CONSENTIMIENTO</div><p style="font-size:9px">Aceptó Términos, Condiciones y Aviso de Privacidad.</p></div>

          <div class="firma">
            ${c.firma?.includes('data:image') ? `<img src="${c.firma}" class="firma-img" />` : `<h3>${c.firma}</h3>`}
            <p style="font-size:10px">FIRMA DIGITAL DEL CLIENTE</p>
          </div>

          <script>window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 600); };</script>
        </body>
      </html>
    `;
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
          <Pressable onPress={() => generarPDFReal(c)} style={styles.btnPdfAccion}><FontAwesome5 name="file-pdf" size={16} color="#fff" /><Text style={{color:'#fff', fontWeight:'bold', marginLeft:10}}>DESCARGAR PDF</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.reporteScroll}>
          <View style={styles.hojaFisica}>
            <Text style={styles.headerClinico}>INNERARTH COACHING</Text>
            <Text style={styles.subHeader}>EXPEDIENTE - {c.nombre?.toUpperCase()}</Text>
            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>1. DATOS PERSONALES</Text><View style={styles.fila}><ItemDato label="Nombre" value={c.nombre} /><ItemDato label="Peso" value={c.datosFisicos?.peso} /></View></View>
            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>2. MEDIDAS</Text><View style={styles.gridMedidas}><ItemDato label="Cintura" value={c.medidas?.cintura} /><ItemDato label="Cadera" value={c.medidas?.cadera} /></View></View>
            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>7. NUTRICIÓN</Text><Text style={styles.textoArea}>{c.nutricion?.descAct}</Text></View>
            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>10. FIRMA</Text>{c.firma?.includes('data:image') ? <Image source={{ uri: c.firma }} style={styles.firmaImagen} resizeMode="contain" /> : <Text style={styles.firmaNombre}>{c.firma}</Text>}</View>
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
  headerClinico: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subHeader: { fontSize: 10, color: '#64748b', textAlign: 'center', marginBottom: 30 },
  bloque: { marginBottom: 25, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 15 },
  bloqueTitulo: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  gridMedidas: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  itemDato: { minWidth: 140, marginBottom: 5 },
  itemLabel: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  itemValue: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
  textoArea: { backgroundColor: '#f8fafc', padding: 10, fontSize: 12, fontStyle: 'italic', marginTop: 5 },
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