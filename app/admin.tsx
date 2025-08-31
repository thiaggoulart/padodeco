import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import StatusBadge from '../components/StatusBadge';
import { supabase } from '../services/supabase';
import {
    createService,
    getByPlate,
    getOpenServices,
    updateCurrentServiceByPlate,
} from '../services/vehicle.service';
import { g } from '../styles/global';
import { colors } from '../utils/colors';
import { normalizePlate } from '../utils/plate';
import { STATUS_LABEL, STATUS_TONE, type ServiceStatus } from '../utils/status';

const fmtDate = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const EDIT_STATUSES: ServiceStatus[] = [
    'EM_ESPERA',
    'ESPERANDO_LIBERACAO',
    'EM_MANUTENCAO',
    'ESPERANDO_PECA',
    'PRONTO',
    'ENTREGUE',
];

const CREATE_STATUSES: ServiceStatus[] = ['EM_ESPERA', 'EM_MANUTENCAO'];

type EditState =
    | {
        plate: string;
        status: ServiceStatus;
        mechanic: string;
        description: string;
        startedAt: string | null;
        finishedAt: string | null;
        signatureUrl?: string | null;
        signedAt?: string | null;
    }
    | null;

type CreateState =
    | { plate: string; status: ServiceStatus; mechanic: string; description: string }
    | null;

type LastInfo =
    | {
        plate: string;
        status: ServiceStatus | null;
        mechanic: string | null;
        description: string | null;
        startedAt: string | null;
        finishedAt: string | null;
        signerName: string | null;
        signedAt: string | null;
        signatureUrl: string | null;
    }
    | null;

type OpenRow = {
    plate: string;
    current_service_id: number;
    current_description: string | null;
    current_status: ServiceStatus;
    current_mechanic: string | null;
    current_started_at: string | null;
    current_finished_at: string | null;
};

export default function Admin() {
    const router = useRouter();
    const params = useLocalSearchParams<{ reset?: string }>();
    const [email, setEmail] = useState('');
    const [pwd, setPwd] = useState('');
    const [authOk, setAuthOk] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [searchPlate, setSearchPlate] = useState('');
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [edit, setEdit] = useState<EditState>(null);
    const [creating, setCreating] = useState<CreateState>(null);
    const [last, setLast] = useState<LastInfo>(null);
    const [flash, setFlash] = useState<string | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [savingCreate, setSavingCreate] = useState(false);
    const [openList, setOpenList] = useState<OpenRow[]>([]);
    const [loadingOpen, setLoadingOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        let sub: any;
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuthOk(!!session);
            setAuthLoading(false);
        });
        const s = supabase.auth.onAuthStateChange((_e, session) => {
            setAuthOk(!!session);
        });
        sub = s.data?.subscription;
        return () => sub?.unsubscribe?.();
    }, []);

    const setFlash2s = (text: string) => {
        setFlash(text);
        setTimeout(() => setFlash(null), 2000);
    };

    const fetchOpen = useCallback(async () => {
        setLoadingOpen(true);
        const { data, error } = await getOpenServices();
        setLoadingOpen(false);
        if (error) {
            setFlash2s(error.message);
            return;
        }
        setOpenList(data ?? []);
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOpen();
        setRefreshing(false);
    }, [fetchOpen]);

    useFocusEffect(
        useCallback(() => {
            if (authOk && !hasSearched) {
                void fetchOpen();
            }
        }, [authOk, hasSearched, fetchOpen])
    );

    useFocusEffect(
        useCallback(() => {
            if (params?.reset === '1') {
                setSearchPlate('');
                setHasSearched(false);
                setEdit(null);
                setCreating(null);
                setLast(null);
                setFlash('Assinatura salva');
                setTimeout(() => setFlash(null), 2000);
                void fetchOpen();
            }
        }, [params?.reset, fetchOpen])
    );

    const login = async () => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pwd,
        });
        if (error) {
            setFlash2s(error.message);
            return;
        }
        setAuthOk(true);
    };

    const computeLast = (data: any): LastInfo => {
        if (!data) return null;

        if (data.current_service_id && data.current_status === 'ENTREGUE') {
            return {
                plate: data.plate,
                status: (data.current_status ?? 'EM_ESPERA') as ServiceStatus,
                mechanic: data.current_mechanic,
                description: data.current_description,
                startedAt: data.current_started_at ?? null,
                finishedAt: data.current_finished_at ?? null,
                signerName: data.current_signer_name ?? null,
                signedAt: data.current_signed_at ?? null,
                signatureUrl: data.current_signature_url ?? null,
            };
        }

        if (data.last_service_id) {
            return {
                plate: data.plate,
                status: data.last_status,
                mechanic: data.last_mechanic,
                description: data.last_description,
                startedAt: data.last_started_at ?? null,
                finishedAt: data.last_finished_at ?? null,
                signerName: data.last_signer_name ?? null,
                signedAt: data.last_signed_at ?? null,
                signatureUrl: data.last_signature_url ?? null,
            };
        }
        return null;
    };

    const handleSearch = async (forcedPlate?: string) => {
        const p = normalizePlate((forcedPlate ?? searchPlate).trim());
        if (!p) {
            setFlash2s('Informe uma placa válida.');
            return;
        }

        setHasSearched(true);
        setEdit(null);
        setCreating(null);
        setLast(null);

        setSearching(true);
        const { data, error } = await getByPlate(p);
        setSearching(false);
        if (error) {
            setFlash2s(error.message);
            return;
        }

        if (!data) {
            setCreating({ plate: p, status: 'EM_ESPERA', mechanic: '', description: '' });
            setLast(null);
            return;
        }

        if (data.current_service_id && data.current_status === 'ENTREGUE') {
            setCreating({ plate: data.plate, status: 'EM_ESPERA', mechanic: '', description: '' });
            setLast(computeLast(data));
            return;
        }

        if (data.current_service_id) {
            setEdit({
                plate: data.plate,
                status: data.current_status as ServiceStatus,
                mechanic: data.current_mechanic ?? '',
                description: data.current_description ?? '',
                startedAt: data.current_started_at ?? null,
                finishedAt: data.current_finished_at ?? null,
                signatureUrl: data.current_signature_url ?? null,
                signedAt: data.current_signed_at ?? null,
            });
            setLast(computeLast(data));
            return;
        }

        setCreating({ plate: p, status: 'EM_ESPERA', mechanic: '', description: '' });
        setLast(computeLast(data));
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
    };

    const refreshAfterChange = async (plate: string) => {
        const { data } = await getByPlate(plate);
        setLast(computeLast(data));

        if (data?.current_service_id && data.current_status !== 'ENTREGUE') {
            setEdit({
                plate: data.plate,
                status: (data.current_status ?? 'EM_ESPERA') as ServiceStatus,
                mechanic: data.current_mechanic ?? '',
                description: data.current_description ?? '',
                startedAt: data.current_started_at ?? null,
                finishedAt: data.current_finished_at ?? null,
                signatureUrl: data.current_signature_url ?? null,
                signedAt: data.current_signed_at ?? null,
            });
        } else {
            setEdit(null);
        }
    };

    const handleSaveEdit = async () => {
        if (!edit) return;
        setSavingEdit(true);

        const patch: any = {
            status: edit.status,
            mechanic_name: edit.mechanic || null,
            description: edit.description || null,
            started_at: edit.startedAt ?? null,
            finished_at: edit.finishedAt ?? null,
        };

        if (edit.status === 'ENTREGUE' && !patch.finished_at) {
            patch.finished_at = new Date().toISOString();
        }

        const { data, error } = await updateCurrentServiceByPlate(edit.plate, patch);

        setSavingEdit(false);
        if (error) {
            setFlash(error.message);
            setTimeout(() => setFlash(null), 2000);
            return;
        }

        const updated = Array.isArray(data) ? data[0] : data;

        if (edit.status === 'ENTREGUE' && updated?.id) {
            router.push({
                pathname: '/signature',
                params: { serviceId: String(updated.id), plate: edit.plate },
            });
            return;
        }

        await handleSearch(edit.plate);
        setFlash('Serviço atualizado ✅');
        setTimeout(() => setFlash(null), 2000);
    };

    const handleSaveCreate = async () => {
        if (!creating) return;
        setSavingCreate(true);
        const { error } = await createService({
            plate: creating.plate,
            status: creating.status,
            mechanic_name: creating.mechanic || undefined,
            description: creating.description || '',
        });
        setSavingCreate(false);
        if (error) {
            setFlash2s(error.message);
            return;
        }

        setCreating(null);
        await refreshAfterChange(creating.plate);
        setFlash2s('Serviço criado');
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
    };

    const handleCancel = () => {
        setEdit(null);
        setCreating(null);
        setHasSearched(false);
        void fetchOpen();
    };

    if (authLoading) {
        return (
            <View style={g.screen}>
                <Text style={g.text}>Carregando…</Text>
            </View>
        );
    }

    if (!authOk) {
        return (
            <View style={g.screen}>
                <Text style={g.title}>Admin</Text>
                <Input
                    placeholder="email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
                <Input placeholder="senha" secureTextEntry value={pwd} onChangeText={setPwd} />
                <Button title="Entrar" onPress={login} />
                {flash && (
                    <Text
                        style={[
                            g.text,
                            { marginTop: 12, color: flash.includes('✅') ? '#22c55e' : '#ff6b6b' },
                        ]}
                    >
                        {flash}
                    </Text>
                )}
            </View>
        );
    }

    return (
        <ScrollView
            ref={scrollRef}
            style={{ flex: 1, backgroundColor: colors.bg }}
            contentContainerStyle={{ padding: 16, paddingBottom: 64, rowGap: 12 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentInsetAdjustmentBehavior="always"
            automaticallyAdjustKeyboardInsets
            stickyHeaderIndices={[0]}
            refreshControl={
                !hasSearched ? (
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                ) : undefined
            }
        >
            <View style={{ paddingBottom: 8, backgroundColor: colors.bg }}>
                <Text style={g.title}>Serviço por Placa</Text>
                <View style={{ flexDirection: 'row', columnGap: 8, marginTop: 8 }}>
                    <View style={{ flex: 1 }}>
                        <Input
                            placeholder="Placa do veículo"
                            value={searchPlate}
                            onChangeText={(t) => {
                                setSearchPlate(t);
                                if (t.trim() === '') {
                                    setHasSearched(false);
                                    setEdit(null);
                                    setCreating(null);
                                    setLast(null);
                                    void fetchOpen();
                                }
                            }}
                            autoCapitalize="characters"
                            returnKeyType="search"
                            onSubmitEditing={() => {
                                void handleSearch();
                            }}
                        />
                    </View>
                    <Button
                        title={searching ? 'Buscando...' : 'Buscar'}
                        onPress={() => void handleSearch()}
                        loading={searching}
                    />
                </View>
            </View>

            {(!hasSearched || searchPlate.trim() === '') && (
                <View style={{ rowGap: 12 }}>
                    <View style={[g.card, { gap: 8, paddingBottom: 10 }]}>
                        <Text style={g.title}>Serviços abertos</Text>
                        <Text style={g.text}>
                            Puxe para atualizar. Toque em um card para gerenciar.
                        </Text>
                    </View>

                    {loadingOpen ? (
                        <View style={[g.card]}>
                            <Text style={g.text}>Carregando…</Text>
                        </View>
                    ) : openList.length === 0 ? (
                        <View style={[g.card]}>
                            <Text style={g.text}>Nenhum serviço aberto.</Text>
                        </View>
                    ) : (
                        openList.map((item) => (
                            <Pressable
                                key={`${item.plate}-${item.current_service_id}`}
                                onPress={() => {
                                    const p = normalizePlate(item.plate);
                                    setSearchPlate(p);
                                    void handleSearch(p);
                                }}
                            >
                                <View style={[g.card, { gap: 8 }]}>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Text style={[g.title, { flex: 1 }]}>{item.plate}</Text>
                                        <StatusBadge status={item.current_status} />
                                    </View>

                                    <Text style={g.label}>Datas</Text>
                                    <Text style={g.text}>Início: {fmtDate(item.current_started_at)}</Text>
                                    {item.current_finished_at ? (
                                        <Text style={g.text}>Entrega: {fmtDate(item.current_finished_at)}</Text>
                                    ) : null}

                                    <Text style={g.label}>Mecânico</Text>
                                    <Text style={g.text}>{item.current_mechanic ?? '—'}</Text>

                                    <Text style={g.label}>Descrição</Text>
                                    <Text style={g.text}>{item.current_description || 'Sem descrição'}</Text>
                                </View>
                            </Pressable>
                        ))
                    )}
                </View>
            )}

            {edit && (
                <View style={[g.card, { gap: 10 }]}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Text style={g.title}>Editar serviço atual</Text>
                        <StatusBadge status={edit.status} />
                    </View>

                    <Text style={g.label}>Placa</Text>
                    <Text style={g.text}>{edit.plate}</Text>

                    <Text style={g.label}>Datas</Text>
                    <Text style={g.text}>Início: {fmtDate(edit.startedAt)}</Text>
                    {edit.finishedAt ? <Text style={g.text}>Entrega: {fmtDate(edit.finishedAt)}</Text> : null}

                    <Text style={g.label}>Status</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {EDIT_STATUSES.map((s) => (
                            <Button
                                key={s}
                                title={STATUS_LABEL[s]}
                                tone={STATUS_TONE[s]}
                                variant={s === edit.status ? 'primary' : 'ghost'}
                                onPress={() => setEdit((p) => (p ? { ...p, status: s } : p))}
                            />
                        ))}
                    </View>

                    <Text style={g.label}>Mecânico</Text>
                    <Input
                        placeholder="Nome do mecânico"
                        value={edit.mechanic}
                        onChangeText={(t) => setEdit((p) => (p ? { ...p, mechanic: t } : p))}
                    />

                    <Text style={g.label}>Descrição (uma por linha)</Text>
                    <Input
                        multiline
                        placeholder="Ex:&#10;- Troca de pastilha&#10;- Vazamento mangueira&#10;- Revisão elétrica"
                        value={edit.description}
                        onChangeText={(t) => setEdit((p) => (p ? { ...p, description: t } : p))}
                    />

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Button title="Cancelar" variant="ghost" onPress={handleCancel} />
                        <View style={{ flex: 1 }}>
                            <Button
                                title={savingEdit ? 'Salvando...' : 'Salvar'}
                                onPress={handleSaveEdit}
                                loading={savingEdit}
                            />
                        </View>
                    </View>
                </View>
            )}

            {/* Criar */}
            {!edit && creating && (
                <View style={[g.card, { gap: 10 }]}>
                    <Text style={g.label}>Placa</Text>
                    <Text style={g.text}>{creating.plate}</Text>

                    <Text style={g.label}>Status</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {CREATE_STATUSES.map((s) => (
                            <Button
                                key={s}
                                title={STATUS_LABEL[s]}
                                tone={STATUS_TONE[s]}
                                variant={s === creating.status ? 'primary' : 'ghost'}
                                onPress={() => setCreating((p) => (p ? { ...p, status: s } : p))}
                            />
                        ))}
                    </View>

                    <Text style={g.label}>Mecânico (opcional)</Text>
                    <Input
                        placeholder="Nome do mecânico"
                        value={creating.mechanic}
                        onChangeText={(t) => setCreating((p) => (p ? { ...p, mechanic: t } : p))}
                    />

                    <Text style={g.label}>Descrição (uma por linha)</Text>
                    <Input
                        multiline
                        placeholder="Ex:&#10;- Troca de pastilha&#10;- Vazamento mangueira&#10;- Revisão elétrica"
                        value={creating.description}
                        onChangeText={(t) => setCreating((p) => (p ? { ...p, description: t } : p))}
                    />

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Button title="Cancelar" variant="ghost" onPress={handleCancel} />
                        <View style={{ flex: 1 }}>
                            <Button
                                title={savingCreate ? 'Salvando...' : 'Salvar'}
                                onPress={handleSaveCreate}
                                loading={savingCreate}
                            />
                        </View>
                    </View>
                </View>
            )}

            {hasSearched && (
                <View style={[g.card, { gap: 10 }]}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Text style={g.title}>Último serviço</Text>
                        {last?.status ? <StatusBadge status={last.status} /> : null}
                    </View>

                    {last ? (
                        <>
                            <Text style={g.label}>Placa</Text>
                            <Text style={g.text}>{last.plate}</Text>

                            <Text style={g.label}>Datas</Text>
                            <Text style={g.text}>Início: {fmtDate(last.startedAt)}</Text>
                            {last.finishedAt ? (
                                <Text style={g.text}>Entrega: {fmtDate(last.finishedAt)}</Text>
                            ) : null}

                            <Text style={g.label}>Mecânico</Text>
                            <Text style={g.text}>{last.mechanic ?? '—'}</Text>

                            <Text style={g.label}>Descrição</Text>
                            <Text style={g.text}>{last.description || 'Sem descrição'}</Text>

                            <Text style={g.label}>Assinatura</Text>
                            {last?.signedAt ? (
                                <>
                                    <Text style={g.text}>Assinado em: {fmtDate(last.signedAt)}</Text>
                                    {last.signatureUrl ? (
                                        <Image
                                            key={last.signatureUrl}
                                            source={{ uri: last.signatureUrl }}
                                            style={{ height: 100, width: '100%', resizeMode: 'contain' }}
                                        />
                                    ) : null}
                                </>
                            ) : (
                                <Text style={g.text}>—</Text>
                            )}
                        </>
                    ) : (
                        <Text style={g.text}>Sem histórico de serviço.</Text>
                    )}
                </View>
            )}

            {flash && (
                <Text
                    style={[
                        g.text,
                        { textAlign: 'center', marginTop: 4, color: flash.includes('✅') ? '#22c55e' : '#ff6b6b' },
                    ]}
                >
                    {flash}
                </Text>
            )}
        </ScrollView>
    );
}
