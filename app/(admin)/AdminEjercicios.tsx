import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

const BIBLIOTECA_EXTENSA = [
  // --- PECHO (35) ---
  { nombre: "Press de Banca Plano con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Press de Banca Inclinado con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Press de Banca Declinado con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Press con Mancuernas Plano", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press con Mancuernas Inclinado", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press con Mancuernas Declinado", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press Arnold para Pecho", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Aperturas con Mancuernas Planas", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Aperturas con Mancuernas Inclinadas", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Cruces en Polea Alta", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Cruces en Polea Media", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Cruces en Polea Baja", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Peck Deck (Fly Máquina)", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Press en Máquina Hammer Horizontal", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Press en Máquina Hammer Inclinado", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Press en Máquina Hammer Declinado", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Dips (Fondos) para Pecho", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Push-ups (Lagartijas) Estándar", grupo: "Pecho", tipo: "Calistenia" },
  { nombre: "Push-ups Diamante", grupo: "Pecho", tipo: "Calistenia" },
  { nombre: "Push-ups Inclinadas", grupo: "Pecho", tipo: "Calistenia" },
  { nombre: "Push-ups Declinadas", grupo: "Pecho", tipo: "Calistenia" },
  { nombre: "Push-ups con Palmada", grupo: "Pecho", tipo: "Potencia" },
  { nombre: "Press de Banca con Agarre Estrecho", grupo: "Pecho/Tríceps", tipo: "Fuerza" },
  { nombre: "Floor Press con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Floor Press con Mancuernas", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Svend Press con Disco", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Landmine Press a una mano", grupo: "Pecho/Hombro", tipo: "Funcional" },
  { nombre: "Press en Máquina Smith Plano", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press en Máquina Smith Inclinado", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Aperturas en Cable a una mano", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Chest Press Sentado (Máquina)", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Pullover con Mancuerna para Pecho", grupo: "Pecho", tipo: "Hipertrofia" },

  // --- ESPALDA (40) ---
  { nombre: "Peso Muerto Convencional", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Peso Muerto Sumo", grupo: "Espalda/Pierna", tipo: "Fuerza" },
  { nombre: "Dominadas Pronas (Pull-ups)", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Dominadas Supinas (Chin-ups)", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Dominadas Neutras", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Jalón al Pecho Agarre Ancho", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Jalón al Pecho Agarre Estrecho Neutro", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Jalón al Pecho Agarre Supino", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Jalón tras nuca", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo con Barra", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Remo con Mancuerna a una mano", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo Gironda (Polea Baja)", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo en T con Barra", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Remo Pendlay", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Remo con Soporte al Pecho (Mancuernas)", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo en Máquina Articulada", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Pull-over con Polea Alta (Brazos rectos)", grupo: "Espalda", tipo: "Aislamiento" },
  { nombre: "Pull-over con Mancuerna", grupo: "Espalda", tipo: "Aislamiento" },
  { nombre: "Rack Pulls", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Hiperextensiones", grupo: "Espalda Baja", tipo: "Salud" },
  { nombre: "Buenos Días con Barra", grupo: "Espalda Baja", tipo: "Fuerza" },
  { nombre: "Face Pulls", grupo: "Espalda Alta/Hombro", tipo: "Salud" },
  { nombre: "Remo Renegado", grupo: "Espalda/Core", tipo: "Funcional" },
  { nombre: "Remo con Banda Elástica", grupo: "Espalda", tipo: "Resistencia" },
  { nombre: "Remo Invertido en Rack", grupo: "Espalda", tipo: "Calistenia" },
  { nombre: "Jalón Unilateral en Polea", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo Seal (Foca)", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Superman (Lumbares)", grupo: "Espalda Baja", tipo: "Core" },

  // --- PIERNAS: CUÁDRICEPS Y GLÚTEO (45) ---
  { nombre: "Sentadilla Libre con Barra", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Sentadilla Frontal", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Sentadilla Búlgara", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla Hack", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla Goblet", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla en Máquina Smith", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Prensa de Piernas 45 grados", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Prensa Horizontal", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Extensiones de Cuádriceps", grupo: "Pierna", tipo: "Aislamiento" },
  { nombre: "Zancadas (Lunges) Caminando", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Zancadas Estáticas", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Zancadas Laterales", grupo: "Pierna", tipo: "Funcional" },
  { nombre: "Step Up (Subida al cajón)", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Pistol Squat", grupo: "Pierna", tipo: "Calistenia" },
  { nombre: "Sissy Squat", grupo: "Pierna", tipo: "Aislamiento" },
  { nombre: "Hip Thrust con Barra", grupo: "Glúteo", tipo: "Fuerza" },
  { nombre: "Hip Thrust Unilateral", grupo: "Glúteo", tipo: "Hipertrofia" },
  { nombre: "Puente de Glúteo (Glute Bridge)", grupo: "Glúteo", tipo: "Hipertrofia" },
  { nombre: "Patada de Glúteo en Polea", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Patada de Glúteo en Máquina", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Abducción de Cadera en Máquina", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Abducción de Cadera en Polea", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Clamshells (Almejas)", grupo: "Glúteo", tipo: "Fisioterapia" },
  { nombre: "Monster Walk con Banda", grupo: "Glúteo", tipo: "Funcional" },

  // --- PIERNAS: FEMORAL Y PANTORRILLA (30) ---
  { nombre: "Peso Muerto Rumano", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Peso Muerto Piernas Rígidas", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Curl Femoral Tumbado", grupo: "Femoral", tipo: "Aislamiento" },
  { nombre: "Curl Femoral Sentado", grupo: "Femoral", tipo: "Aislamiento" },
  { nombre: "Curl Femoral de Pie", grupo: "Femoral", tipo: "Aislamiento" },
  { nombre: "Curl Femoral con Fitball", grupo: "Femoral", tipo: "Core" },
  { nombre: "Nordic Curl", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Glute-Ham Raise", grupo: "Femoral/Glúteo", tipo: "Fuerza" },
  { nombre: "Elevación de Talones de Pie", grupo: "Pantorrilla", tipo: "Aislamiento" },
  { nombre: "Elevación de Talones Sentado", grupo: "Pantorrilla", tipo: "Aislamiento" },
  { nombre: "Elevación de Talones en Prensa", grupo: "Pantorrilla", tipo: "Aislamiento" },
  { nombre: "Elevación de Talón Unilateral", grupo: "Pantorrilla", tipo: "Aislamiento" },

  // --- HOMBROS (30) ---
  { nombre: "Press Militar con Barra de Pie", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Press Militar Mancuernas Sentado", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Press Arnold", grupo: "Hombro", tipo: "Hipertrofia" },
  { nombre: "Press de Hombros en Máquina", grupo: "Hombro", tipo: "Hipertrofia" },
  { nombre: "Elevaciones Laterales con Mancuerna", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Elevaciones Laterales en Polea", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Elevaciones Frontales con Barra", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Elevaciones Frontales con Mancuernas", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Elevaciones Frontales con Disco", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Vuelos Posteriores (Pájaros)", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Vuelos Posteriores en Máquina (Reverse Fly)", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Face Pulls con Cuerda", grupo: "Hombro/Espalda", tipo: "Salud" },
  { nombre: "Remo al Mentón con Barra", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Encogimientos de Hombros con Barra", grupo: "Trapecio", tipo: "Fuerza" },
  { nombre: "Encogimientos de Hombros con Mancuernas", grupo: "Trapecio", tipo: "Fuerza" },

  // --- BRAZOS (40) ---
  { nombre: "Curl de Bíceps con Barra EZ", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl de Bíceps con Barra Recta", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl de Bíceps Mancuernas (Supinando)", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Martillo con Mancuernas", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl de Bíceps en Banco Scott (Predicador)", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Curl de Bíceps Concentrado", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Curl Inclinado con Mancuernas", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl de Bíceps en Polea Baja", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Curl 21s", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl de Bíceps tipo Araña", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Press Francés con Barra EZ", grupo: "Tríceps", tipo: "Fuerza" },
  { nombre: "Press de Banca Agarre Cerrado", grupo: "Tríceps", tipo: "Fuerza" },
  { nombre: "Extensiones en Polea Alta (Cuerda)", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Extensiones en Polea Alta (Barra V)", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Extensiones tras nuca con Mancuerna (Copa)", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Patada de Tríceps con Mancuerna", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Fondos en Paralelas (Tríceps focus)", grupo: "Tríceps", tipo: "Fuerza" },
  { nombre: "Fondos entre Bancos", grupo: "Tríceps", tipo: "Hipertrofia" },
  { nombre: "Extensiones en Polea a una mano", grupo: "Tríceps", tipo: "Aislamiento" },

  // --- ABDOMEN (25) ---
  { nombre: "Crunch Abdominal", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Crunch en Polea Alta", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Elevación de Piernas Colgado", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Elevación de Piernas en Paralelas", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Plancha (Plank) Frontal", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Plancha Lateral", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Rueda Abdominal (Ab Wheel)", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Russian Twists", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Mountain Climbers", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Bicycle Crunches", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Deadbug", grupo: "Abdomen", tipo: "Core" },

  // --- CARDIO / HIIT (15) ---
  { nombre: "Cinta de Correr", grupo: "Cardio", tipo: "Resistencia" },
  { nombre: "Bicicleta Estática", grupo: "Cardio", tipo: "Resistencia" },
  { nombre: "Elíptica", grupo: "Cardio", tipo: "Resistencia" },
  { nombre: "Remo en Máquina", grupo: "Cardio", tipo: "Resistencia" },
  { nombre: "Salto a la Cuerda", grupo: "Cardio", tipo: "Resistencia" },
  { nombre: "Burpees", grupo: "Cuerpo Completo", tipo: "HIIT" },
  { nombre: "Jumping Jacks", grupo: "Cuerpo Completo", tipo: "HIIT" },
  { nombre: "Box Jumps (Salto al cajón)", grupo: "Pierna", tipo: "Potencia" }
];

export default function AdminEjercicios() {
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);

  const cargar = async () => {
    setCargando(true);
    setProgreso(0);
    try {
      let count = 0;
      for (const ej of BIBLIOTECA_EXTENSA) {
        const id = ej.nombre.toLowerCase().trim()
          .replace(/\s+/g, "_")
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
        await setDoc(doc(db, "ejercicios", id), ej);
        count++;
        setProgreso(Math.round((count / BIBLIOTECA_EXTENSA.length) * 100));
      }
      Alert.alert("¡Éxito!", `Se han cargado ${BIBLIOTECA_EXTENSA.length} ejercicios.`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <FontAwesome5 name="layer-group" size={60} color="#1e293b" />
      <Text style={styles.title}>Carga Maestra v2.0</Text>
      <Text style={styles.subtitle}>
        {cargando 
          ? `Subiendo base de datos: ${progreso}%` 
          : `Vas a cargar ${BIBLIOTECA_EXTENSA.length} ejercicios profesionales divididos por categorías.`}
      </Text>
      
      <TouchableOpacity 
        onPress={cargar} 
        style={[styles.btn, cargando && styles.btnDisabled]}
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>SUBIR BASE DE DATOS COMPLETA</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 15, color: '#0f172a' },
  subtitle: { textAlign: 'center', marginBottom: 40, color: '#64748b', lineHeight: 20 },
  btn: { backgroundColor: '#3b82f6', padding: 20, borderRadius: 20, width: '100%', alignItems: 'center' },
  btnDisabled: { backgroundColor: '#94a3b8' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});