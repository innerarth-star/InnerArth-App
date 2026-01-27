import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';

const BIBLIOTECA_COMPLETA = [
  // --- PECHO (35) ---
  { nombre: "Press de Banca Plano con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Press de Banca Inclinado con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Press de Banca Declinado con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Press con Mancuernas Plano", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press con Mancuernas Inclinado", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press con Mancuernas Declinado", grupo: "Pecho", tipo: "Hipertrofia" },
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
  { nombre: "Press de Banca Agarre Estrecho", grupo: "Pecho/Tríceps", tipo: "Fuerza" },
  { nombre: "Floor Press con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Floor Press con Mancuernas", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Svend Press con Disco", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Landmine Press a una mano", grupo: "Pecho/Hombro", tipo: "Funcional" },
  { nombre: "Press Smith Plano", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press Smith Inclinado", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Aperturas en Cable unilateral", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Chest Press Sentado Máquina", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Pullover con Mancuerna Pecho", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press de Pecho con Bandas", grupo: "Pecho", tipo: "Resistencia" },
  { nombre: "Aperturas en el Suelo", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press de Banca con Pausa", grupo: "Pecho", tipo: "Fuerza" },

  // --- ESPALDA (40) ---
  { nombre: "Peso Muerto Convencional", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Peso Muerto Sumo", grupo: "Espalda/Pierna", tipo: "Fuerza" },
  { nombre: "Dominadas Pronas (Pull-ups)", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Dominadas Supinas (Chin-ups)", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Dominadas Neutras", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Jalón al Pecho Agarre Ancho", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Jalón al Pecho Agarre Estrecho", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Jalón al Pecho Agarre Supino", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Jalón tras nuca", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo con Barra", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Remo con Mancuerna", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo Gironda", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo en T con Barra", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Remo Pendlay", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Remo con Soporte Pecho", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo Máquina Articulada", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Pull-over Polea Alta", grupo: "Espalda", tipo: "Aislamiento" },
  { nombre: "Pull-over con Mancuerna Espalda", grupo: "Espalda", tipo: "Aislamiento" },
  { nombre: "Rack Pulls", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Hiperextensiones", grupo: "Espalda Baja", tipo: "Salud" },
  { nombre: "Buenos Días Barra", grupo: "Espalda Baja", tipo: "Fuerza" },
  { nombre: "Face Pulls", grupo: "Espalda Alta", tipo: "Salud" },
  { nombre: "Remo Renegado", grupo: "Espalda/Core", tipo: "Funcional" },
  { nombre: "Remo con Banda", grupo: "Espalda", tipo: "Resistencia" },
  { nombre: "Remo Invertido", grupo: "Espalda", tipo: "Calistenia" },
  { nombre: "Jalón Unilateral Polea", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo Seal", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Superman", grupo: "Espalda Baja", tipo: "Core" },
  { nombre: "Remo Yates", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo con un Brazo en Polea", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo Kroc", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Meadows Row", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Jalón con Brazos Rectos", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Encogimientos Haney", grupo: "Trapecio", tipo: "Hipertrofia" },

  // --- PIERNAS: CUÁDRICEPS Y GLÚTEO (45) ---
  { nombre: "Sentadilla Libre Barra", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Sentadilla Frontal", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Sentadilla Búlgara", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla Hack", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla Goblet", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla Smith", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Prensa 45 grados", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Prensa Horizontal", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Extensiones Cuádriceps", grupo: "Pierna", tipo: "Aislamiento" },
  { nombre: "Zancadas Caminando", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Zancadas Estáticas", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Zancadas Laterales", grupo: "Pierna", tipo: "Funcional" },
  { nombre: "Step Up", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Pistol Squat", grupo: "Pierna", tipo: "Calistenia" },
  { nombre: "Sissy Squat", grupo: "Pierna", tipo: "Aislamiento" },
  { nombre: "Hip Thrust Barra", grupo: "Glúteo", tipo: "Fuerza" },
  { nombre: "Hip Thrust Unilateral", grupo: "Glúteo", tipo: "Hipertrofia" },
  { nombre: "Puente Glúteo", grupo: "Glúteo", tipo: "Hipertrofia" },
  { nombre: "Patada Glúteo Polea", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Patada Glúteo Máquina", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Abducción Cadera Máquina", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Abducción Cadera Polea", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Clamshells", grupo: "Glúteo", tipo: "Salud" },
  { nombre: "Monster Walk", grupo: "Glúteo", tipo: "Funcional" },
  { nombre: "Frog Pumps", grupo: "Glúteo", tipo: "Hipertrofia" },
  { nombre: "Sentadilla Sumo con Mancuerna", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Zancada hacia atrás", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla con Salto", grupo: "Pierna", tipo: "Potencia" },
  { nombre: "Aductores en Máquina", grupo: "Pierna", tipo: "Aislamiento" },
  { nombre: "Aductores en Polea", grupo: "Pierna", tipo: "Aislamiento" },

  // --- FEMORAL Y PANTORRILLA (30) ---
  { nombre: "Peso Muerto Rumano", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Peso Muerto Piernas Rígidas", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Curl Femoral Tumbado", grupo: "Femoral", tipo: "Aislamiento" },
  { nombre: "Curl Femoral Sentado", grupo: "Femoral", tipo: "Aislamiento" },
  { nombre: "Curl Femoral de Pie", grupo: "Femoral", tipo: "Aislamiento" },
  { nombre: "Curl Femoral Fitball", grupo: "Femoral", tipo: "Core" },
  { nombre: "Nordic Curl", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Glute-Ham Raise", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Elevación Talones de Pie", grupo: "Pantorrilla", tipo: "Aislamiento" },
  { nombre: "Elevación Talones Sentado", grupo: "Pantorrilla", tipo: "Aislamiento" },
  { nombre: "Elevación Talones Prensa", grupo: "Pantorrilla", tipo: "Aislamiento" },
  { nombre: "Elevación Talón Unilateral", grupo: "Pantorrilla", tipo: "Aislamiento" },
  { nombre: "Peso Muerto Americano", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Good Mornings sentado", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Tibial Anterior en Pared", grupo: "Pantorrilla", tipo: "Salud" },

  // --- HOMBROS Y TRAPECIO (35) ---
  { nombre: "Press Militar Barra", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Press Militar Mancuernas", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Press Arnold", grupo: "Hombro", tipo: "Hipertrofia" },
  { nombre: "Press Hombros Máquina", grupo: "Hombro", tipo: "Hipertrofia" },
  { nombre: "Elevaciones Laterales Mancuerna", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Elevaciones Laterales Polea", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Elevaciones Frontales Barra", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Elevaciones Frontales Mancuerna", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Vuelos Posteriores Pájaros", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Vuelos Posteriores Máquina", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Remo al Mentón Barra", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Encogimientos Barra", grupo: "Trapecio", tipo: "Fuerza" },
  { nombre: "Encogimientos Mancuernas", grupo: "Trapecio", tipo: "Fuerza" },
  { nombre: "Paseo del Granjero", grupo: "Trapecio/Core", tipo: "Funcional" },
  { nombre: "Press Militar con un brazo", grupo: "Hombro", tipo: "Hipertrofia" },
  { nombre: "Z-Press sentado en suelo", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Push Press", grupo: "Hombro", tipo: "Potencia" },
  { nombre: "Elevación Y lateral", grupo: "Hombro", tipo: "Salud" },
  { nombre: "Rotadores Externos Polea", grupo: "Hombro", tipo: "Salud" },

  // --- BRAZOS (45) ---
  { nombre: "Curl Bíceps Barra EZ", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Bíceps Barra Recta", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Bíceps Mancuerna", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Martillo", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Banco Scott", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Curl Concentrado", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Curl Inclinado Mancuernas", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Polea Baja", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Curl 21s", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Zottman", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Araña", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Press Francés EZ", grupo: "Tríceps", tipo: "Fuerza" },
  { nombre: "Press Cerrado Barra", grupo: "Tríceps", tipo: "Fuerza" },
  { nombre: "Extensiones Cuerda Polea Alta", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Extensiones Barra V Polea Alta", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Copa Tríceps Mancuerna", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Patada Tríceps Mancuerna", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Fondos Paralelas Tríceps", grupo: "Tríceps", tipo: "Fuerza" },
  { nombre: "Fondos entre Bancos", grupo: "Tríceps", tipo: "Hipertrofia" },
  { nombre: "Extensiones Polea unilateral", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Tate Press", grupo: "Tríceps", tipo: "Hipertrofia" },
  { nombre: "JM Press", grupo: "Tríceps", tipo: "Hipertrofia" },
  { nombre: "Curl de Muñeca Prono", grupo: "Antebrazo", tipo: "Aislamiento" },
  { nombre: "Curl de Muñeca Supino", grupo: "Antebrazo", tipo: "Aislamiento" },

  // --- ABDOMEN Y CORE (30) ---
  { nombre: "Crunch Abdominal", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Crunch Polea Alta", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Elevación Piernas Colgado", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Plancha Frontal", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Plancha Lateral", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Rueda Abdominal", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Russian Twists", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Mountain Climbers", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Bicycle Crunches", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Deadbug", grupo: "Abdomen", tipo: "Core" },
  { nombre: "V-Ups", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Bird Dog", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Pallof Press", grupo: "Abdomen", tipo: "Core" },
  { nombre: "L-Sit", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Dragon Flag", grupo: "Abdomen", tipo: "Core" },

  // --- CARDIO, HIIT Y FUNCIONAL (25) ---
  { nombre: "Cinta Running", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Bici Estática", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Remo Indoor", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Salto Cuerda", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Burpees", grupo: "Cuerpo Completo", tipo: "HIIT" },
  { nombre: "Jumping Jacks", grupo: "Cuerpo Completo", tipo: "HIIT" },
  { nombre: "Box Jumps", grupo: "Pierna", tipo: "Potencia" },
  { nombre: "Battle Ropes", grupo: "Cuerpo Completo", tipo: "HIIT" },
  { nombre: "Kettlebell Swing", grupo: "Cuerpo Completo", tipo: "Funcional" },
  { nombre: "Clean and Press", grupo: "Cuerpo Completo", tipo: "Potencia" },
  { nombre: "Snatch con Mancuerna", grupo: "Cuerpo Completo", tipo: "Potencia" },
  { nombre: "Wall Balls", grupo: "Cuerpo Completo", tipo: "Funcional" },
  { nombre: "Bear Crawl", grupo: "Cuerpo Completo", tipo: "Funcional" },
  { nombre: "Sprints en Colina", grupo: "Cardio", tipo: "HIIT" },
  { nombre: "Escaladora (Stairmaster)", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Estiramiento Isquios", grupo: "Estiramiento", tipo: "Flexibilidad" },
  { nombre: "Estiramiento Pectoral", grupo: "Estiramiento", tipo: "Flexibilidad" },
  { nombre: "Cobra (Estiramiento Abdomen)", grupo: "Estiramiento", tipo: "Flexibilidad" }
];

export default function AdminEjercicios() {
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);

  const cargar = async () => {
    setCargando(true);
    setProgreso(0);
    try {
      let count = 0;
      // Procesamos en pequeños grupos para evitar errores de red
      for (const ej of BIBLIOTECA_COMPLETA) {
        const id = ej.nombre.toLowerCase().trim()
          .replace(/\s+/g, "_")
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
        await setDoc(doc(db, "ejercicios", id), ej);
        count++;
        // Feedback visual cada 5 ejercicios para no saturar el estado
        if (count % 5 === 0 || count === BIBLIOTECA_COMPLETA.length) {
          setProgreso(Math.round((count / BIBLIOTECA_COMPLETA.length) * 100));
        }
      }
      Alert.alert("¡Éxito!", `Se han cargado ${BIBLIOTECA_COMPLETA.length} ejercicios correctamente.`);
    } catch (e: any) {
      Alert.alert("Error de Conexión", e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <FontAwesome5 name="database" size={60} color="#1e293b" />
      <Text style={styles.title}>Carga de Base de Datos</Text>
      <Text style={styles.subtitle}>
        {cargando 
          ? `PROGRESO: ${progreso}% \n No cierres la aplicación...` 
          : `Total a cargar: ${BIBLIOTECA_COMPLETA.length} ejercicios.\nEsto sustituirá los anteriores.`}
      </Text>
      
      <TouchableOpacity 
        onPress={cargar} 
        style={[styles.btn, cargando && styles.btnDisabled]}
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>COMENZAR CARGA EXHAUSTIVA</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 15, textAlign: 'center' },
  subtitle: { textAlign: 'center', marginBottom: 40, color: '#64748b', fontSize: 16, lineHeight: 24 },
  btn: { backgroundColor: '#10b981', padding: 20, borderRadius: 20, width: '100%', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  btnDisabled: { backgroundColor: '#94a3b8' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});