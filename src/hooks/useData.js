import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { queryKeys } from '@/lib/query-keys';
import { CACHE_PRESETS } from '@/lib/query-client';

/**
 * Hook to get the current authenticated user
 */
export function useUser() {
  return useQuery({
    queryKey: queryKeys.user.current(),
    queryFn: () => base44.auth.me(),
    ...CACHE_PRESETS.user,
  });
}

/**
 * Hook to fetch all clients for the current user
 */
export function useClients(options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.clients.all(),
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', {
        entity: 'Client',
        query: {},
      });
      return response.data.data || [];
    },
    enabled: !!user,
    ...CACHE_PRESETS.referenceData,
    ...options,
  });
}

/**
 * Hook to fetch a single client by ID
 */
export function useClient(clientId, options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.clients.detail(clientId),
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0] || null;
    },
    enabled: !!user && !!clientId,
    ...CACHE_PRESETS.referenceData,
    ...options,
  });
}

/**
 * Hook to fetch all horses for the current user
 */
export function useHorses(options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.horses.all(),
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', {
        entity: 'Horse',
        query: {},
      });
      return response.data.data || [];
    },
    enabled: !!user,
    ...CACHE_PRESETS.referenceData,
    ...options,
  });
}

/**
 * Hook to fetch horses by owner ID
 */
export function useHorsesByOwner(ownerId, options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.horses.byOwner(ownerId),
    queryFn: async () => {
      const horses = await base44.entities.Horse.filter({ owner_id: ownerId });
      return horses || [];
    },
    enabled: !!user && !!ownerId,
    ...CACHE_PRESETS.referenceData,
    ...options,
  });
}

/**
 * Hook to fetch a single horse by ID
 */
export function useHorse(horseId, options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.horses.detail(horseId),
    queryFn: async () => {
      const horses = await base44.entities.Horse.filter({ id: horseId });
      return horses[0] || null;
    },
    enabled: !!user && !!horseId,
    ...CACHE_PRESETS.referenceData,
    ...options,
  });
}

/**
 * Hook to fetch all yards for the current user
 */
export function useYards(options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.yards.all(),
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', {
        entity: 'Yard',
        query: {},
      });
      return response.data.data || [];
    },
    enabled: !!user,
    ...CACHE_PRESETS.referenceData,
    ...options,
  });
}

/**
 * Hook to fetch a single yard by ID
 */
export function useYard(yardId, options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.yards.detail(yardId),
    queryFn: async () => {
      const yards = await base44.entities.Yard.filter({ id: yardId });
      return yards[0] || null;
    },
    enabled: !!user && !!yardId,
    ...CACHE_PRESETS.referenceData,
    ...options,
  });
}

/**
 * Hook to fetch all appointments for the current user
 */
export function useAppointments(options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.appointments.all(),
    queryFn: async () => {
      const appointments = await base44.entities.Appointment.filter(
        { created_by: user.email },
        '-date'
      );
      return appointments || [];
    },
    enabled: !!user,
    ...CACHE_PRESETS.appointments,
    ...options,
  });
}

/**
 * Hook to fetch appointments for a specific date
 */
export function useAppointmentsByDate(date, options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.appointments.byDate(date),
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', {
        entity: 'Appointment',
        query: { date },
      });
      return response.data.data || [];
    },
    enabled: !!user && !!date,
    ...CACHE_PRESETS.appointments,
    ...options,
  });
}

/**
 * Hook to fetch a single appointment by ID
 */
export function useAppointment(appointmentId, options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.appointments.detail(appointmentId),
    queryFn: async () => {
      const appointments = await base44.entities.Appointment.filter({ id: appointmentId });
      return appointments[0] || null;
    },
    enabled: !!user && !!appointmentId,
    ...CACHE_PRESETS.appointments,
    ...options,
  });
}

/**
 * Hook to fetch all treatments for the current user
 */
export function useTreatments(options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.treatments.all(),
    queryFn: async () => {
      const treatments = await base44.entities.Treatment.filter({
        created_by: user.email,
      });
      return treatments || [];
    },
    enabled: !!user,
    ...CACHE_PRESETS.treatments,
    ...options,
  });
}

/**
 * Hook to fetch treatments for an appointment
 */
export function useTreatmentsByAppointment(appointmentId, options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.treatments.byAppointment(appointmentId),
    queryFn: async () => {
      const treatments = await base44.entities.Treatment.filter({
        appointment_id: appointmentId,
      });
      return treatments || [];
    },
    enabled: !!user && !!appointmentId,
    ...CACHE_PRESETS.treatments,
    ...options,
  });
}

/**
 * Hook to fetch all invoices for the current user
 */
export function useInvoices(options = {}) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: queryKeys.invoices.all(),
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', {
        entity: 'Invoice',
        query: {},
      });
      return response.data.data || [];
    },
    enabled: !!user,
    ...CACHE_PRESETS.invoices,
    ...options,
  });
}

/**
 * Hook to prefetch data for faster navigation
 * Call this on hover or visible items to preload data
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchClient = (clientId) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.clients.detail(clientId),
      queryFn: async () => {
        const clients = await base44.entities.Client.filter({ id: clientId });
        return clients[0] || null;
      },
      ...CACHE_PRESETS.referenceData,
    });
  };

  const prefetchHorse = (horseId) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.horses.detail(horseId),
      queryFn: async () => {
        const horses = await base44.entities.Horse.filter({ id: horseId });
        return horses[0] || null;
      },
      ...CACHE_PRESETS.referenceData,
    });
  };

  const prefetchAppointment = (appointmentId) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.appointments.detail(appointmentId),
      queryFn: async () => {
        const appointments = await base44.entities.Appointment.filter({ id: appointmentId });
        return appointments[0] || null;
      },
      ...CACHE_PRESETS.appointments,
    });
  };

  return {
    prefetchClient,
    prefetchHorse,
    prefetchAppointment,
  };
}
