import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
// Importación faltante:
import { FontAwesome5 } from '@expo/vector-icons';

const BIBLIOTECA_EXTENSA = [
  // PECHO
  { nombre: "Press de Banca Plano con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Press de Banca Inclinado con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Press de Banca Declinado con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Press con Mancuernas Plano", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press con Mancuernas Inclinado", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Aperturas con Mancuernas Planas", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Aperturas con Mancuernas Inclinadas", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Cruces en Polea Alta", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Cruces en Polea Baja", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Peck Deck (Máquina de Aperturas)", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Push-ups (Lagartijas) Estándar", grupo: "Pecho", tipo: "Calistenia" },
  { nombre: "Push-ups Diamante", grupo: "Pecho", tipo: "Calistenia" },
  { nombre: "Press en Máquina Hammer Horizontal", grupo: "Pecho", tipo: "Fuerza" },

  // ESPALDA
  { nombre: "Peso Muerto Convencional", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Dominadas Pronas (Pull-ups)", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Dominadas Supinas (Chin-ups)", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Jalón al Pecho Agarre Ancho", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Jalón al Pecho Agarre Neutro", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo con Barra", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Remo con Mancuerna a una mano", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo Gironda (Polea Baja)", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo en T con Barra", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Pull-over con Polea Alta", grupo: "Espalda", tipo: "Aislamiento" },
  { nombre: "Pull-over con Mancuerna", grupo: "Espalda", tipo: "Aislamiento" },
  { nombre: "Rack Pulls", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Remo en Máquina Articulada", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Face Pulls", grupo: "Espalda Alta/Hombro", tipo: "Salud" },

  // PIERNAS
  { nombre: "Sentadilla Libre con Barra", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Sentadilla Frontal", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Sentadilla Búlgara", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla Hack", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Prensa de Piernas 45 grados", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Extensiones de Cuádriceps", grupo: "Pierna", tipo: "Aislamiento" },
  { nombre: "Zancadas Caminando", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Hip Thrust con Barra", grupo: "Glúteo", tipo: "Fuerza" },
  { nombre: "Peso Muerto Rumano", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Curl Femoral Tumbado", grupo: "Femoral", tipo: "Aislamiento" },
  { nombre: "Elevación de Talones de Pie", grupo: "Pantorrilla", tipo: "Aislamiento" },
  { nombre: "Elevación de Talones Sentado", grupo: "Pantorrilla", tipo: "Aislamiento" },

  // HOMBROS
  { nombre: "Press Militar Barra de Pie", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Press Militar Mancuernas Sentado", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Press Arnold", grupo: "Hombro", tipo: "Hipertrofia" },
  { nombre: "Elevaciones Laterales", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Elevaciones Frontales", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Vuelos Posteriores (Pájaros)", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Remo al Mentón", grupo: "Hombro", tipo: "Fuerza" },

  // BRAZOS
  { nombre: "Curl Bíceps Barra EZ", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Bíceps Mancuernas", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Martillo", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Banco Scott", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Press Francés Barra EZ", grupo: "Tríceps", tipo: "Fuerza" },
  { nombre: "Extensiones Polea Alta (Cuerda)", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Copa de Tríceps", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Fondos en Paralelas", grupo: "Tríceps", tipo: "Fuerza" },

  // ABDOMEN
  { nombre: "Crunch Abdominal Suelo", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Elevación de Piernas Colgado", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Plancha (Plank) Frontal", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Russian Twists", grupo: "Abdomen", tipo: "Core" },

  // CARDIO
  { nombre: "Cinta de Correr", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Bicicleta Estática", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Saltar la Cuerda", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Burpees", grupo: "Cardio", tipo: "HIIT" }
];

export default function AdminEjercicios() {
  const cargar = async () => {
    try {
      for (const ej of BIBLIOTECA_EXTENSA) {
        const id = ej.nombre.toLowerCase().replace(/ /g, "_").replace(/\//g, "-");
        await setDoc(doc(db, "ejercicios", id), ej);
      }
      Alert.alert("¡Éxito!", "Se han cargado 100 ejercicios a tu Firebase.");
    } catch (e) {
      Alert.alert("Error", "No se pudieron cargar los datos.");
    }
  };

  return (
    <View style={styles.container}>
      <FontAwesome5 name="dumbbell" size={50} color="#1e293b" />
      <Text style={styles.title}>Carga de Ejercicios</Text>
      <Text style={styles.subtitle}>Presiona el botón para llenar tu base de datos profesional.</Text>
      
      <TouchableOpacity onPress={cargar} style={styles.btn}>
        <Text style={styles.btnText}>CARGAR 100 EJERCICIOS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#f1f5f9' },
  title: { fontSize: 22, fontWeight: 'bold', marginVertical: 20 },
  subtitle: { textAlign: 'center', marginBottom: 30, color: '#64748b' },
  btn: { backgroundColor: '#22c55e', padding: 20, borderRadius: 20, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});