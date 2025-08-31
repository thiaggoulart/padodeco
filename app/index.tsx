import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import Button from '../components/Button';
import Input from '../components/Input';
import StatusBadge from '../components/StatusBadge';

import { g } from '../styles/global';
import { colors } from '../utils/colors';
import { type ServiceStatus } from '../utils/status';

import { getByPlate } from '../services/vehicle.service';

const normalizePlate = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
const fmtDate = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

type ViewRow = {
    plate: string;
    current_service_id: number | null;
    current_description: string | null;
    current_status: ServiceStatus | null;
    current_mechanic: string | null;
    current_started_at: string | null;
    current_finished_at: string | null;
    current_signature_url?: string | null;
    current_signer_name?: string | null;
    current_signed_at?: string | null;
    last_service_id: number | null;
    last_description: string | null;
    last_status: ServiceStatus | null;
    last_mechanic: string | null;
    last_started_at: string | null;
    last_finished_at: string | null;
    last_signature_url?: string | null;
    last_signer_name?: string | null;
    last_signed_at?: string | null;
};

export default function Home() {
    const router = useRouter();

    const [plate, setPlate] = useState('');
    const [loading, setLoading] = useState(false);
    const [row, setRow] = useState<ViewRow | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        const p = normalizePlate(plate.trim());
        if (!p) {
            setErr('Informe uma placa válida.');
            setRow(null);
            setHasSearched(false);
            return;
        }
        setLoading(true);
        setErr(null);
        setHasSearched(true);
        const { data, error } = await getByPlate(p);
        setLoading(false);

        if (error) {
            setErr(error.message);
            setRow(null);
            return;
        }
        setRow(data ?? null);
    };

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: colors.bg }}
            contentContainerStyle={{ padding: 16, paddingBottom: 64, rowGap: 12 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentInsetAdjustmentBehavior="automatic"
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Image
                    source={require('../assets/logo.png')}
                    style={{ width: 48, height: 48, resizeMode: 'contain', marginRight: 12 }}
                />
                <Text style={[g.title, { flex: 1 }]}>P.A DO DECO</Text>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/admin')}
                    hitSlop={10}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#F3F4F6',
                    }}
                >
                    <MaterialCommunityIcons name="tools" size={22} color={colors.primary} />
                </Pressable>
            </View>

            <Text style={g.title}>Consulta por Placa</Text>
            <View style={{ flexDirection: 'row', columnGap: 8, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                    <Input
                        placeholder="Placa do veículo"
                        value={plate}
                        onChangeText={setPlate}
                        autoCapitalize="characters"
                        returnKeyType="search"
                        onSubmitEditing={() => void handleSearch()}
                    />
                </View>
                <Button
                    title={loading ? 'Buscando...' : 'Buscar'}
                    onPress={() => void handleSearch()}
                />
            </View>

            {err ? (
                <Text style={[g.text, { color: '#DC2626', marginTop: 6 }]}>{err}</Text>
            ) : null}

            {hasSearched ? (
                <>
                    <View style={[g.card, { gap: 10 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={g.title}>Serviço atual</Text>
                            {row?.current_status ? <StatusBadge status={row.current_status} /> : null}
                        </View>

                        {row ? (
                            <>
                                <Text style={g.label}>Placa</Text>
                                <Text style={g.text}>{row.plate}</Text>

                                <Text style={g.label}>Datas</Text>
                                <Text style={g.text}>Início: {fmtDate(row.current_started_at)}</Text>
                                {row.current_finished_at ? (
                                    <Text style={g.text}>Entrega: {fmtDate(row.current_finished_at)}</Text>
                                ) : null}

                                <Text style={g.label}>Descrição</Text>
                                <Text style={g.text}>{row.current_description || 'Sem descrição'}</Text>

                                <Text style={g.label}>Mecânico</Text>
                                <Text style={g.text}>{row.current_mechanic ?? '—'}</Text>

                                <Text style={g.label}>Assinatura</Text>
                                {row.current_signed_at ? (
                                    <>
                                        <Text style={g.text}>Assinado em: {fmtDate(row.current_signed_at)}</Text>
                                        {row.current_signature_url ? (
                                            <Image
                                                key={row.current_signature_url}
                                                source={{ uri: row.current_signature_url }}
                                                style={{ height: 120, width: '100%', resizeMode: 'contain' }}
                                            />
                                        ) : null}
                                    </>
                                ) : (
                                    <Text style={g.text}>—</Text>
                                )}
                            </>
                        ) : (
                            <Text style={g.text}>Nenhum serviço cadastrado.</Text>
                        )}
                    </View>

                    <View style={[g.card, { gap: 10 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={g.title}>Serviço anterior</Text>
                            {row?.last_status ? <StatusBadge status={row.last_status} /> : null}
                        </View>

                        {row && row.last_service_id ? (
                            <>
                                <Text style={g.label}>Placa</Text>
                                <Text style={g.text}>{row.plate}</Text>

                                <Text style={g.label}>Datas</Text>
                                <Text style={g.text}>Início: {fmtDate(row.last_started_at)}</Text>
                                {row.last_finished_at ? (
                                    <Text style={g.text}>Entrega: {fmtDate(row.last_finished_at)}</Text>
                                ) : null}

                                <Text style={g.label}>Descrição</Text>
                                <Text style={g.text}>{row.last_description || 'Sem descrição'}</Text>

                                <Text style={g.label}>Mecânico</Text>
                                <Text style={g.text}>{row.last_mechanic ?? '—'}</Text>

                                <Text style={g.label}>Assinatura</Text>
                                {row.last_signed_at ? (
                                    <>
                                        <Text style={g.text}>Assinado em: {fmtDate(row.last_signed_at)}</Text>
                                        {row.last_signature_url ? (
                                            <Image
                                                key={row.last_signature_url}
                                                source={{ uri: row.last_signature_url }}
                                                style={{ height: 120, width: '100%', resizeMode: 'contain' }}
                                            />
                                        ) : null}
                                    </>
                                ) : (
                                    <Text style={g.text}>—</Text>
                                )}
                            </>
                        ) : (
                            <Text style={g.text}>Sem serviço anterior.</Text>
                        )}
                    </View>
                </>
            ) : null}
        </ScrollView>
    );
}