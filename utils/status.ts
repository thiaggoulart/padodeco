export type ServiceStatus =
    | 'EM_ESPERA'
    | 'ESPERANDO_LIBERACAO'
    | 'EM_MANUTENCAO'
    | 'ESPERANDO_PECA'
    | 'PRONTO'
    | 'ENTREGUE';

export const STATUS_LABEL: Record<ServiceStatus, string> = {
    EM_ESPERA: 'Em espera',
    ESPERANDO_LIBERACAO: 'Esperando liberação',
    EM_MANUTENCAO: 'Em manutenção',
    ESPERANDO_PECA: 'Esperando peça',
    PRONTO: 'Pronto',
    ENTREGUE: 'Entregue',
};

export const STATUS_TONE: Record<ServiceStatus, { bg: string; fg: string }> = {
    EM_ESPERA: { bg: '#64748B', fg: '#FFFFFF' },
    ESPERANDO_LIBERACAO: { bg: '#EAB308', fg: '#0B0B0C' },
    EM_MANUTENCAO: { bg: '#3B82F6', fg: '#FFFFFF' },
    ESPERANDO_PECA: { bg: '#F97316', fg: '#0B0B0C' },
    PRONTO: { bg: '#A855F7', fg: '#FFFFFF' },
    ENTREGUE: { bg: '#22C55E', fg: '#0B0B0C' },
};
