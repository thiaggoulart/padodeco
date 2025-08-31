import { decode as atob } from 'base-64';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import Signature from 'react-native-signature-canvas';
import Button from '../components/Button';
import { supabase } from '../services/supabase';
import { g } from '../styles/global';

const fmtDate = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const dataUrlToBytes = (dataUrl: string) => {
    const [header, b64] = dataUrl.split(',');
    if (!b64) throw new Error('DataURL inválido');
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
};

export default function SignatureScreen() {
    const router = useRouter();
    const { serviceId, plate } = useLocalSearchParams<{ serviceId: string | string[]; plate: string | string[] }>();

    const sid = Number(Array.isArray(serviceId) ? serviceId[0] : serviceId);
    const plateStr = Array.isArray(plate) ? plate[0] : plate;

    const ref = useRef<any>(null);
    const [sig, setSig] = useState<string | null>(null);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [pendingUpload, setPendingUpload] = useState(false);
    const [saving, setSaving] = useState(false);

    const upload = async (dataUrlArg?: string) => {
        try {
            const { data: sess } = await supabase.auth.getSession();
            if (!sess.session) {
                Alert.alert('Sessão', 'Você precisa estar logado para salvar a assinatura.');
                return;
            }

            const dataUrl = dataUrlArg ?? sig;
            if (!dataUrl) throw new Error('Sem assinatura');

            setSaving(true);

            const bucketId = 'signatures';
            const path = `service-${sid}.png`;
            console.log('[signature] path ->', path);

            const fileBytes = dataUrlToBytes(dataUrl);
            console.log('[signature] bytes length ->', fileBytes.length);

            const { data: upData, error: upErr } = await supabase
                .storage
                .from(bucketId)
                .upload(path, fileBytes, {
                    contentType: 'image/png',
                    upsert: true,
                });

            console.log('[signature] upload ->', upData, upErr);
            if (upErr) throw new Error(upErr.message ?? 'Falha no upload');

            const supaUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
            const publicUrl = `${supaUrl}/storage/v1/object/public/${bucketId}/${encodeURIComponent(path)}?t=${Date.now()}`;
            console.log('[signature] publicUrl ->', publicUrl);

            const { error: updErr } = await supabase
                .from('services')
                .update({
                    signature_url: publicUrl,
                    signer_name: null,
                    signed_at: new Date().toISOString(),
                })
                .eq('id', sid);

            console.log('[signature] update services ->', updErr ?? 'ok');
            if (updErr) throw new Error(updErr.message ?? 'Falha ao salvar no serviço');

            Alert.alert('Assinatura', 'Assinatura salva');

            router.replace({ pathname: '/admin', params: { reset: '1' } });
        } catch (e: any) {
            console.log('[signature] FATAL ->', e?.message ?? e);
            Alert.alert('Erro', e?.message ?? 'Falha ao salvar assinatura');
        } finally {
            setSaving(false);
        }
    };

    const handleOK = (signatureDataUrl: string) => {
        setSig(signatureDataUrl);
        if (pendingUpload) {
            setPendingUpload(false);
            void upload(signatureDataUrl);
        }
    };

    const handleEnd = () => setHasDrawn(true);

    const clear = () => {
        setSig(null);
        setHasDrawn(false);
        ref.current?.clearSignature();
    };

    const handleSavePress = () => {
        if (!hasDrawn && !sig) {
            Alert.alert('Assinatura', 'Faça a assinatura primeiro');
            return;
        }
        if (!sig) {
            setPendingUpload(true);
            ref.current?.readSignature();
            return;
        }
        void upload(sig);
    };

    return (
        <View style={[g.screen, { gap: 12 }]}>
            <Text style={g.title}>Assinatura do cliente</Text>
            <Text style={g.text}>Placa: {plateStr}</Text>
            <Text style={g.text}>Data: {fmtDate(new Date().toISOString())}</Text>

            <View style={{ height: 260, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }}>
                <Signature
                    ref={ref}
                    onOK={handleOK}
                    onEnd={handleEnd}
                    onEmpty={() => setHasDrawn(false)}
                    descriptionText="Assine no quadro"
                    webStyle=".m-signature-pad--footer {display:none;}"
                    backgroundColor="#ffffff"
                    imageType="image/png"
                    clearText="Limpar"
                    confirmText="Salvar"
                    autoClear={false}
                />
            </View>

            {sig ? (
                <View style={[g.card, { backgroundColor: '#1b1b1f' }]}>
                    <Text style={g.label}>Prévia</Text>
                    <Image source={{ uri: sig }} style={{ height: 100, width: '100%', resizeMode: 'contain' }} />
                </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="Limpar" variant="ghost" onPress={clear} />
                <View style={{ flex: 1 }}>
                    <Button title={saving ? 'Salvando...' : 'Salvar assinatura'} onPress={handleSavePress} loading={saving} />
                </View>
            </View>
        </View>
    );
}
