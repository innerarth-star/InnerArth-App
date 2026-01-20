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

  // --- LÓGICA DE FLUJO: ACEPTAR O RECHAZAR ---
  const gestionarCliente = async (accion: 'aceptar' | 'rechazar') => {
    if (!clienteSeleccionado) return;
    
    try {
      if (accion === 'aceptar') {
        // 1. Lo movemos a la colección de Alumnos Activos
        await addDoc(collection(db, "alumnos_activos"), {
          ...clienteSeleccionado,
          fechaAceptado: serverTimestamp(),
          estadoPlan: 'pendiente_creacion' // Esto servirá para el siguiente módulo de planes
        });
      }
      // 2. Lo borramos de pendientes (sea aceptado o rechazado)
      await deleteDoc(doc(db, "revisiones_pendientes", clienteSeleccionado.id));
      setClienteSeleccionado(null);
      alert(accion === 'aceptar' ? "Cliente aceptado correctamente" : "Registro eliminado");
    } catch (e) {
      console.log(e);
    }
  };

  // --- COMPONENTE DE BLOQUE (Misma estética que el Index) ---
  const BloqueExpediente = ({ num, title, icon, color, children }: any) => (
    <View style={styles.cardExpediente}>
      <View style={[styles.cardHeader, { backgroundColor: color + '15', borderLeftColor: color }]}>
        <View style={[styles.numCircle, { backgroundColor: color }]}><Text style={styles.numText}>{num}</Text></View>
        <FontAwesome5 name={icon} size={14} color={color} />
        <Text style={[styles.cardTitle, { color: color }]}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );

  const InfoRow = ({ label, value }: { label: string, value: any }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value || 'Sin dato'}</Text>
    </View>
  );

  // --- VISTA DETALLE (RESPETANDO LOS BLOQUES DEL INDEX) ---
  if (clienteSeleccionado) {
    const c = clienteSeleccionado;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerDetalle}>
          <Pressable onPress={() => setClienteSeleccionado(null)} style={styles.btnVolver}>
            <FontAwesome5 name="chevron-left" size={16} color="#3b82f6" />
            <Text style={styles.txtVolver}> Volver</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Expediente Cliente</Text>
          <Pressable onPress={() => window.print()} style={styles.btnMiniPdf}>
            <FontAwesome5 name="file-pdf" size={16} color="#1e293b" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.mainWrapper}>
            
            <BloqueExpediente num={1} title="Datos Personales" icon="user" color="#3b82f6">
              <InfoRow label="Nombre" value={c.nombre} />
              <InfoRow label="Email" value={c.email} />
              <InfoRow label="Teléfono" value={c.telefono} />
              <View style={styles.row}>
                <InfoRow label="Edad" value={c.datosFisicos?.edad} />
                <InfoRow label="Género" value={c.datosFisicos?.genero} />
              </View>
              <View style={styles.row}>
                <InfoRow label="Peso" value={`${c.datosFisicos?.peso} kg`} />
                <InfoRow label="Altura" value={`${c.datosFisicos?.altura} cm`} />
              </View>
            </BloqueExpediente>

            <BloqueExpediente num={2} title="Medidas Corporales" icon="ruler-horizontal" color="#10b981">
              <View style={styles.gridMedidas}>
                <InfoRow label="Cuello" value={c.medidas?.cuello} />
                <InfoRow label="Pecho" value={c.medidas?.pecho} />
                <InfoRow label="Brazo R" value={c.medidas?.brazoR} />
                <InfoRow label="Brazo F" value={c.medidas?.brazoF} />
                <InfoRow label="Cintura" value={c.medidas?.cintura} />
                <InfoRow label="Cadera" value={c.medidas?.cadera} />
                <InfoRow label="Muslo" value={c.medidas?.muslo} />
                <InfoRow label="Pierna" value={c.medidas?.pierna} />
              </View>
            </BloqueExpediente>

            {c.datosFisicos?.genero === 'mujer' && (
              <BloqueExpediente num={3} title="Ciclo Menstrual" icon="venus" color="#ec4899">
                <InfoRow label="Tipo Ciclo" value={c.ciclo?.tipo} />
                <InfoRow label="Anticonceptivo" value={c.ciclo?.anticonceptivo} />
              </BloqueExpediente>
            )}

            <BloqueExpediente num={4} title="Historial Salud" icon="heartbeat" color="#ef4444">
              <InfoRow label="Enf. Fam" value={c.salud?.enfFam?.join(', ')} />
              <InfoRow label="Enf. Pers" value={c.salud?.enfPers?.join(', ')} />
              <InfoRow label="Lesión" value={c.salud?.lesion === 'si' ? c.salud.detalleLesion : 'No'} />
              <InfoRow label="Operación" value={c.salud?.operacion === 'si' ? c.salud.detalleOperacion : 'No'} />
              <InfoRow label="FCR" value={c.salud?.frecuenciaCardiaca} />
            </BloqueExpediente>

            <BloqueExpediente num={5} title="Estilo Vida (IPAQ)" icon="walking" color="#f59e0b">
              <InfoRow label="Horas sentado" value={c.ipaq?.sentado} />
              <InfoRow label="Horas sueño" value={c.ipaq?.horasSueno} />
            </BloqueExpediente>

            <BloqueExpediente num={7} title="Nutrición y Hábitos" icon="utensils" color="#8b5cf6">
              <InfoRow label="Objetivo" value={c.nutricion?.objetivo} />
              <Text style={styles.labelTextArea}>Dieta Actual:</Text>
              <Text style={styles.textArea}>{c.nutricion?.descAct}</Text>
              <View style={styles.row}>
                <InfoRow label="Alcohol" value={c.nutricion?.alcohol === 'si' ? c.nutricion.alcoholFreq : 'No'} />
                <InfoRow label="Fuma/Sust" value={c.nutricion?.sust === 'si' ? c.nutricion.sustFreq : 'No'} />
              </View>
            </BloqueExpediente>

            <BloqueExpediente num={9} title="Firma y Consentimiento" icon="file-signature" color="#1e293b">
              {c.firma?.includes('data:image') ? (
                <Image source={{ uri: c.firma }} style={styles.firmaImagen} resizeMode="contain" />
              ) : <Text style={styles.firmaTexto}>{c.firma}</Text>}
            </BloqueExpediente>

            {/* BOTONES DE ACCIÓN FINAL */}
            <View style={styles.accionesFinales}>
              <Pressable style={styles.btnRechazar} onPress={() => gestionarCliente('rechazar')}>
                <Text style={styles.txtW}>RECHAZAR / BORRAR</Text>
              </Pressable>
              <Pressable style={styles.btnAceptar} onPress={() => gestionarCliente('aceptar')}>
                <Text style={styles.txtW}>ACEPTAR CLIENTE</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- VISTA LISTA (COACH PANEL PRINCIPAL) ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.headerTitle}>Panel Coach</Text>
          <Pressable onPress={handleSignOut} style={styles.btnSalir}>
            <Text style={styles.txtSalir}>Salir </Text>
            <FontAwesome5 name="sign-out-alt" size={12} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      <View style={styles.mainWrapper}>
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 15 }}
          renderItem={({ item }) => (
            <Pressable style={styles.cardLista} onPress={() => setClienteSeleccionado(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.clienteNombre}>{item.nombre}</Text>
                <Text style={styles.clienteEmail}>{item.email}</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.vacio}>No hay revisiones pendientes</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', alignItems: 'center' },
  headerInner: { width: '100%', maxWidth: 800, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  btnSalir: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  txtSalir: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  mainWrapper: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  cardLista: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  clienteNombre: { fontWeight: 'bold', fontSize: 15, color: '#334155' },
  clienteEmail: { fontSize: 12, color: '#64748b' },
  scrollContent: { paddingBottom: 40 },
  headerDetalle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  btnVolver: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  txtVolver: { color: '#3b82f6', fontWeight: 'bold' },
  btnMiniPdf: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 8 },
  cardExpediente: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderLeftWidth: 4 },
  numCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { fontSize: 14, fontWeight: 'bold' },
  cardBody: { padding: 15 },
  infoRow: { marginBottom: 8, flex: 1 },
  infoLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  infoValue: { fontSize: 13, color: '#334155', fontWeight: '500' },
  row: { flexDirection: 'row', gap: 15 },
  gridMedidas: { flexDirection: 'row', flexWrap: 'wrap' },
  labelTextArea: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', marginTop: 10 },
  textArea: { fontSize: 13, color: '#475569', fontStyle: 'italic', marginVertical: 5 },
  firmaImagen: { width: '100%', height: 80, marginTop: 10 },
  firmaTexto: { fontSize: 18, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  accionesFinales: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnAceptar: { flex: 1, backgroundColor: '#10b981', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnRechazar: { flex: 1, backgroundColor: '#ef4444', padding: 15, borderRadius: 12, alignItems: 'center' },
  txtW: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  vacio: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});