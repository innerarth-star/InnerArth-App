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
        await addDoc(collection(db, "alumnos_activos"), { ...clienteSeleccionado, fechaAceptado: serverTimestamp() });
      }
      await deleteDoc(doc(db, "revisiones_pendientes", clienteSeleccionado.id));
      setClienteSeleccionado(null);
    } catch (e) { console.log(e); }
  };

  const BloqueReporte = ({ num, title, icon, color, children }: any) => (
    <View style={styles.bloque}>
      <View style={[styles.bloqueHeader, { borderBottomColor: color }]}>
        <Text style={[styles.bloqueNum, { color: color }]}>{num}.</Text>
        <Text style={[styles.bloqueTitle, { color: color }]}>{title.toUpperCase()}</Text>
      </View>
      <View style={styles.bloqueContent}>{children}</View>
    </View>
  );

  const ItemDato = ({ label, value }: any) => (
    <View style={styles.itemDato}>
      <Text style={styles.itemLabel}>{label}:</Text>
      <Text style={styles.itemValue}>{value || '—'}</Text>
    </View>
  );

  if (clienteSeleccionado) {
    const c = clienteSeleccionado;
    return (
      <SafeAreaView style={styles.container}>
        {/* Barra de herramientas - Se oculta al imprimir en Web */}
        <View style={styles.toolbar}>
          <Pressable onPress={() => setClienteSeleccionado(null)} style={styles.btnNav}>
            <FontAwesome5 name="chevron-left" size={14} color="#334155" />
            <Text style={styles.btnNavText}> Regresar</Text>
          </Pressable>
          <Pressable onPress={() => window.print()} style={styles.btnPdfAccion}>
            <FontAwesome5 name="print" size={16} color="#fff" />
            <Text style={{color:'#fff', fontWeight:'bold', marginLeft:10}}>IMPRIMIR EXPEDIENTE</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.reporteScroll}>
          <View style={styles.hojaFisica}>
            
            <View style={styles.encabezadoClinico}>
              <Text style={styles.clinicaNombre}>INNERARTH <Text style={{fontWeight:'300'}}>COACHING</Text></Text>
              <Text style={styles.clinicaDoc}>EXPEDIENTE DE RECOMPOSICIÓN CORPORAL</Text>
            </View>

            {/* BLOQUE 1 */}
            <BloqueReporte num="1" title="Datos Personales" color="#3b82f6">
              <View style={styles.fila}>
                <ItemDato label="Nombre" value={c.nombre} />
                <ItemDato label="Edad" value={c.datosFisicos?.edad} />
              </View>
              <View style={styles.fila}>
                <ItemDato label="Peso" value={`${c.datosFisicos?.peso} kg`} />
                <ItemDato label="Estatura" value={`${c.datosFisicos?.altura} cm`} />
              </View>
            </BloqueReporte>

            {/* BLOQUE 2 */}
            <BloqueReporte num="2" title="Medidas Corporales (CM)" color="#10b981">
              <View style={styles.grid3}>
                <ItemDato label="Cuello" value={c.medidas?.cuello} />
                <ItemDato label="Pecho" value={c.medidas?.pecho} />
                <ItemDato label="Cintura" value={c.medidas?.cintura} />
                <ItemDato label="Cadera" value={c.medidas?.cadera} />
                <ItemDato label="Brazo R" value={c.medidas?.brazoR} />
                <ItemDato label="Brazo F" value={c.medidas?.brazoF} />
              </View>
            </BloqueReporte>

            {/* BLOQUE 3 */}
            {c.datosFisicos?.genero === 'mujer' && (
              <BloqueReporte num="3" title="Ciclo Menstrual" color="#ec4899">
                <ItemDato label="Tipo" value={c.ciclo?.tipo} />
                <ItemDato label="Anticonceptivo" value={c.ciclo?.anticonceptivo} />
              </BloqueReporte>
            )}

            {/* BLOQUE 4 */}
            <BloqueReporte num="4" title="Historial Salud" color="#ef4444">
              <ItemDato label="Enfermedades Familiares" value={c.salud?.enfFam?.join(', ')} />
              <ItemDato label="Enfermedades Propias" value={c.salud?.enfPers?.join(', ')} />
              <ItemDato label="Lesiones/Operaciones" value={`${c.salud?.lesion==='si'?c.salud.detalleLesion:'No'} / ${c.salud?.operacion==='si'?c.salud.detalleOperacion:'No'}`} />
            </BloqueReporte>

            {/* BLOQUE 5 */}
            <BloqueReporte num="5" title="Estilo de Vida (IPAQ)" color="#f59e0b">
              <View style={styles.fila}>
                <ItemDato label="Horas Sentado" value={c.ipaq?.sentado} />
                <ItemDato label="Horas Sueño" value={c.ipaq?.horasSueno} />
              </View>
            </BloqueReporte>

            {/* BLOQUE 6 (PAR-Q) */}
            <BloqueReporte num="6" title="Cuestionario PAR-Q" color="#0ea5e9">
              {Object.entries(c.salud?.parq || {}).map(([key, val]: any) => (
                <Text key={key} style={styles.txtMini}>• Pregunta {key}: <Text style={{fontWeight:'bold'}}>{val.toUpperCase()}</Text></Text>
              ))}
            </BloqueReporte>

            {/* BLOQUE 7 */}
            <BloqueReporte num="7" title="Nutrición y Hábitos" color="#8b5cf6">
              <ItemDato label="Objetivo" value={c.nutricion?.objetivo} />
              <Text style={styles.labelBloque}>Dieta Actual:</Text>
              <Text style={styles.txtArea}>{c.nutricion?.descAct}</Text>
            </BloqueReporte>

            {/* BLOQUE 8 (Frecuencia) */}
            <BloqueReporte num="8" title="Frecuencia Alimentos" color="#10b981">
              <View style={styles.grid3}>
                {Object.entries(c.frecuenciaAlimentos || {}).map(([ali, freq]: any) => (
                  <ItemDato key={ali} label={ali} value={freq} />
                ))}
              </View>
            </BloqueReporte>

            {/* BLOQUE 9 Y 10 */}
            <BloqueReporte num="9/10" title="Consentimiento y Firma" color="#1e293b">
              <Text style={styles.txtMini}>El cliente acepta términos, condiciones y aviso de privacidad.</Text>
              {c.firma?.includes('data:image') ? (
                <Image source={{ uri: c.firma }} style={styles.imgFirma} />
              ) : <Text style={styles.firmaNombre}>{c.firma}</Text>}
            </BloqueReporte>

            {/* ACCIONES - NO SALEN EN PDF */}
            <View style={styles.footerAcciones}>
              <Pressable style={styles.btnR} onPress={() => gestionarCliente('rechazar')}>
                <Text style={{color:'#ef4444', fontWeight:'bold'}}>RECHAZAR</Text>
              </Pressable>
              <Pressable style={styles.btnA} onPress={() => gestionarCliente('aceptar')}>
                <Text style={{color:'#fff', fontWeight:'bold'}}>ACEPTAR Y GUARDAR</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerLista}>
        <Text style={styles.titleLista}>Revisiones Pendientes</Text>
        <Pressable onPress={() => signOut(auth)}><Text style={{color:'#ef4444'}}>Salir</Text></Pressable>
      </View>
      <FlatList
        data={clientes}
        keyExtractor={(i) => i.id}
        renderItem={({item}) => (
          <Pressable style={styles.itemLista} onPress={() => setClienteSeleccionado(item)}>
            <Text style={{fontWeight:'bold'}}>{item.nombre}</Text>
            <FontAwesome5 name="chevron-right" size={12} color="#ccc" />
          </Pressable>
        )}
        contentContainerStyle={{padding: 20}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  toolbar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 15, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0' 
  },
  btnNav: { flexDirection: 'row', alignItems: 'center' },
  btnNavText: { color: '#334155', fontWeight: 'bold' },
  btnPdfAccion: { 
    backgroundColor: '#1e293b', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 8, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  
  reporteScroll: { paddingVertical: 20 },
  hojaFisica: { 
    backgroundColor: '#fff', 
    width: '95%', 
    maxWidth: 800, 
    alignSelf: 'center', 
    padding: 40, 
    borderRadius: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10 
  },
  
  encabezadoClinico: { 
    borderBottomWidth: 3, 
    borderBottomColor: '#1e293b', 
    paddingBottom: 10, 
    marginBottom: 20, 
    alignItems: 'center' 
  },
  clinicaNombre: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  clinicaDoc: { fontSize: 10, color: '#64748b', marginTop: 5, fontWeight: 'bold' },

  bloque: { marginBottom: 20 },
  bloqueHeader: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    paddingBottom: 5, 
    marginBottom: 10 
  },
  bloqueNum: { fontWeight: '900', marginRight: 10 },
  bloqueTitle: { fontWeight: 'bold', fontSize: 12 },
  bloqueContent: { paddingLeft: 20 },

  fila: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 5 
  },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  itemDato: { marginBottom: 8, minWidth: 120 },
  itemLabel: { 
    fontSize: 9, 
    color: '#94a3b8', 
    fontWeight: 'bold', 
    textTransform: 'uppercase' 
  },
  itemValue: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
  
  txtArea: { 
    backgroundColor: '#f8fafc', 
    padding: 10, 
    fontSize: 12, 
    fontStyle: 'italic', 
    color: '#475569' 
  },
  labelBloque: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', marginBottom: 5 },
  txtMini: { fontSize: 11, color: '#64748b', marginBottom: 3 },
  
  imgFirma: { width: 150, height: 60, marginTop: 10, resizeMode: 'contain' },
  firmaNombre: { fontSize: 20, fontStyle: 'italic', marginTop: 10 },

  footerAcciones: { 
    flexDirection: 'row', 
    gap: 15, 
    marginTop: 30, 
    paddingTop: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9' 
  },
  btnA: { 
    flex: 2, 
    backgroundColor: '#10b981', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  btnR: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#ef4444' 
  },

  headerLista: { 
    backgroundColor: '#fff', 
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderBottomWidth: 1, 
    borderColor: '#eee' 
  },
  titleLista: { fontSize: 18, fontWeight: 'bold' },
  itemLista: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderColor: '#eee' 
  },
  vacio: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});