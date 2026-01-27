import React from 'react';
import { View, Button, Alert } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';

const ejerciciosGym = [
  // PECHO
  { nombre: "Press de Banca con Barra", grupo: "Pecho", tipo: "Fuerza" },
  { nombre: "Press Inclinado con Mancuernas", grupo: "Pecho", tipo: "Hipertrofia" },
  { nombre: "Aperturas con Mancuernas (Flyes)", grupo: "Pecho", tipo: "Aislamiento" },
  { nombre: "Cruces en Polea", grupo: "Pecho", tipo: "Aislamiento" },
  // ESPALDA
  { nombre: "Dominadas", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Jalón al Pecho", grupo: "Espalda", tipo: "Hipertrofia" },
  { nombre: "Remo con Barra", grupo: "Espalda", tipo: "Fuerza" },
  { nombre: "Remo en Polea Baja", grupo: "Espalda", tipo: "Hipertrofia" },
  // PIERNA
  { nombre: "Sentadilla Libre", grupo: "Pierna", tipo: "Fuerza" },
  { nombre: "Prensa de Piernas", grupo: "Pierna", tipo: "Hipertrofia" },
  { nombre: "Extensiones de Cuádriceps", grupo: "Pierna", tipo: "Aislamiento" },
  { nombre: "Curl Femoral Tumbado", grupo: "Pierna", tipo: "Aislamiento" },
  { nombre: "Desplantes (Lunges)", grupo: "Pierna", tipo: "Fuerza" },
  // HOMBRO
  { nombre: "Press Militar con Barra", grupo: "Hombro", tipo: "Fuerza" },
  { nombre: "Elevaciones Laterales", grupo: "Hombro", tipo: "Aislamiento" },
  { nombre: "Press Arnold", grupo: "Hombro", tipo: "Hipertrofia" },
  // BRAZO
  { nombre: "Curl de Bíceps con Barra", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Martillos con Mancuerna", grupo: "Bíceps", tipo: "Hipertrofia" },
  { nombre: "Copa de Tríceps", grupo: "Tríceps", tipo: "Aislamiento" },
  { nombre: "Extensiones en Polea Alta", grupo: "Tríceps", tipo: "Aislamiento" }
];

export default function AdminEjercicios() {
  const subirEjercicios = async () => {
    try {
      for (const ej of ejerciciosGym) {
        const docId = ej.nombre.toLowerCase().replace(/ /g, "_");
        await setDoc(doc(db, "ejercicios", docId), ej);
      }
      Alert.alert("Éxito", "Biblioteca de ejercicios cargada correctamente");
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar la biblioteca");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button title="Cargar 20 Ejercicios a Firebase" onPress={subirEjercicios} color="#22c55e" />
    </View>
  );
}