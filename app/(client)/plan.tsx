import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HistorialPlanesAlumno() {
    const [planes, setPlanes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const user = auth.currentUser;
    const router = useRouter();

    useEffect(() => {
        if (!user) return;

        // Consultamos todos los planes publicados para este alumno
        const q = query(
            collection(db, "alumnos_activos", user.uid, "planes"),
            where("estatus", "==", "Publicado"),
            orderBy("fechaPublicacion", "desc")
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const lista = snapshot.docs.map((doc, index, array) => ({
                id: doc.id,
                numeroPlan: array.length - index, // Esto genera "Plan 1, Plan 2..." dinámicamente
                ...doc.data()
            }));
            setPlanes(lista);
            setCargando(false);
        });

        return () => unsub();
    }, [user]);

    if (cargando) return <View style={styles.center}><ActivityIndicator size="large" color="#10b981" /></View>;

    return (
        <SafeAreaView style={styles.outerContainer}>
            <View style={styles.mainContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Mis Planes</Text>
                    <View style={styles.badge}><Text style={styles.badgeText}>{planes.length}</Text></View>
                </View>

                <FlatList
                    data={planes}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <FontAwesome5 name="clock" size={50} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Tu Coach está preparando tu primer plan.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.planCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.planNumber}>PLAN {item.numeroPlan}</Text>
                                <Text style={styles.planDate}>
                                    {item.fechaPublicacion?.toDate().toLocaleDateString()}
                                </Text>
                            </View>

                            <Text style={styles.objetivoText}>{item.objetivo || "Mejora de composición corporal"}</Text>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
                                    onPress={() => router.push({ pathname: '/(client)/dieta', params: { planId: item.id } } as any)}
                                >
                                    <FontAwesome5 name="utensils" size={14} color="#3b82f6" />
                                    <Text style={[styles.btnText, { color: '#3b82f6' }]}>Alimentación</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#f0fdf4' }]}
                                    onPress={() => router.push({ pathname: '/(client)/rutina', params: { planId: item.id } } as any)}
                                >
                                    <FontAwesome5 name="dumbbell" size={14} color="#10b981" />
                                    <Text style={[styles.btnText, { color: '#10b981' }]}>Ejercicio</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: '#f1f5f9' },
    mainContainer: { flex: 1, backgroundColor: '#f8fafc', alignSelf: 'center', width: '100%', maxWidth: 600 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 25, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    badge: { backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    planCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    planNumber: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    planDate: { fontSize: 12, color: '#94a3b8' },
    objetivoText: { fontSize: 14, color: '#64748b', marginBottom: 20 },
    buttonRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, gap: 8 },
    btnText: { fontWeight: 'bold', fontSize: 13 },
    empty: { marginTop: 100, alignItems: 'center' },
    emptyText: { color: '#94a3b8', marginTop: 15, textAlign: 'center' }
});