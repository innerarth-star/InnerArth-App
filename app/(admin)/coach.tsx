import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ExpedienteDetalle from './ExpedienteDetalle';

export default function CoachPanel() {
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);
  
  // Lista de ejemplo (Aquí conectarás tu Firebase/API después)
  const [clientes, setClientes] = useState([
    { id: '1', nombre: 'Juan Pérez', datosFisicos: { edad: 58 }, objetivo: 'Bajar Grasa' },
    { id: '2', nombre: 'María García', datosFisicos: { edad: 34 }, objetivo: 'Ganar Músculo' },
  ]);

  // Si hay un alumno seleccionado, mostramos el detalle a pantalla completa
  if (alumnoSeleccionado) {
    return (
      <ExpedienteDetalle 
        alumno={alumnoSeleccionado}
        onClose={() => setAlumnoSeleccionado(null)}
        onAccept={() => {
          alert("¡Aceptado! Ahora redirigiendo a creación de plan...");
          setAlumnoSeleccionado(null);
        }}
        onReject={() => {
          alert("Cuestionario rechazado.");
          setAlumnoSeleccionado(null);
        }}
      />
    );
  }

  // Si no hay seleccionado, mostramos la lista de pendientes
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel del Coach</Text>
      </View>
      
      <FlatList
        data={clientes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.clienteCard}
            onPress={() => setAlumnoSeleccionado(item)}
          >
            <View>
              <Text style={styles.clienteNombre}>{item.nombre}</Text>
              <Text style={styles.clienteMeta}>{item.objetivo}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  clienteCard: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  clienteNombre: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  clienteMeta: { fontSize: 13, color: '#64748b', marginTop: 4 }
});