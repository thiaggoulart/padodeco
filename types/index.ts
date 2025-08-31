import { ServiceStatus } from "@/utils/status";

export type VehicleRow = {
  id: number;
  plate: string;
  created_at: string;
};

export type MechanicRow = {
  id: number;
  name: string;
  created_at: string;
};

export type ServiceRow = {
  id: number;
  vehicle_id: number;
  mechanic_id: number | null;
  description: string;
  status: ServiceStatus;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type CurrentAndLastView = {
  plate: string;

  current_service_id: number | null;
  current_description: string | null;
  current_status: ServiceStatus | null;
  current_mechanic: string | null;
  current_started_at: string | null;
  current_finished_at: string | null;
  current_signature_url: string | null;
  current_signer_name: string | null;
  current_signed_at: string | null;

  last_service_id: number | null;
  last_description: string | null;
  last_status: ServiceStatus | null;
  last_mechanic: string | null;
  last_started_at: string | null;
  last_finished_at: string | null;
  last_signature_url: string | null;
  last_signer_name: string | null;
  last_signed_at: string | null;
};
