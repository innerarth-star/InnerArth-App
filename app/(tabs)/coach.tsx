import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

export default function CoachPanel() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, "revisiones_pendientes"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClientes(docs);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Mis Alumnos</Text>
        <TouchableOpacity onPress={() => signOut(auth)}><MaterialCommunityIcons name="logout" size={24} color="#ef4444" /></TouchableOpacity>
      </View>
      
      <FlatList
        data={clientes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setClienteSeleccionado(item)}>
            <View style={{flex: 1}}>
              <Text style={styles.clientName}>{item.nombre}</Text>
              <Text style={styles.clientEmail}>{item.emailUsuario}</Text>
              <View style={styles.tag}><Text style={styles.tagText}>{item.plan?.objetivoDeseado || 'Sin objetivo'}</Text></View>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      />

      {/* MODAL DE DETALLES */}
      <Modal visible={!!clienteSeleccionado} animationType="slide">
        {clienteSeleccionado && (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ficha Técnica</Text>
              <TouchableOpacity onPress={() => setClienteSeleccionado(null)}><FontAwesome5 name="times" size={24} color="#000" /></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{padding: 20}}>
              <DetailBlock title="Datos Generales" icon="user">
                <Text style={styles.detailTxt}>Edad: {clienteSeleccionado.edad} años</Text>
                <Text style={styles.detailTxt}>Peso: {clienteSeleccionado.peso} kg | Altura: {clienteSeleccionado.altura} cm</Text>
                <Text style={styles.detailTxt}>Género: {clienteSeleccionado.genero}</Text>
              </DetailBlock>

              <DetailBlock title="Medidas (cm)" icon="ruler">
                <Text style={styles.detailTxt}>Cintura: {clienteSeleccionado.medidas?.cintura} | Cuello: {clienteSeleccionado.medidas?.cuello}</Text>
                <Text style={styles.detailTxt}>Brazo R/F: {clienteSeleccionado.medidas?.brazoR}/{clienteSeleccionado.medidas?.brazoF}</Text>
              </DetailBlock>

              <DetailBlock title="Salud y Lesiones" icon="heartbeat">
                <Text style={styles.detailTxt}>Lesiones: {clienteSeleccionado.plan?.tuvoLesion === 'si' ? clienteSeleccionado.plan?.detalleLesion : 'Ninguna'}</Text>
                <Text style={styles.detailTxt}>Operaciones: {clienteSeleccionado.plan?.tuvoOperacion === 'si' ? clienteSeleccionado.plan?.detalleOperacion : 'Ninguna'}</Text>
              </DetailBlock>

              <DetailBlock title="Objetivo" icon="bullseye">
                <Text style={styles.detailTxtBold}>{clienteSeleccionado.plan?.objetivoDeseado}</Text>
              </DetailBlock>

              <DetailBlock title="Firma del Cliente" icon="pen-fancy">
                 {/* Aquí se podría renderizar la firma si guardamos el base64 */}
                 <Text style={styles.detailTxt}>Documento firmado el {clienteSeleccionado.fechaConsentimiento}</Text>
              </DetailBlock>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const DetailBlock = ({ title, icon, children }: any) => (
  <View style={styles.detailBlock}>
    <View style={styles.detailBlockHeader}>
      <FontAwesome5 name={icon} size={16} color="#3b82f6" />
      <Text style={styles.detailBlockTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#1e293b' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  clientName: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  clientEmail: { fontSize: 13, color: '#64748b' },
  tag: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 5, alignSelf: 'flex-start' },
  tagText: { color: '#166534', fontSize: 10, fontWeight: 'bold' },
  modalContent: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingTop: 50 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  detailBlock: { marginBottom: 20, backgroundColor: '#f8fafc', padding: 15, borderRadius: 12 },
  detailBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  detailBlockTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  detailTxt: { fontSize: 14, color: '#475569', marginBottom: 3 },
  detailTxtBold: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' }
});