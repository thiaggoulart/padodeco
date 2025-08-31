import type { ServiceStatus } from '../utils/status';
import { supabase } from './supabase';

const normalizePlate = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

async function ensureVehicle(plate: string) {
  const p = normalizePlate(plate);
  const { data, error } = await supabase
    .from('vehicles')
    .upsert({ plate: p }, { onConflict: 'plate' })
    .select('id')
    .single();
  if (error) throw error;
  return data!.id as number;
}

async function ensureMechanicByName(name?: string | null) {
  if (!name) return null;
  const { data: found, error: fErr } = await supabase
    .from('mechanics')
    .select('id')
    .ilike('name', name)
    .maybeSingle();
  if (fErr) throw fErr;
  if (found?.id) return found.id as number;
  const { data: created, error: cErr } = await supabase
    .from('mechanics')
    .insert({ name })
    .select('id')
    .single();
  if (cErr) throw cErr;
  return created.id as number;
}

export async function getByPlate(plate: string) {
  const p = normalizePlate(plate);
  return await supabase
    .from('vehicle_current_and_last')
    .select('*')
    .eq('plate', p)
    .limit(1)
    .maybeSingle();
}

export async function getOpenServices() {
  return await supabase
    .from('vehicle_current_and_last')
    .select(`
      plate,
      current_service_id,
      current_description,
      current_status,
      current_mechanic,
      current_started_at,
      current_finished_at
    `)
    .not('current_service_id', 'is', null)
    .neq('current_status', 'ENTREGUE')
    .order('current_started_at', { ascending: false });
}

type CreatePayload = {
  plate: string;
  status: ServiceStatus;
  mechanic_name?: string | null;
  description?: string | null;
  started_at?: string | null;
};

export async function createService(payload: CreatePayload) {
  const vehicleId = await ensureVehicle(payload.plate);
  const mechanicId = await ensureMechanicByName(payload.mechanic_name ?? null);
  const insert = {
    vehicle_id: vehicleId,
    mechanic_id: mechanicId,
    description: payload.description ?? null,
    status: payload.status,
    started_at: payload.started_at ?? new Date().toISOString(),
  };
  return await supabase.from('services').insert(insert).select('*');
}

export async function updateCurrentServiceByPlate(
  plate: string,
  patch: Partial<{
    status: ServiceStatus | null;
    mechanic_name: string | null;
    description: string | null;
    started_at: string | null;
    finished_at: string | null;
  }>
) {
  const { data: viewRow, error: viewErr } = await getByPlate(plate);
  if (viewErr) return { data: null, error: viewErr };
  const currentId = viewRow?.current_service_id as number | null;
  if (!currentId) return { data: null, error: new Error('Nenhum serviço atual para essa placa.') };

  let mechanic_id: number | null | undefined = undefined;
  if (patch.hasOwnProperty('mechanic_name')) {
    mechanic_id = await ensureMechanicByName(patch.mechanic_name ?? null);
  }

  const updateBody: any = {};
  if (typeof mechanic_id !== 'undefined') updateBody.mechanic_id = mechanic_id;
  if (patch.description !== undefined) updateBody.description = patch.description;
  if (patch.status !== undefined && patch.status !== null) updateBody.status = patch.status;
  if (patch.started_at !== undefined) updateBody.started_at = patch.started_at;
  if (patch.finished_at !== undefined) updateBody.finished_at = patch.finished_at;

  return await supabase.from('services').update(updateBody).eq('id', currentId).select('*');
}
