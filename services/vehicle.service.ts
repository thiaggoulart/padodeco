import { CurrentAndLastView } from '../types';
import { type ServiceStatus } from '../utils/status';

import { supabase } from './supabase';

export async function getByPlate(plate: string) {
  return await supabase.from('vehicle_current_and_last').select('*').eq('plate', plate).maybeSingle<CurrentAndLastView>();
}

export async function createService(opts: { plate: string; mechanic?: string; description: string; status: ServiceStatus }) {
  const { data: vehicle, error: vehicleError } = await supabase.from('vehicles').upsert({ plate: opts.plate }, { onConflict: 'plate' }).select().single();
  if (vehicleError) return { error: vehicleError };

  let mechanic_id: number | null = null;
  if (opts.mechanic?.trim()) {
    const { data: mech, error: mechanicError } = await supabase.from('mechanics').upsert({ name: opts.mechanic.trim() }, { onConflict: 'name' }).select().maybeSingle();
    if (mechanicError) return { error: mechanicError };
    mechanic_id = mech?.id ?? null;
  }

  return await supabase.from('services').insert({
    vehicle_id: vehicle.id,
    mechanic_id,
    description: opts.description,
    status: opts.status,
  });
}
export async function updateCurrentServiceByPlate(params: {
  plate: string;
  status?: ServiceStatus;
  mechanicName?: string | null;
  description?: string | null;
}) {
  const { plate, status, mechanicName, description } = params;
  return await supabase.rpc('update_current_service_by_plate', {
    p_plate: plate,
    p_status: status ?? null,
    p_mechanic_name: mechanicName ?? null,
    p_description: description ?? null,
  });
}

export async function finalizeCurrentServiceByPlate(plate: string) {
  return await supabase.rpc('finalize_current_service_by_plate', { p_plate: plate });
}
