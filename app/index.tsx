import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import StatusBadge from '../components/StatusBadge';
import { getByPlate } from '../services/vehicle.service';
import { g } from '../styles/global';
import { colors } from '../utils/colors';
import { isBRPlate, normalizePlate } from '../utils/plate';

const fmtDate = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

export default function Home() {
    const router = useRouter();
    const logo = require('../assets/logo.png');

    const [plate, setPlate] = useState('');
    const [row, setRow] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const scrollRef = useRef<ScrollView>(null);

    const search = async () => {
        setErr(null);
        setRow(null);
        setHasSearched(true);

        const p = normalizePlate(plate);
        if (!isBRPlate(p)) {
            setErr('Placa inválida (formato ABC1D23).');
            return;
        }

        setLoading(true);
        const { data, error } = await getByPlate(p);
        setLoading(false);
        if (error) {
            setErr(error.message);
            return;
        }
        setRow(data || null);
        requestAnimationFrame(() =>
            scrollRef.current?.scrollTo({ y: 0, animated: true })
        );
    };

    return (
        <ScrollView
            ref={scrollRef}
            style={{ flex: 1, backgroundColor: colors.bg }}
            contentContainerStyle={{ padding: 16, paddingBottom: 48, rowGap: 12 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentInsetAdjustmentBehavior="always"
            automaticallyAdjustKeyboardInsets
            stickyHeaderIndices={[0]}
        >
            <View style={{ paddingBottom: 10, backgroundColor: colors.bg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity
                        onLongPress={() => router.push('/admin')}
                        delayLongPress={600}
                        accessibilityLabel="Abrir admin"
                    >
                        <Image source={logo} style={{ width: 40, height: 40, borderRadius: 8 }} />
                    </TouchableOpacity>

                    <Text style={[g.brandText, { color: colors.text }]}>P.A DO DECO</Text>

                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                        onPress={() => router.push('/admin')}
                        hitSlop={10}
                        accessibilityLabel="Admin"
                        style={{ opacity: 0.7 }}
                    >
                        <Ionicons name="construct-outline" size={22} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <Text style={[g.title, { marginTop: 12 }]}>Consulta por Placa</Text>
                <View style={{ flexDirection: 'row', columnGap: 8, marginTop: 8 }}>
                    <View style={{ flex: 1 }}>
                        <Input
                            placeholder="Placa"
                            autoCapitalize="characters"
                            value={plate}
                            onChangeText={setPlate}
                            returnKeyType="search"
                            onSubmitEditing={search}
                        />
                    </View>
                    <Button
                        title={loading ? 'Buscando...' : 'Buscar'}
                        onPress={search}
                        loading={loading}
                    />
                </View>

                {err && (
                    <Text style={[g.text, { marginTop: 6, color: '#ef4444' }]}>{err}</Text>
                )}
            </View>

            {hasSearched && (
                <View style={[g.card, { gap: 10 }]}>
                    <Text style={g.title}>Serviço atual</Text>
                    {row?.current_service_id ? (
                        <>
                            <StatusBadge status={row.current_status} />

                            <Text style={g.label}>Placa</Text>
                            <Text style={g.text}>{row.plate}</Text>

                            <Text style={g.label}>Datas</Text>
                            <Text style={g.text}>Início: {fmtDate(row.current_started_at)}</Text>
                            {row.current_finished_at ? (
                                <Text style={g.text}>Entrega: {fmtDate(row.current_finished_at)}</Text>
                            ) : null}

                            <Text style={g.label}>Descrição</Text>
                            <Text style={g.text}>{row.current_description ?? 'Sem descrição'}</Text>

                            <Text style={g.label}>Mecânico</Text>
                            <Text style={g.text}>{row.current_mechanic ?? '—'}</Text>

                            {row.current_signed_at ? (
                                <>
                                    <Text style={g.label}>Assinatura</Text>
                                    <Text style={g.text}>Assinado em: {fmtDate(row.current_signed_at)}</Text>
                                    {row?.current_signature_url ? (
                                        <Image
                                            key={row.current_signature_url}
                                            source={{ uri: row.current_signature_url }}
                                            style={{ height: 100, width: '100%', resizeMode: 'contain', marginTop: 6 }}
                                        />
                                    ) : null}
                                </>
                            ) : null}
                        </>
                    ) : (
                        <Text style={g.text}>Nenhum serviço cadastrado.</Text>
                    )}
                </View>
            )}

            {hasSearched && (
                <View style={[g.card, { gap: 10 }]}>
                    <Text style={g.title}>Serviço anterior</Text>
                    {row?.last_service_id ? (
                        <>
                            <StatusBadge status={row.last_status} />

                            <Text style={g.label}>Placa</Text>
                            <Text style={g.text}>{row.plate}</Text>

                            <Text style={g.label}>Datas</Text>
                            <Text style={g.text}>Início: {fmtDate(row.last_started_at)}</Text>
                            {row.last_finished_at ? (
                                <Text style={g.text}>Entrega: {fmtDate(row.last_finished_at)}</Text>
                            ) : null}

                            <Text style={g.label}>Descrição</Text>
                            <Text style={g.text}>{row.last_description ?? 'Sem descrição'}</Text>

                            <Text style={g.label}>Mecânico</Text>
                            <Text style={g.text}>{row.last_mechanic ?? '—'}</Text>

                            {row.last_signed_at ? (
                                <>
                                    <Text style={g.label}>Assinatura</Text>
                                    <Text style={g.text}>Assinado em: {fmtDate(row.last_signed_at)}</Text>
                                    {row.last_signature_url ? (
                                        <Image
                                            key={row.last_signature_url}
                                            source={{ uri: row.last_signature_url }}
                                            style={{ height: 100, width: '100%', resizeMode: 'contain', marginTop: 6 }}
                                        />
                                    ) : null}
                                </>
                            ) : null}
                        </>
                    ) : (
                        <Text style={g.text}>Sem serviço anterior.</Text>
                    )}
                </View>
            )}
        </ScrollView>
    );
}
