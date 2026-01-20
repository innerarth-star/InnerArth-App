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
      .map(key => `<div class="dato"><b>P${key.replace('p','')}:</b> ${c.salud.parq[key]}</div>`).join('');

    const frecuenciaHtml = Object.entries(c.frecuenciaAlimentos || {})
      .map(([a, f]) => `<div class="dato"><b>${a}:</b> ${f}</div>`).join('');

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.4; }
            .h { text-align: center; border-bottom: 4px solid #1e293b; margin-bottom: 30px; }
            .bloque { margin-bottom: 20px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; page-break-inside: avoid; }
            .tit { background: #1e293b; color: white; padding: 8px 12px; font-size: 13px; font-weight: bold; margin: -15px -15px 15px -15px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
            .dato { font-size: 11px; margin-bottom: 4px; }
            .area { background: #f8fafc; padding: 10px; font-size: 11px; font-style: italic; border-radius: 4px; margin-top: 5px; }
            .firma-box { text-align: center; margin-top: 40px; page-break-inside: avoid; }
            .f-img { max-width: 200px; border-bottom: 2px solid #000; }
          </style>
        </head>
        <body>
          <div class="h"><h2>INNERARTH COACHING</h2><p>REPORTE TÉCNICO COMPLETO - EXPEDIENTE</p></div>
          <div class="bloque"><div class="tit">1. DATOS PERSONALES</div><div class="grid"><div class="dato"><b>Nombre:</b> ${c.nombre}</div><div class="dato"><b>Email:</b> ${c.email}</div><div class="dato"><b>Tel:</b> ${c.telefono}</div><div class="dato"><b>Edad:</b> ${c.datosFisicos?.edad}</div><div class="dato"><b>Peso:</b> ${c.datosFisicos?.peso}kg</div><div class="dato"><b>Altura:</b> ${c.datosFisicos?.altura}cm</div><div class="dato"><b>Género:</b> ${c.datosFisicos?.genero}</div></div></div>
          <div class="bloque"><div class="tit">2. MEDIDAS CORPORALES (CM)</div><div class="grid">${Object.entries(c.medidas || {}).map(([k,v])=>`<div class="dato"><b>${k}:</b> ${v}</div>`).join('')}</div></div>
          <div class="bloque"><div class="tit">3. CICLO MENSTRUAL</div><div class="dato">${c.datosFisicos?.genero === 'mujer' ? `<b>Tipo:</b> ${c.ciclo?.tipo} | <b>Anticonceptivo:</b> ${c.ciclo?.anticonceptivo}` : 'N/A'}</div></div>
          <div class="bloque"><div class="tit">4. HISTORIAL DE SALUD</div><div class="dato"><b>Enf. Familiares:</b> ${c.salud?.enfFam?.join(', ') || 'Ninguna'}</div><div class="dato"><b>Enf. Propias:</b> ${c.salud?.enfPers?.join(', ') || 'Ninguna'}</div><div class="dato"><b>¿Lesión?:</b> ${c.salud?.lesion === 'si' ? c.salud.detalleLesion : 'No'}</div><div class="dato"><b>¿Operación?:</b> ${c.salud?.operacion === 'si' ? c.salud.detalleOperacion : 'No'}</div><div class="dato"><b>FCR:</b> ${c.salud?.frecuenciaCardiaca} lpm</div></div>
          <div class="bloque"><div class="tit">5. ESTILO DE VIDA (IPAQ)</div><div class="grid"><div class="dato">Vigorosa: ${c.ipaq?.vDias}d/${c.ipaq?.vMin}m</div><div class="dato">Moderada: ${c.ipaq?.mDias}d/${c.ipaq?.mMin}m</div><div class="dato">Caminata: ${c.ipaq?.cDias}d/${c.ipaq?.cMin}m</div><div class="dato">Sentado: ${c.ipaq?.sentado}</div><div class="dato">Sueño: ${c.ipaq?.horasSueno}h</div></div></div>
          <div class="bloque"><div class="tit">6. CUESTIONARIO PAR-Q</div><div class="grid">${parqOrdenado}</div></div>
          <div class="bloque"><div class="tit">7. NUTRICIÓN Y HÁBITOS</div><div class="dato"><b>Objetivo:</b> ${c.nutricion?.objetivo}</div><div class="area"><b>Dieta Actual:</b> ${c.nutricion?.descAct}</div><div class="grid"><div class="dato"><b>Comidas Hoy:</b> ${c.nutricion?.comidasAct}</div><div class="dato"><b>Deseadas:</b> ${c.nutricion?.comidasDes}</div><div class="dato"><b>Entrenos:</b> ${c.nutricion?.entrenos}</div><div class="dato"><b>Alcohol:</b> ${c.nutricion?.alcohol === 'si' ? c.nutricion.alcoholFreq : 'No'}</div><div class="dato"><b>Sustancias:</b> ${c.nutricion?.sust === 'si' ? c.nutricion.sustFreq : 'No'}</div></div></div>
          <div class="bloque"><div class="tit">8. FRECUENCIA DE ALIMENTOS</div><div class="grid">${frecuenciaHtml}</div></div>
          <div class="bloque"><div class="tit">9. CONSENTIMIENTO</div><div class="dato">El usuario aceptó los Términos, Condiciones y el Aviso de Privacidad de InnerArth.</div></div>
          <div class="bloque"><div class="tit">10. FIRMA DIGITAL</div><div class="firma-box">${c.firma?.includes('data:image') ? `<img src="${c.firma}" class="f-img"/>` : `<h3>${c.firma}</h3>`}</div></div>
          <script>window.onload = function(){ setTimeout(()=> { window.print(); window.close(); }, 700); };</script>
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
          <Pressable onPress={() => generarPDFReal(c)} style={styles.btnPdfAccion}><FontAwesome5 name="file-pdf" size={16} color="#fff" /><Text style={{color:'#fff', fontWeight:'bold', marginLeft:10}}>DESCARGAR EXPEDIENTE COMPLETO</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.reporteScroll}>
          <View style={styles.hojaFisica}>
            <Text style={styles.headerClinico}>INNERARTH RECOMPOSICIÓN CORPORAL</Text>
            
            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>1. DATOS PERSONALES</Text>
              <View style={styles.fila}><ItemDato label="Nombre" value={c.nombre} /><ItemDato label="Teléfono" value={c.telefono} /></View>
              <View style={styles.fila}><ItemDato label="Edad" value={c.datosFisicos?.edad} /><ItemDato label="Género" value={c.datosFisicos?.genero} /></View>
              <View style={styles.fila}><ItemDato label="Peso (kg)" value={c.datosFisicos?.peso} /><ItemDato label="Altura (cm)" value={c.datosFisicos?.altura} /></View>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>2. MEDIDAS CORPORALES</Text>
              <View style={styles.gridMedidas}>{Object.entries(c.medidas || {}).map(([k,v])=><ItemDato key={k} label={k} value={v} />)}</View>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>3. CICLO MENSTRUAL</Text>
              {c.datosFisicos?.genero === 'mujer' ? (
                <View style={styles.fila}><ItemDato label="Tipo" value={c.ciclo?.tipo} /><ItemDato label="Anticonceptivo" value={c.ciclo?.anticonceptivo} /></View>
              ) : <Text style={styles.itemValue}>No aplica</Text>}
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>4. HISTORIAL DE SALUD</Text>
              <ItemDato label="Enfermedades Familiares" value={c.salud?.enfFam?.join(', ')} />
              <ItemDato label="Enfermedades Propias" value={c.salud?.enfPers?.join(', ')} />
              <View style={styles.fila}><ItemDato label="¿Lesión?" value={c.salud?.lesion === 'si' ? c.salud.detalleLesion : 'No'} /><ItemDato label="¿Operación?" value={c.salud?.operacion === 'si' ? c.salud.detalleOperacion : 'No'} /></View>
              <ItemDato label="Frecuencia Cardíaca (FCR)" value={c.salud?.frecuenciaCardiaca} />
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>5. ESTILO DE VIDA (IPAQ)</Text>
              <View style={styles.gridMedidas}>
                <ItemDato label="Vigorosa" value={`${c.ipaq?.vDias}d / ${c.ipaq?.vMin}m`} /><ItemDato label="Moderada" value={`${c.ipaq?.mDias}d / ${c.ipaq?.mMin}m`} />
                <ItemDato label="Caminata" value={`${c.ipaq?.cDias}d / ${c.ipaq?.cMin}m`} /><ItemDato label="Sentado" value={c.ipaq?.sentado} />
                <ItemDato label="Sueño" value={c.ipaq?.horasSueno} />
              </View>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>6. CUESTIONARIO PAR-Q</Text>
              <View style={styles.gridMedidas}>{Object.keys(c.salud?.parq || {}).sort().map(k=><ItemDato key={k} label={k.toUpperCase()} value={c.salud.parq[k]} />)}</View>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>7. NUTRICIÓN Y HÁBITOS</Text>
              <ItemDato label="Objetivo" value={c.nutricion?.objetivo} />
              <Text style={styles.textoArea}>{c.nutricion?.descAct}</Text>
              <View style={styles.gridMedidas}>
                <ItemDato label="Comidas Hoy" value={c.nutricion?.comidasAct} /><ItemDato label="Deseadas" value={c.nutricion?.comidasDes} />
                <ItemDato label="Entrenos/Sem" value={c.nutricion?.entrenos} />
                <ItemDato label="Alcohol" value={c.nutricion?.alcohol === 'si' ? c.nutricion.alcoholFreq : 'No'} />
                <ItemDato label="Sustancias" value={c.nutricion?.sust === 'si' ? c.nutricion.sustFreq : 'No'} />
              </View>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>8. FRECUENCIA DE ALIMENTOS</Text>
              <View style={styles.gridMedidas}>{Object.entries(c.frecuenciaAlimentos || {}).map(([a,f])=><ItemDato key={a} label={a} value={f} />)}</View>
            </View>

            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>9. CONSENTIMIENTO</Text><Text style={styles.itemValue}>Términos y Condiciones Aceptados conforme al Index.</Text></View>
            <View style={styles.bloque}><Text style={styles.bloqueTitulo}>10. FIRMA</Text>
              {c.firma?.includes('data:image') ? <Image source={{ uri: c.firma }} style={styles.firmaImagen} resizeMode="contain" /> : <Text style={styles.firmaNombre}>{c.firma}</Text>}
            </View>

            <View style={styles.accionesFinales}>
              <Pressable style={styles.btnRechazar} onPress={() => gestionarCliente('rechazar')}><Text style={{color:'#ef4444', fontWeight:'bold'}}>ELIMINAR SOLICITUD</Text></Pressable>
              <Pressable style={styles.btnAceptar} onPress={() => gestionarCliente('aceptar')}><Text style={{color:'#fff', fontWeight:'bold'}}>ACEPTAR ALUMNO</Text></Pressable>
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
  headerClinico: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 25, color: '#1e293b' },
  bloque: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 20 },
  bloqueTitulo: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  gridMedidas: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  itemDato: { minWidth: 140, marginBottom: 8 },
  itemLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  itemValue: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  textoArea: { backgroundColor: '#f8fafc', padding: 15, fontSize: 13, fontStyle: 'italic', marginVertical: 10, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#cbd5e1' },
  firmaImagen: { width: 200, height: 80, marginTop: 15 },
  firmaNombre: { fontSize: 24, fontStyle: 'italic', marginTop: 15, color: '#1e293b' },
  accionesFinales: { flexDirection: 'row', gap: 15, marginTop: 40, paddingTop: 20, borderTopWidth: 2, borderTopColor: '#f1f5f9' },
  btnAceptar: { flex: 2, backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnRechazar: { flex: 1, backgroundColor: '#fff', padding: 18, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  cardLista: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  nombreLista: { fontWeight: 'bold', fontSize: 17 },
  emailLista: { fontSize: 13, color: '#64748b' }
});