import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { db } from '../../firebaseConfig';
import { doc, setDoc, collection, onSnapshot, deleteDoc, query } from 'firebase/firestore';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

const BIBLIOTECA_MAESTRA = [
  // PECHO (35)
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
  { nombre: "Press de Banca Agarre Estrecho", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Floor Press con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Floor Press con Mancuernas", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Svend Press con Disco", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Press Smith Plano", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press Smith Inclinado", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Pullover con Mancuerna Pecho", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press de Pecho con Bandas", grupo: "Pecho", tipo: "Resistencia" },
  { nombre: "Aperturas en el Suelo", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Press de Pecho sentado en Máquina", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Aperturas en Polea Unilateral", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Push-ups Explosivas", grupo: "Pecho", tipo: "Potencia" },
  { nombre: "Press de Banca con Pausa Inferior", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Landmine Press de Pecho", grupo: "Pecho", tipo: "Funcional" },
  { nombre: "Crossover en Polea baja a una mano", grupo: "Pecho", tipo: "Aislamiento" },

  // ESPALDA (40)
  { nombre: "Peso Muerto Convencional", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Peso Muerto Sumo", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Dominadas Pronas", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Dominadas Supinas", grupo: "Espalda", tipo: "Fuerza" },
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
  { nombre: "Remo Renegado", grupo: "Espalda", tipo: "Funcional" },
  { nombre: "Remo con Banda", grupo: "Espalda", tipo: "Resistencia" },
  { nombre: "Remo Invertido", grupo: "Espalda", tipo: "Calistenia" },
  { nombre: "Jalón Unilateral Polea", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo Seal", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Superman Lumbares", grupo: "Espalda Baja", tipo: "Core" },
  { nombre: "Remo Yates", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo Kroc", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Meadows Row", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Jalón con Brazos Rectos", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo Unilateral en Polea", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo en Máquina Smith", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo Landmine", grupo: "Espalda", tipo: "Funcional" },
  { nombre: "Remo a la Cara con Cuerda", grupo: "Espalda Alta", tipo: "Aislamiento" },
  { nombre: "Pulls de Escápula", grupo: "Espalda Alta", tipo: "Salud" },
  { nombre: "Good Mornings con banda", grupo: "Espalda Baja", tipo: "Resistencia" },
  { nombre: "Jalón al pecho con agarre neutro ancho", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo de pie con polea", grupo: "Espalda", tipo: "Hipertrofia" },

  // PIERNAS (45)
  { nombre: "Sentadilla Libre Barra", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Sentadilla Frontal Barra", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Sentadilla Búlgara", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla Hack", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla Goblet", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla Smith", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Prensa 45 grados", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Prensa Horizontal", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Extensiones Cuádriceps", grupo: "Pierna", tipo: "Aislamiento" },
  { nombre: "Zancadas Caminando", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Zancadas Estáticas", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Step Up al cajón", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Sissy Squat", grupo: "Pierna", tipo: "Aislamiento" },
  { nombre: "Hip Thrust Barra", grupo: "Glúteo", tipo: "Fuerza" },
  { nombre: "Hip Thrust Unilateral", grupo: "Glúteo", tipo: "Hipertrofia" },
  { nombre: "Puente Glúteo", grupo: "Glúteo", tipo: "Hipertrofia" },
  { nombre: "Patada Glúteo Polea", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Patada Glúteo Máquina", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Abducción Cadera Máquina", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Abducción Cadera Polea", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Peso Muerto Rumano Barra", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Peso Muerto Piernas Rígidas", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Curl Femoral Tumbado", grupo: "Femoral", tipo: "Aislamiento" },
  { nombre: "Curl Femoral Sentado", grupo: "Femoral", tipo: "Aislamiento" },
  { nombre: "Curl Femoral de Pie", grupo: "Femoral", tipo: "Aislamiento" },
  { nombre: "Elevación Talones de Pie", grupo: "Pantorrilla", tipo: "Aislamiento" },
  { nombre: "Elevación Talones Sentado", grupo: "Pantorrilla", tipo: "Aislamiento" },
  { nombre: "Elevación Talones Prensa", grupo: "Pantorrilla", tipo: "Aislamiento" },
  { nombre: "Sentadilla Sumo Mancuerna", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Aductores en Máquina", grupo: "Pierna", tipo: "Aislamiento" },
  { nombre: "Zancada hacia atrás", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla con Salto", grupo: "Pierna", tipo: "Potencia" },
  { nombre: "Peso Muerto Americano", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Jefferson Squat", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Belt Squat", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Frog Pumps glúteo", grupo: "Glúteo", tipo: "Aislamiento" },
  { nombre: "Pistol Squat asistida", grupo: "Pierna", tipo: "Calistenia" },
  { nombre: "Nordic Curl femoral", grupo: "Femoral", tipo: "Fuerza" },
  { nombre: "Split Squat con elevación", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Sentadilla Zercher", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Prensa a una pierna", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Elevación de gemelos tipo burro", grupo: "Pantorrilla", tipo: "Aislamiento" },
  { nombre: "Peso Muerto con Mancuernas", grupo: "Femoral", tipo: "Hipertrofia" },
  { nombre: "Zancadas cruzadas (Curtsy)", grupo: "Glúteo", tipo: "Funcional" },
  { nombre: "Clamshells con banda", grupo: "Glúteo", tipo: "Salud" },

  // HOMBROS (35)
  { nombre: "Press Militar Barra de Pie", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Press Militar Mancuernas Sentado", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Press Arnold", grupo: "Hombro", tipo: "Hipertrofia" },
  { nombre: "Elevaciones Laterales Mancuerna", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Elevaciones Laterales Polea", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Elevaciones Frontales Barra", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Vuelos Posteriores Pájaros", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Remo al Mentón Barra", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Encogimientos Barra Trapecio", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Press Militar Smith", grupo: "Hombro", tipo: "Hipertrofia" },
  { nombre: "Push Press hombros", grupo: "Hombro", tipo: "Potencia" },
  { nombre: "Elevación Lateral Máquina", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Face Pulls polea alta", grupo: "Hombro", tipo: "Salud" },
  { nombre: "Rotadores externos polea", grupo: "Hombro", tipo: "Salud" },
  { nombre: "Press militar unilateral", grupo: "Hombro", tipo: "Hipertrofia" },
  { nombre: "Elevación frontal disco", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Pájaros en máquina", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Upright Row polea baja", grupo: "Hombro", tipo: "Hipertrofia" },
  { nombre: "Press de hombros Hammer", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Landmine press hombros", grupo: "Hombro", tipo: "Funcional" },
  { nombre: "Z-Press sentado", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Cruces de polea para deltoide posterior", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Elevación lateral inclinada", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Scaption (Elevación en Y)", grupo: "Hombro", tipo: "Salud" },
  { nombre: "Clean and Press hombro", grupo: "Hombro", tipo: "Potencia" },
  { nombre: "Bradford Press", grupo: "Hombro", tipo: "Hipertrofia" },
  { nombre: "Press de hombros sentado unilateral", grupo: "Hombro", tipo: "Hipertrofia" },
  { nombre: "Elevación lateral con un brazo inclinado", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Jalón de cara con banda", grupo: "Hombro", tipo: "Salud" },
  { nombre: "Encogimientos con mancuerna", grupo: "Hombro", tipo: "Hipertrofia" },

  // BRAZOS (45)
  { nombre: "Curl Bíceps Barra EZ", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Bíceps Barra Recta", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Bíceps Mancuerna", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Martillo", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Banco Scott", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Curl Concentrado", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Curl Inclinado Mancuernas", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Polea Baja", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Curl 21s", grupo: "Bíceps", tipo: "Hipertrofia" },
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
  { nombre: "Curl Zottman bíceps", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl Drag con barra", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Curl en polea alta doble", grupo: "Bíceps", tipo: "Aislamiento" },
  { nombre: "Curl de bíceps platón", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Martillo en polea con cuerda", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Tate Press tríceps", grupo: "Tríceps", tipo: "Hipertrofia" },
  { nombre: "JM Press tríceps", grupo: "Tríceps", tipo: "Fuerza" },
  { nombre: "Extensiones tras nuca polea", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Kickback tríceps en polea", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Curl de muñeca barra", grupo: "Antebrazo", tipo: "Aislamiento" },
  { nombre: "Extensión de muñeca barra", grupo: "Antebrazo", tipo: "Aislamiento" },
  { nombre: "Paseo del granjero antebrazo", grupo: "Antebrazo", tipo: "Funcional" },
  { nombre: "Curl invertido barra", grupo: "Antebrazo", tipo: "Hipertrofia" },

  // ABDOMEN Y CORE (30)
  { nombre: "Crunch Abdominal", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Crunch Polea Alta", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Elevación Piernas Colgado", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Plancha Frontal", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Plancha Lateral", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Rueda Abdominal", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Russian Twists", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Mountain Climbers", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Bicycle Crunches", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Deadbug abdomen", grupo: "Abdomen", tipo: "Core" },
  { nombre: "V-Ups abdominales", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Pallof Press core", grupo: "Abdomen", tipo: "Funcional" },
  { nombre: "Hollow Hold", grupo: "Abdomen", tipo: "Core" },
  { nombre: "Woodchopper polea", grupo: "Abdomen", tipo: "Funcional" },
  { nombre: "Toe to bar", grupo: "Abdomen", tipo: "Calistenia" },

  // CARDIO Y OTROS (15)
  { nombre: "Cinta Running", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Bici Estática", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Remo Indoor", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Salto Cuerda", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Burpees cuerpo completo", grupo: "Cardio", tipo: "HIIT" },
  { nombre: "Jumping Jacks", grupo: "Cardio", tipo: "HIIT" },
  { nombre: "Box Jumps salto", grupo: "Pierna", tipo: "Potencia" },
  { nombre: "Battle Ropes funcional", grupo: "Cuerpo Completo", tipo: "HIIT" },
  { nombre: "Kettlebell Swing funcional", grupo: "Cuerpo Completo", tipo: "Funcional" },
  { nombre: "Clean and Jerk potencia", grupo: "Cuerpo Completo", tipo: "Potencia" },
  { nombre: "Sprints en recta", grupo: "Cardio", tipo: "HIIT" },
  { nombre: "Escaladora Stairmaster", grupo: "Cardio", tipo: "Aeróbico" },
  { nombre: "Estiramiento Isquiotibiales", grupo: "Estiramiento", tipo: "Salud" },
  { nombre: "Estiramiento Pectorales", grupo: "Estiramiento", tipo: "Salud" },
  { nombre: "Movilidad de Cadera", grupo: "Estiramiento", tipo: "Salud" }
];

export default function AdminEjercicios() {
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [ejercicios, setEjercicios] = useState<any[]>([]);

  // ESCUCHA DE EJERCICIOS EN TIEMPO REAL
  useEffect(() => {
    const q = query(collection(db, "ejercicios"));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setEjercicios(lista);
    });
    return () => unsub();
  }, []);

  const cargar = async () => {
    setCargando(true);
    setProgreso(0);
    try {
      let count = 0;
      for (const ej of BIBLIOTECA_MAESTRA) {
        const id = ej.nombre.toLowerCase().trim()
          .replace(/\s+/g, "_")
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
        await setDoc(doc(db, "ejercicios", id), ej);
        count++;
        if (count % 10 === 0 || count === BIBLIOTECA_MAESTRA.length) {
          setProgreso(Math.round((count / BIBLIOTECA_MAESTRA.length) * 100));
        }
      }
      Alert.alert("¡Éxito!", `Se han cargado ${BIBLIOTECA_MAESTRA.length} ejercicios.`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.outerContainer}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
            <FontAwesome5 name="dumbbell" size={24} color="#1e293b" />
            <Text style={styles.title}>Biblioteca de Ejercicios</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          <View style={styles.cardAdmin}>
            <Text style={styles.cardLabel}>Gestión de Base de Datos</Text>
            <Text style={styles.cardSub}>
              {cargando 
                ? `PROGRESO: ${progreso}% \n No cierres la aplicación...` 
                : `Total a cargar: ${BIBLIOTECA_MAESTRA.length} ejercicios.\nEsta lista es la más completa disponible.`}
            </Text>
            
            <TouchableOpacity 
              onPress={cargar} 
              style={[styles.btn, cargando && styles.btnDisabled]}
              disabled={cargando}
            >
              {cargando ? (
                <View style={styles.row}>
                  <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.btnText}>CARGANDO {progreso}%</Text>
                </View>
              ) : (
                <Text style={styles.btnText}>COMENZAR CARGA COMPLETA</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Ejercicios en Sistema ({ejercicios.length})</Text>

          {ejercicios.sort((a,b) => a.grupo.localeCompare(b.grupo)).map((item) => (
            <View key={item.id} style={styles.ejercicioCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ejNombre}>{item.nombre.toUpperCase()}</Text>
                <View style={styles.badgeRow}>
                    <View style={styles.badgeGrupo}><Text style={styles.badgeText}>{item.grupo}</Text></View>
                    <View style={styles.badgeTipo}><Text style={styles.badgeText}>{item.tipo}</Text></View>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => deleteDoc(doc(db, "ejercicios", item.id))}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#f1f5f9' },
  mainContainer: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    alignSelf: 'center', 
    width: '100%', 
    maxWidth: 600, // <--- Ajuste central para WEB
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  cardAdmin: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 25 },
  cardLabel: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 },
  cardSub: { fontSize: 12, color: '#64748b', marginBottom: 20, lineHeight: 18 },
  btn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  btnDisabled: { backgroundColor: '#94a3b8' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
  ejercicioCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 15, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  ejNombre: { fontWeight: 'bold', fontSize: 14, color: '#1e293b' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  badgeGrupo: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeTipo: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#3b82f6' },
  deleteBtn: { padding: 10 }
});