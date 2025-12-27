import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator, SafeAreaView, Image, Alert, TextInput } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, where, getDocs } from 'firebase/firestore'; // Se agregó doc y deleteDoc
import { signOut } from 'firebase/auth';
import { FontAwesome5, Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function CoachPanel() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);
  const [seccionActiva, setSeccionActiva] = useState<number | null>(null);

  // --- ESTADOS PARA NUTRICIÓN ---
  const [modalDieta, setModalDieta] = useState(false);
  const [dietaActual, setDietaActual] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [alimentos, setAlimentos] = useState<any[]>([]);
  const [alimentosFiltrados, setAlimentosFiltrados] = useState<any[]>([]);
  const [factorActividad, setFactorActividad] = useState<number>(1.2);
  const [ajusteCalorico, setAjusteCalorico] = useState<number>(0);


  useEffect(() => {
    const q = query(collection(db, "revisiones_pendientes"));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(lista);
      setCargando(false);
    }, (error) => {
      // 3. Si hay un error de permisos (Security Rules), aquí saltará
      Alert.alert("Error", error.message);
      setCargando(false);
    });
    return () => unsub();
  }, []);

 // --- LÓGICA DE NUTRICIÓN (CORREGIDA) ---
  const calcularMetabolismo = (alumno: any) => {
    if (!alumno?.datosFisicos) return 0;
    const { peso, altura, edad, genero } = alumno.datosFisicos;
    
    let tmb = 0;
    // Aseguramos que los valores sean numéricos para el cálculo de la TMB
    const p = parseFloat(peso) || 0;
    const a = parseFloat(altura) || 0;
    const e = parseFloat(edad) || 0;

    if (genero === 'hombre') {
      tmb = (10 * p) + (6.25 * a) - (5 * e) + 5;
    } else {
      tmb = (10 * p) + (6.25 * a) - (5 * e) - 161;
    }

    // Usamos directamente el factorActividad (que ya es número)
    // Sin parseFloat y sin el operador || "1.4" que causaba el conflicto de tipos
    return Math.round(tmb * factorActividad); 
  };

  const buscarAlimento = async (texto: string) => {
    setBusqueda(texto);
    if (texto.length > 2) {
      const q = query(
        collection(db, "alimentos"), 
        where("nombre", ">=", texto.toLowerCase()), 
        where("nombre", "<=", texto.toLowerCase() + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const sugerencias = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlimentosFiltrados(sugerencias);
    } else {
      setAlimentosFiltrados([]);
    }
  };

  const agregarAlPlan = (item: any, cantidad: number, unidad: string) => {
    // Calculamos el factor según la cantidad (ej: 0.5 para media taza)
    const factor = cantidad; 
    
    const nuevoItem = {
      ...item,
      idTemporal: Date.now() + Math.random(), // ID único para evitar errores al borrar
      cantidadUsada: cantidad,
      unidadElegida: unidad || item.unidadMedida || "unidad", 
      p: (parseFloat(item.proteina || item.p || 0) * factor).toFixed(1),
      g: (parseFloat(item.grasa || item.g || 0) * factor).toFixed(1),
      c: (parseFloat(item.carbohidratos || item.c || 0) * factor).toFixed(1),
      kcal: (parseFloat(item.calorias || item.kcal || 0) * factor).toFixed(0)
    };
    setDietaActual([...dietaActual, nuevoItem]);
    setAlimentosFiltrados([]);
    setBusqueda('');
  };

  // --- FUNCIONES PARA PLANES ---
  const abrirPlanAlimentacion = (alumno: any) => {
    setAlumnoSeleccionado(alumno);
    setModalDieta(true);
  };

  const abrirPlanEntrenamiento = (alumno: any) => {
    Alert.alert("Acceso", `Iniciando creación de Plan de Entrenamiento para ${alumno.nombre}`);
  };

  // --- NUEVA FUNCIÓN PARA ELIMINAR ---
  const eliminarRegistro = (id: string, nombre: string) => {
    Alert.alert(
      "Eliminar Expediente",
      `¿Estás seguro de que deseas eliminar permanentemente el registro de ${nombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "revisiones_pendientes", id));
              Alert.alert("Eliminado", "El registro ha sido borrado correctamente.");
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el registro.");
            }
          } 
        }
      ]
    );
  };

  const procesarTexto = (val: any) => {
    if (val === undefined || val === null || val === '' || val === 'no' || val === 0) return "NO";
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : "NO";
    if (typeof val === 'object') {
        if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString();
        return JSON.stringify(val); 
    }
    return String(val);
  };

  const formatearActividad = (dias: any, min: any) => {
    const d = procesarTexto(dias);
    const m = procesarTexto(min);
    if (d === "NO" || m === "NO") return "NO";
    return `${d} días / ${m} min`;
  };

  const consentimientoCompleto = `1. Propósito y explicación de los procedimientos: Mediante este documento acepto voluntariamente participar en un plan de entrenamiento personal de acondicionamiento físico. También acepto tomar parte en las actividades del programa de entrenamiento personal que se me recomienden para la mejora de mi salud y bienestar general. Estas pueden incluir asesoramiento dietético, gestión del estrés y actividades formativas sobre salud y acondicionamiento físico. Los niveles de intensidad del ejercicio que se realizará se basarán en mi capacidad cardiorrespiratoria (corazón y pulmones) y muscular. Soy consciente de que se me puede requerir la realización de una prueba graduada de esfuerzo, así como otras pruebas físicas antes del comienzo del programa de entrenamiento personal para poder valorar y evaluar mi estado físico actual. Se me darán las instrucciones concretas en cuanto al tipo y volumen de ejercicio que debería realizar. Me comprometo a realizar 3 veces por semana las sesiones formales del programa. Entrenadores capacitados para ello dirigirán mis actividades, controlarán mi rendimiento y evaluarán mi esfuerzo. Según mi estado de salud, se me podrá requerir durante las sesiones un control de la presión arterial y la frecuencia cardíaca para mantener la intensidad dentro de unos límites deseables. Soy consciente de que se espera mi asistencia a todas las sesiones y que siga las instrucciones del personal relativas al ejercicio, la dieta, la gestión del estrés y otros programas relacionados (salud / acondicionamiento físico). En caso de estar tomando medicamentos, ya he informado de ello al personal del programa y me comprometo a comunicarles de inmediato cualquier cambio al respecto tanto por mi parte como por parte del médico. En caso de que sea conveniente, se me valorará y evaluará periódicamente a intervalos regulares tras el inicio del programa. Se me ha informado de que durante mi participación en este programa de entrenamiento personal se me pedirá que complete las actividades físicas salvo en caso de síntomas como fatiga, falta de aire, molestias en la zona pectoral o similares. Llegados a ese punto, se me ha informado de que tengo el derecho de disminuir la intensidad o poner fin al ejercicio y de que estoy obligado a informar al personal del programa de entrenamiento personal de mis síntomas. Así, declaro que se me ha informado de ello y me comprometo a informar al personal encargado de mi entrenamiento de mis síntomas, si se llegaran a producir. Soy consciente de que, durante el ejercicio, un entrenador personal supervisará periódicamente mi rendimiento con la posibilidad de que controle mi pulso y mi presión arterial o de que valore mi percepción del esfuerzo para así controlar mi progreso. Asimismo, soy consciente de que el entrenador personal puede reducir la intensidad o poner fin al programa de ejercicios para mi seguridad y beneficio según los parámetros anteriormente mencionados. También se me ha comunicado que durante el transcurso de mi programa de entrenamiento personal puede ser necesario el contacto físico y una colocación corporal adecuada de mi cuerpo para evaluar las reacciones musculares y corporales a ejercicios concretos, además de para asegurar que utilizo la técnica y postura adecuadas. Por ello doy mi autorización expresa para que se produzca el contacto físico por estos motivos.\n\n2. Riesgos: Manifiesto que se me ha informado de que existe la posibilidad, aunque remota, de efectos negativos durante el ejercicio, como por ejemplo (y sin excluir otros) alteración de la presión arterial, mareos, trastornos del ritmo cardíaco y casos excepcionales de infarto, derrames o incluso riesgo de muerte. Asimismo, se me ha explicado que existe el riesgo de lesiones corporales, como por ejemplo (sin excluir otras) lesiones musculares, de ligamentos, tendones y articulaciones. Se me ha comunicado que se pondrán todos los medios disponibles para minimizar que estas incidencias se produzcan mediante controles adecuados de mi estado antes de cada sesión de entrenamiento y supervisión del personal durante el ejercicio, así como de mi prudencia frente al esfuerzo. Conozco perfectamente los riesgos asociados con el ejercicio, como lesiones corporales, infartos, derrames e incluso la muerte, y aun conociendo estos riesgos, deseo tomar parte como ya he manifestado.\n\n3. Beneficios que cabe esperar y alternativas disponibles a la prueba de esfuerzo: Soy consciente de que este programa puede o no reportar beneficios a mi condición física o salud general. Comprendo que la participación en sesiones de ejercicio y entrenamiento personal me permitirá aprender cómo realizar adecuadamente ejercicios de acondicionamiento físico, usar los diversos aparatos y regular el esfuerzo físico. Por tanto, debería sacar provecho de estas experiencias, ya que indicarían la manera en que mis limitaciones físicas pueden afectar mi capacidad de realizar las diversas actividades físicas. Soy asimismo consciente de que si sigo cuidadosamente las instrucciones del programa mejoraré con toda probabilidad mi capacidad para el ejercicio físico y mi forma física tras un período de 3 a 6 meses.\n\n4. Confidencialidad y uso de la información: Se me ha informado de que la información obtenida durante este programa de entrenamiento personal se tratará con máxima confidencialidad y, en consecuencia, no se proporcionará o revelará a nadie sin mi consentimiento expreso por escrito. Acepto, en cambio, que se utilice cualquier información con propósito de investigación o estadístico siempre que no pueda llevar a la identificación de mi persona. También apruebo el uso de cualquier información con el propósito de consulta con otros profesionales de la salud o del fitness, incluido mi médico. En cambio, cualquier otra información obtenida se utilizará por parte del personal del programa únicamente por razones de prescripción de ejercicio y evaluación de mi progreso en el programa. Confirmo que he leído este documento en su totalidad o que se me ha leído en caso de no ser capaz de leerlo personalmente. Doy mi autorización expresa a que se lleven a cabo todos los servicios y procedimientos tal y como me ha comunicado el personal del programa.`;

  const exportarPDF = async (a: any) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { 
            size: A4; 
            margin: 25mm 20mm 20mm 20mm; /* Aumentamos el margen superior a 25mm */
          }
          
          body { 
            font-family: 'Helvetica', sans-serif; 
            color: #334155; 
            line-height: 1.3; 
            margin: 0; 
            padding: 0;
          }

          /* Este contenedor asegura que si un bloque queda cerca del final, se pase completo a la siguiente hoja */
          .block-container { 
            page-break-inside: avoid; 
            margin-bottom: 20px; 
            width: 100%; 
            display: block;
          }
          
          .header { 
            text-align: center; 
            border-bottom: 4px solid #3b82f6; 
            padding-bottom: 15px; 
            margin-bottom: 30px; 
          }
          
          h1 { color: #1e3a8a; font-size: 22px; margin: 0; text-transform: uppercase; }
          p.subtitle { font-size: 12px; color: #64748b; margin-top: 5px; }
          
          .section-title { 
            background: #3b82f6; 
            color: white; 
            padding: 6px 18px; 
            border-radius: 25px; 
            font-size: 11px; 
            font-weight: bold; 
            width: fit-content; 
            text-transform: uppercase; 
            margin-bottom: 8px; 
          }
          
          .grid { display: flex; flex-wrap: wrap; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff; }
          .item { width: 50%; padding: 10px; border: 0.5px solid #f1f5f9; box-sizing: border-box; }
          .full-width { width: 100%; }
          .label { font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 2px; }
          .value { font-size: 11px; color: #0f172a; font-weight: 600; }
          
          .legal-text { 
            font-size: 8.5px; 
            line-height: 1.5; 
            text-align: justify; 
            color: #475569; 
            padding: 15px; 
            background: #f8fafc; 
            border-radius: 10px; 
            border: 1px solid #e2e8f0; 
          }
          
          .signature-box { margin-top: 30px; text-align: center; page-break-inside: avoid; }
          .signature-img { width: 80px; height: auto; margin: 0 auto; display: block; border-bottom: 2px solid #1e293b; }
          .signature-label { font-size: 10px; font-weight: bold; margin-top: 10px; color: #1e293b; }

          .page-break { 
            page-break-before: always; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EXPEDIENTE TÉCNICO FITTECH</h1>
          <p class="subtitle"><b>Alumno:</b> ${procesarTexto(a.nombre)} | <b>Fecha:</b> ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="block-container">
          <div class="section-title">1. Datos e Identificación</div>
          <div class="grid">
            <div class="item"><span class="label">Teléfono</span><span class="value">${procesarTexto(a.telefono)}</span></div>
            <div class="item"><span class="label">Género</span><span class="value">${procesarTexto(a.datosFisicos?.genero)}</span></div>
            <div class="item"><span class="label">Peso</span><span class="value">${procesarTexto(a.datosFisicos?.peso)} kg</span></div>
            <div class="item"><span class="label">Estatura</span><span class="value">${procesarTexto(a.datosFisicos?.altura)} cm</span></div>
          </div>
        </div>

        <div class="block-container">
          <div class="section-title">2. Medidas Corporales</div>
          <div class="grid">
            <div class="item"><span class="label">Cuello / Pecho</span><span class="value">${procesarTexto(a.medidas?.cuello)} / ${procesarTexto(a.medidas?.pecho)}</span></div>
            <div class="item"><span class="label">Brazo R / F</span><span class="value">${procesarTexto(a.medidas?.brazoR)} / ${procesarTexto(a.medidas?.brazoF)}</span></div>
            <div class="item"><span class="label">Cintura / Cadera</span><span class="value">${procesarTexto(a.medidas?.cintura)} / ${procesarTexto(a.medidas?.cadera)}</span></div>
            <div class="item"><span class="label">Muslo / Pierna</span><span class="value">${procesarTexto(a.medidas?.muslo)} / ${procesarTexto(a.medidas?.pierna)}</span></div>
          </div>
        </div>

        ${a.datosFisicos?.genero === 'mujer' ? `
        <div class="block-container">
          <div class="section-title">3. Ciclo Menstrual</div>
          <div class="grid">
            <div class="item"><span class="label">Estado del Ciclo</span><span class="value">${procesarTexto(a.ciclo?.tipo)}</span></div>
            <div class="item"><span class="label">Método Anticonceptivo</span><span class="value">${procesarTexto(a.ciclo?.anticonceptivo)}</span></div>
          </div>
        </div>
        ` : ''}

        <div class="block-container">
          <div class="section-title">4. Historial de Salud</div>
          <div class="grid">
            <div class="item full-width"><span class="label">Enf. Familiares</span><span class="value">${procesarTexto(a.salud?.enfFam)}</span></div>
            <div class="item full-width"><span class="label">Enf. Personales</span><span class="value">${procesarTexto(a.salud?.enfPers)}</span></div>
            <div class="item"><span class="label">Lesiones</span><span class="value">${procesarTexto(a.salud?.detalleLesion)}</span></div>
            <div class="item"><span class="label">Cirugías</span><span class="value">${procesarTexto(a.salud?.detalleOperacion)}</span></div>
          </div>
        </div>

        <div class="block-container">
          <div class="section-title">5. Estilo de Vida e IPAQ</div>
          <div class="grid">
            <div class="item"><span class="label">Vigorosa</span><span class="value">${formatearActividad(a.ipaq?.vDias, a.ipaq?.vMin)}</span></div>
            <div class="item"><span class="label">Moderada</span><span class="value">${formatearActividad(a.ipaq?.mDias, a.ipaq?.mMin)}</span></div>
            <div class="item"><span class="label">Caminata</span><span class="value">${formatearActividad(a.ipaq?.cDias, a.ipaq?.cMin)}</span></div>
            <div class="item"><span class="label">Sentado</span><span class="value">${procesarTexto(a.ipaq?.sentado)} hrs/día</span></div>
          </div>
        </div>

        <div class="block-container">
          <div class="section-title">6. Nutrición y Planificación</div>
          <div class="grid">
            <div class="item full-width"><span class="label">Comidas Actuales</span><span class="value">${procesarTexto(a.nutricion?.comidasAct)} (${procesarTexto(a.nutricion?.descAct)})</span></div>
            <div class="item"><span class="label">Días Entreno</span><span class="value">${procesarTexto(a.nutricion?.entrenos)}</span></div>
            <div class="item"><span class="label">Comidas en Plan</span><span class="value">${procesarTexto(a.nutricion?.comidasDes)}</span></div>
            <div class="item full-width" style="background:#f0f9ff;"><span class="label">Objetivo</span><span class="value" style="color:#2563eb">${procesarTexto(a.nutricion?.objetivo)}</span></div>
          </div>
        </div>

        <div class="block-container">
          <div class="section-title">7. Frecuencia Alimentaria</div>
          <div class="grid">
            ${Object.entries(a.frecuenciaAlimentos || {}).map(([k, v]) => `
              <div class="item"><span class="label">${k}</span><span class="value">${procesarTexto(v)}</span></div>
            `).join('')}
          </div>
        </div>

        <div class="page-break"></div>

        <div class="block-container">
          <div class="section-title">8. Consentimiento Informado Legal</div>
          <div class="legal-text">
            ${consentimientoCompleto.replace(/\n\n/g, '<br/><br/>')}
          </div>
        </div>

        <div class="signature-box">
          <img src="${a.firma}" class="signature-img" />
          <div class="signature-label">Firma del Alumno: ${procesarTexto(a.nombre)}</div>
          <div style="font-size:8px; color:#94a3b8;">ID Autenticación: ${a.uid}</div>
        </div>
      </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error", "No se pudo generar el PDF"); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPrincipal}>
        <Text style={styles.title}>Panel Coach</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.logOutBtn}><Ionicons name="log-out" size={20} color="#ef4444" /></TouchableOpacity>
      </View>

      <FlatList
        data={alumnos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <TouchableOpacity 
              style={styles.cardAlumno} 
              onPress={() => { setAlumnoSeleccionado(item); setSeccionActiva(null); }}
            >
              <View style={styles.infoRow}>
                <View style={styles.avatar}><Text style={styles.avatarTxt}>{procesarTexto(item.nombre?.charAt(0))}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nombreAlumno}>{procesarTexto(item.nombre)}</Text>
                  <Text style={styles.emailAlumno}>{procesarTexto(item.email)}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#3b82f6" />
              </View>
            </TouchableOpacity>


            <TouchableOpacity 
              style={styles.btnBorrar} 
              onPress={() => eliminarRegistro(item.id, item.nombre)}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
      />

      <Modal visible={!!alumnoSeleccionado && !modalDieta} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: '#f1f5f9'}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAlumnoSeleccionado(null)}><Ionicons name="chevron-back" size={28} color="#1e293b" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Expediente Alumno</Text>
            <TouchableOpacity onPress={() => exportarPDF(alumnoSeleccionado)}><FontAwesome5 name="file-pdf" size={22} color="#3b82f6" /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{padding: 15}} showsVerticalScrollIndicator={false}>
            <Section num={1} title="Datos Personales" color="#3b82f6" icon="user" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Nombre" value={alumnoSeleccionado?.nombre} />
               <Dato label="Teléfono" value={alumnoSeleccionado?.telefono} />
               <Dato label="Edad" value={alumnoSeleccionado?.datosFisicos?.edad} />
               <Dato label="Peso (kg)" value={alumnoSeleccionado?.datosFisicos?.peso} />
               <Dato label="Altura (cm)" value={alumnoSeleccionado?.datosFisicos?.altura} />
            </Section>

            <Section num={2} title="Medidas Corporales" color="#10b981" icon="ruler-horizontal" activa={seccionActiva} setActiva={setSeccionActiva}>
               <View style={styles.row}><Dato label="Cuello" value={alumnoSeleccionado?.medidas?.cuello} /><Dato label="Pecho" value={alumnoSeleccionado?.medidas?.pecho} /></View>
               <View style={styles.row}><Dato label="Brazo R" value={alumnoSeleccionado?.medidas?.brazoR} /><Dato label="Brazo F" value={alumnoSeleccionado?.medidas?.brazoF} /></View>
               <View style={styles.row}><Dato label="Cintura" value={alumnoSeleccionado?.medidas?.cintura} /><Dato label="Cadera" value={alumnoSeleccionado?.medidas?.cadera} /></View>
               <View style={styles.row}><Dato label="Muslo" value={alumnoSeleccionado?.medidas?.muslo} /><Dato label="Pierna" value={alumnoSeleccionado?.medidas?.pierna} /></View>
            </Section>

            {alumnoSeleccionado?.datosFisicos?.genero === 'mujer' && (
              <Section num={3} title="Ciclo Menstrual" color="#ec4899" icon="venus" activa={seccionActiva} setActiva={setSeccionActiva}>
                <Dato label="Estado" value={alumnoSeleccionado?.ciclo?.tipo} />
                <Dato label="Anticonceptivo" value={alumnoSeleccionado?.ciclo?.anticonceptivo} />
              </Section>
            )}

            <Section num={4} title="Historial Salud" color="#ef4444" icon="heartbeat" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Enf. Familiares" value={alumnoSeleccionado?.salud?.enfFam} />
               <Dato label="Enf. Propias" value={alumnoSeleccionado?.salud?.enfPers} />
               <Dato label="Lesión" value={alumnoSeleccionado?.salud?.detalleLesion} />
               <Dato label="Cirugía" value={alumnoSeleccionado?.salud?.detalleOperacion} />
            </Section>

            <Section num={5} title="Estilo de Vida (IPAQ)" color="#f59e0b" icon="walking" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Vigorosa" value={formatearActividad(alumnoSeleccionado?.ipaq?.vDias, alumnoSeleccionado?.ipaq?.vMin)} />
               <Dato label="Moderada" value={formatearActividad(alumnoSeleccionado?.ipaq?.mDias, alumnoSeleccionado?.ipaq?.mMin)} />
               <Dato label="Caminata" value={formatearActividad(alumnoSeleccionado?.ipaq?.cDias, alumnoSeleccionado?.ipaq?.cMin)} />
               <Dato label="Horas sentado" value={alumnoSeleccionado?.ipaq?.sentado} />
            </Section>

            <Section num={6} title="Nutrición y Objetivos" color="#8b5cf6" icon="utensils" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Dato label="Comidas Actuales" value={alumnoSeleccionado?.nutricion?.comidasAct} />
               <Dato label="Descripción Diario" value={alumnoSeleccionado?.nutricion?.descAct} />
               <Dato label="Días Entrenamiento" value={alumnoSeleccionado?.nutricion?.entrenos} />
               <Dato label="Comidas en Plan" value={alumnoSeleccionado?.nutricion?.comidasDes} />
               <Dato label="Objetivo" value={alumnoSeleccionado?.nutricion?.objetivo} />
            </Section>

            <Section num={7} title="Frecuencia Alimentos" color="#22c55e" icon="apple-alt" activa={seccionActiva} setActiva={setSeccionActiva}>
               {alumnoSeleccionado?.frecuenciaAlimentos && Object.entries(alumnoSeleccionado.frecuenciaAlimentos).map(([k, v]: any) => (
                 <Dato key={k} label={k} value={v} />
               ))}
            </Section>

            <Section num={8} title="Firma y Consentimiento" color="#1e293b" icon="file-signature" activa={seccionActiva} setActiva={setSeccionActiva}>
               <Text style={styles.consentTxt}>{consentimientoCompleto}</Text>
               <Image source={{ uri: alumnoSeleccionado?.firma }} style={styles.firmaPreview} resizeMode="contain" />
            </Section>

            {/* --- INSERCIÓN: BOTONES DE PLANES --- */}
            <View style={styles.planesContainer}>
               <TouchableOpacity style={[styles.btnAccion, {backgroundColor: '#a855f7'}]} onPress={() => abrirPlanAlimentacion(alumnoSeleccionado)}>
                 <FontAwesome5 name="apple-alt" size={18} color="white" />
                 <Text style={styles.btnAccionText}>Plan de Alimentación</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.btnAccion, {backgroundColor: '#22c55e'}]} onPress={() => abrirPlanEntrenamiento(alumnoSeleccionado)}>
                 <FontAwesome5 name="dumbbell" size={18} color="white" />
                 <Text style={styles.btnAccionText}>Plan de Entrenamiento</Text>
               </TouchableOpacity>
            </View>

            <View style={{height: 50}} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

{/* MODAL PLAN DE ALIMENTACIÓN INTELIGENTE */}
<Modal visible={modalDieta} animationType="slide">
  <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
    <View style={stylesNutri.header}>
      <TouchableOpacity onPress={() => setModalDieta(false)}><Ionicons name="close" size={28} color="#ef4444" /></TouchableOpacity>
      <Text style={stylesNutri.headerTitle}>Plan de: {alumnoSeleccionado?.nombre}</Text>
      <TouchableOpacity onPress={() => Alert.alert("Guardado", "Dieta enviada")}><Ionicons name="checkmark-circle" size={28} color="#22c55e" /></TouchableOpacity>
    </View>

    <ScrollView style={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      
{/* TARJETA DE CONTROL DE CALORÍAS Y FACTOR (ACTUALIZADA) */}
      <View style={[stylesNutri.macroCard, { backgroundColor: '#1e293b' }]}>
        
        {/* SELECTOR DE INTENSIDAD (FACTORES) */}
        <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: 'bold', marginBottom: 8 }}>NIVEL DE ACTIVIDAD FISICA:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 15 }}>
          {[
            { label: 'SEDENTARIO', desc: 'Poco o nada', val: 1.2 },
            { label: 'LEVE', desc: '3 días/sem', val: 1.375 },
            { label: 'MODERADO', desc: '5 días/sem', val: 1.55 },
            { label: 'VIGOROSO', desc: '6 días/sem', val: 1.725 },
            { label: 'ATLETA', desc: 'Muy intenso', val: 1.9 },
            { label: 'ALTO REND.', desc: 'Extremo', val: 6.0 },
          ].map((f) => (
            <TouchableOpacity 
              key={f.val} 
              onPress={() => setFactorActividad(f.val)}
              style={{ 
                backgroundColor: factorActividad === f.val ? '#3b82f6' : '#1e293b', 
                borderWidth: 1,
                borderColor: factorActividad === f.val ? '#60a5fa' : '#334155',
                padding: 8, 
                borderRadius: 8, 
                width: '31%', // Para que salgan 3 por fila
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold', textAlign: 'center' }}>{f.label}</Text>
              <Text style={{ color: factorActividad === f.val ? '#fff' : '#94a3b8', fontSize: 7, textAlign: 'center' }}>{f.desc}</Text>
              <Text style={{ color: '#60a5fa', fontSize: 9, fontWeight: 'bold', marginTop: 2 }}>{f.val}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BOTONES DE AJUSTE (DÉFICIT / SUPERÁVIT) */}
        <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: 'bold', marginBottom: 8 }}>AJUSTE DE OBJETIVO (KCAL):</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          {[200, 300, 400, 500].map((num) => (
            <TouchableOpacity 
              key={num} 
              onPress={() => setAjusteCalorico(-num)} 
              style={{ backgroundColor: ajusteCalorico === -num ? '#ef4444' : '#450a0a', padding: 6, borderRadius: 6, flex: 1, marginHorizontal: 2 }}
            >
              <Text style={{ color: '#fff', fontSize: 9, textAlign: 'center' }}>-{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
          {[200, 300, 400, 500].map((num) => (
            <TouchableOpacity 
              key={num} 
              onPress={() => setAjusteCalorico(num)} 
              style={{ backgroundColor: ajusteCalorico === num ? '#22c55e' : '#064e3b', padding: 6, borderRadius: 6, flex: 1, marginHorizontal: 2 }}
            >
              <Text style={{ color: '#fff', fontSize: 9, textAlign: 'center' }}>+{num}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            onPress={() => setAjusteCalorico(0)} 
            style={{ backgroundColor: ajusteCalorico === 0 ? '#3b82f6' : '#1e3a8a', padding: 6, borderRadius: 6, flex: 1, marginHorizontal: 2 }}
          >
            <Text style={{ color: '#fff', fontSize: 9, textAlign: 'center' }}>BASE</Text>
          </TouchableOpacity>
        </View>

        {/* RESULTADO FINAL DINÁMICO */}
        <View style={{ alignItems: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 12, marginBottom: 15 }}>
          <Text style={{ color: '#94a3b8', fontSize: 9 }}>META DIARIA FINAL</Text>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>
            {calcularMetabolismo(alumnoSeleccionado) + ajusteCalorico} 
            <Text style={{ fontSize: 12, color: '#60a5fa' }}> KCAL</Text>
          </Text>
        </View>

        {/* VISUALIZACIÓN DE MACROS ACTUALES */}
        <View style={stylesNutri.macroRow}>
          <MacroDisplay label="PROT" value={dietaActual.reduce((acc, i) => acc + parseFloat(i.p), 0).toFixed(1)} color="#60a5fa" />
          <MacroDisplay label="GRASA" value={dietaActual.reduce((acc, i) => acc + parseFloat(i.g), 0).toFixed(1)} color="#facc15" />
          <MacroDisplay label="CARBS" value={dietaActual.reduce((acc, i) => acc + parseFloat(i.c), 0).toFixed(1)} color="#4ade80" />
          <MacroDisplay 
            label="FALTAN" 
            value={( (calcularMetabolismo(alumnoSeleccionado) + ajusteCalorico) - dietaActual.reduce((acc, i) => acc + parseFloat(i.kcal), 0) ).toFixed(0)} 
            color="#f87171" 
          />
        </View>
      </View>

<TextInput 
  style={stylesNutri.searchInput}
  placeholder="Buscar alimento (ej: pollo, arroz...)"
  placeholderTextColor="#94a3b8"
  value={busqueda}
  onChangeText={(text) => {
    setBusqueda(text);
    if (text.length > 1) {
      // FILTRO INTELIGENTE:
      // Convierte todo a minúsculas y busca si el texto está INCLUIDO en el nombre
      const filtrados = alimentos.filter(item => 
        item.nombre.toLowerCase().includes(text.toLowerCase())
      );
      setAlimentosFiltrados(filtrados);
    } else {
      setAlimentosFiltrados([]);
    }
  }}
      />

{alimentosFiltrados.map((item) => (
  <TouchableOpacity 
    key={item.id} 
    style={stylesNutri.suggestionItem} 
    onPress={() => {
      // Tomamos la unidad que guardaste en la biblioteca (taza, pieza, etc.)
      const unidad = item.unidadMedida || "unidad"; 

      Alert.alert(
        `${item.nombre.toUpperCase()}`,
        `Selecciona la cantidad en [${unidad}]:`,
        [
          { text: "1/4", onPress: () => agregarAlPlan(item, 0.25, unidad) },
          { text: "1/2", onPress: () => agregarAlPlan(item, 0.5, unidad) },
          { text: "1", onPress: () => agregarAlPlan(item, 1, unidad) },
          { text: "2", onPress: () => agregarAlPlan(item, 2, unidad) },
          { 
            text: "Manual", 
            onPress: () => {
              Alert.prompt(
                "Cantidad Personalizada",
                `Ingresa el número de ${unidad}:`,
                (val) => {
                  const num = parseFloat(val || "0");
                  if (num > 0) agregarAlPlan(item, num, unidad);
                },
                "plain-text",
                "1"
              );
            }
          },
          { text: "Cancelar", style: "cancel" }
        ]
      );
    }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={stylesNutri.suggestionText}>{item.nombre.toUpperCase()}</Text>
      <Text style={{ fontSize: 10, color: '#3b82f6', fontWeight: 'bold' }}>{item.unidadMedida?.toUpperCase()}</Text>
    </View>
  </TouchableOpacity>
))}

      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 }}>Alimentos en el Plan:</Text>
        {dietaActual.map((item, index) => (
          <View key={index} style={stylesNutri.foodCard}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>{item.nombre.toUpperCase()}</Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>{item.porcion}g • P: {item.p}g | G: {item.g}g | C: {item.c}g</Text>
            </View>
            <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
              <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>{item.kcal} kcal</Text>
            </View>
            <TouchableOpacity onPress={() => setDietaActual(dietaActual.filter((_, i) => i !== index))}>
              <Ionicons name="trash" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  </SafeAreaView>
</Modal>
    </SafeAreaView>

  );
}

// COMPONENTES AUXILIARES
const MacroDisplay = ({ label, value, color }: any) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ color: color, fontSize: 10, fontWeight: 'bold' }}>{label}</Text>
    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{value}</Text>
  </View>
);


const Section = ({ num, title, color, icon, activa, setActiva, children }: any) => (
  <View style={styles.cardSection}>
    <TouchableOpacity style={styles.headerToggle} onPress={() => setActiva(activa === num ? null : num)}>
      <View style={styles.titleRow}>
        <View style={[styles.numCircle, {backgroundColor: color}]}><Text style={styles.numText}>{num}</Text></View>
        <FontAwesome5 name={icon} size={14} color={color} /><Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <FontAwesome name={activa === num ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
    </TouchableOpacity>
    {activa === num && <View style={styles.content}>{children}</View>}
  </View>
);

const Dato = ({ label, value }: any) => {
  const texto = (value !== undefined && value !== null) ? (Array.isArray(value) ? (value.length > 0 ? value.join(', ') : "NO") : (String(value) === '' || String(value) === 'no' || String(value) === '0' ? "NO" : String(value))) : "NO";
  const isNo = texto === "NO";
  
  return (
    <View style={styles.datoBox}>
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={[styles.datoValue, isNo && {color: '#ef4444'}]}>{texto}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerPrincipal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  logOutBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  list: { padding: 20 },
  cardContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardAlumno: { flex: 1, backgroundColor: '#fff', padding: 18, borderRadius: 16, elevation: 3 },
  btnBorrar: { padding: 12, marginLeft: 10, backgroundColor: '#fee2e2', borderRadius: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  nombreAlumno: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  emailAlumno: { fontSize: 12, color: '#64748b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  cardSection: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, elevation: 2, overflow: 'hidden' },
  headerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  numCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  content: { padding: 16, borderTopWidth: 1, borderTopColor: '#f8fafc', backgroundColor: '#fafafa' },
  datoBox: { marginBottom: 12 },
  datoLabel: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, fontWeight: '700' },
  datoValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  row: { flexDirection: 'row', gap: 20 },
  firmaPreview: { width: '100%', height: 120, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginTop: 15 },
  consentTxt: { fontSize: 10, color: '#475569', textAlign: 'justify', lineHeight: 16 },
  // ESTILOS INSERCIÓN BOTONES
  planesContainer: { marginTop: 20, gap: 12 },
  btnAccion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, gap: 10, elevation: 2 },
  btnAccionText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

const stylesNutri = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' },
  macroCard: { backgroundColor: '#1e3a8a', padding: 20, borderRadius: 20, marginBottom: 20 },
  macroTitle: { color: '#fff', fontSize: 10, textAlign: 'center', marginBottom: 15 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  searchInput: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', color: '#1e293b' },
  suggestionItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  suggestionText: { fontWeight: 'bold', color: '#1e293b' },
  foodCard: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderRadius: 12, marginTop: 10, elevation: 2 }
});