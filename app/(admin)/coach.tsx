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

  // --- FUNCIÓN MAESTRA DE PDF (HTML REAL MULTIPÁGINA) ---
  const generarPDFReal = (c: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Expediente - ${c.nombre}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { text-align: center; border-bottom: 4px solid #1e293b; padding-bottom: 10px; margin-bottom: 30px; }
            .bloque { margin-bottom: 20px; page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            .bloque-title { background: #1e293b; color: white; padding: 8px 15px; font-size: 14px; font-weight: bold; text-transform: uppercase; }
            .bloque-content { padding: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .dato { font-size: 12px; }
            .label { color: #64748b; font-weight: bold; font-size: 10px; text-transform: uppercase; display: block; }
            .full-width { grid-column: span 2; }
            .firma-box { margin-top: 40px; text-align: center; page-break-inside: avoid; }
            .firma-img { max-width: 250px; height: auto; border-bottom: 2px solid #000; }
            @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin:0;">INNERARTH COACHING</h1>
            <p style="margin:5px 0; color: #64748b;">EXPEDIENTE TÉCNICO DE RECOMPOSICIÓN CORPORAL</p>
          </div>

          <div class="bloque">
            <div class="bloque-title">1. Datos Personales</div>
            <div class="bloque-content">
              <div class="dato"><span class="label">Nombre:</span> ${c.nombre}</div>
              <div class="dato"><span class="label">Edad:</span> ${c.datosFisicos?.edad} años</div>
              <div class="dato"><span class="label">Peso:</span> ${c.datosFisicos?.peso} kg</div>
              <div class="dato"><span class="label">Estatura:</span> ${c.datosFisicos?.altura} cm</div>
            </div>
          </div>

          <div class="bloque">
            <div class="bloque-title">2. Medidas Corporales (CM)</div>
            <div class="bloque-content">
              <div class="dato">Cuello: ${c.medidas?.cuello}</div><div class="dato">Pecho: ${c.medidas?.pecho}</div>
              <div class="dato">Cintura: ${c.medidas?.cintura}</div><div class="dato">Cadera: ${c.medidas?.cadera}</div>
              <div class="dato">Brazo R: ${c.medidas?.brazoR}</div><div class="dato">Brazo F: ${c.medidas?.brazoF}</div>
              <div class="dato">Muslo: ${c.medidas?.muslo}</div><div class="dato">Pierna: ${c.medidas?.pierna}</div>
            </div>
          </div>

          <div class="bloque">
            <div class="bloque-title">4. Historial de Salud</div>
            <div class="bloque-content">
              <div class="dato full-width"><span class="label">Enfermedades:</span> ${c.salud?.enfPers?.join(', ') || 'Ninguna'}</div>
              <div class="dato"><span class="label">Lesión:</span> ${c.salud?.lesion === 'si' ? c.salud.detalleLesion : 'No'}</div>
              <div class="dato"><span class="label">Operación:</span> ${c.salud?.operacion === 'si' ? c.salud.detalleOperacion : 'No'}</div>
            </div>
          </div>

          <div class="bloque">
            <div class="bloque-title">6. PAR-Q</div>
            <div class="bloque-content">
              ${Object.entries(c.salud?.parq || {}).map(([k, v]) => `<div class="dato"><span class="label">Pregunta ${k}:</span> ${v}</div>`).join('')}
            </div>
          </div>

          <div class="bloque">
            <div class="bloque-title">7. Nutrición y Hábitos</div>
            <div class="bloque-content">
              <div class="dato full-width"><span class="label">Objetivo:</span> ${c.nutricion?.objetivo}</div>
              <div class="dato full-width"><span class="label">Dieta Actual:</span> ${c.nutricion?.descAct}</div>
              <div class="dato">Alcohol: ${c.nutricion?.alcohol === 'si' ? c.nutricion.alcoholFreq : 'No'}</div>
              <div class="dato">Sustancias: ${c.nutricion?.sust === 'si' ? c.nutricion.sustFreq : 'No'}</div>
            </div>
          </div>

          <div class="bloque">
            <div class="bloque-title">8. Frecuencia de Alimentos</div>
            <div class="bloque-content">
              ${Object.entries(c.frecuenciaAlimentos || {}).map(([a, f]) => `<div class="dato">${a}: ${f}</div>`).join('')}
            </div>
          </div>

          <div class="firma-box">
            <p class="label">Firma de Conformidad</p>
            ${c.firma?.includes('data:image') ? `<img src="${c.firma}" class="firma-img" />` : `<h2>${c.firma}</h2>`}
          </div>

          <script>
            window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 500); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const ItemDato = ({ label, value }: any) => (
    <View style={styles.itemDato}>
      <Text style={styles.itemLabel}>{label}:</Text>
      <Text style={styles.itemValue}>{value || '—'}</Text>
    </View>
  );

  // --- VISTA EXPEDIENTE ---
  if (clienteSeleccionado) {
    const c = clienteSeleccionado;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.toolbar}>
          <Pressable onPress={() => setClienteSeleccionado(null)} style={styles.btnNav}>
            <FontAwesome5 name="arrow-left" size={14} color="#334155" />
            <Text style={{fontWeight:'bold', marginLeft:10}}>VOLVER</Text>
          </Pressable>
          <Pressable onPress={() => generarPDFReal(c)} style={styles.btnPdfAccion}>
            <FontAwesome5 name="file-pdf" size={16} color="#fff" />
            <Text style={{color:'#fff', fontWeight:'bold', marginLeft:10}}>PDF MULTIPÁGINA</Text>
          </Pressable>
        </View>

        <ScrollView style={{flex: 1}} contentContainerStyle={styles.reporteScroll}>
          <View style={styles.hojaFisica}>
            <Text style={styles.headerClinico}>INNERARTH COACHING</Text>
            <Text style={styles.subHeader}>EXPEDIENTE TÉCNICO - {c.nombre?.toUpperCase()}</Text>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>1. DATOS PERSONALES</Text>
              <View style={styles.fila}><ItemDato label="Nombre" value={c.nombre} /><ItemDato label="Edad" value={c.datosFisicos?.edad} /></View>
              <View style={styles.fila}><ItemDato label="Peso" value={c.datosFisicos?.peso} /><ItemDato label="Altura" value={c.datosFisicos?.altura} /></View>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>2. MEDIDAS</Text>
              <View style={styles.gridMedidas}><ItemDato label="Cintura" value={c.medidas?.cintura} /><ItemDato label="Cadera" value={c.medidas?.cadera} /><ItemDato label="Pecho" value={c.medidas?.pecho} /><ItemDato label="Brazo R" value={c.medidas?.brazoR} /></View>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>7. NUTRICIÓN</Text>
              <ItemDato label="Objetivo" value={c.nutricion?.objetivo} />
              <Text style={styles.textoArea}>{c.nutricion?.descAct}</Text>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>9 / 10. FIRMA</Text>
              {c.firma?.includes('data:image') ? <Image source={{ uri: c.firma }} style={styles.firmaImagen} resizeMode="contain" /> : <Text style={styles.firmaNombre}>{c.firma}</Text>}
            </View>

            <View style={styles.accionesFinales}>
              <Pressable style={styles.btnRechazar} onPress={() => gestionarCliente('rechazar')}><Text style={{color:'#ef4444', fontWeight:'bold'}}>BORRAR</Text></Pressable>
              <Pressable style={styles.btnAceptar} onPress={() => gestionarCliente('aceptar')}><Text style={{color:'#fff', fontWeight:'bold'}}>ACEPTAR ALUMNO</Text></Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- VISTA LISTA ---
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
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
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