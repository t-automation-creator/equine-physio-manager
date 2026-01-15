/**
 * Standardized query keys for React Query
 *
 * Using factory functions ensures consistent keys across the app
 * and enables proper cache invalidation patterns.
 *
 * Usage:
 *   useQuery({ queryKey: queryKeys.clients.all(), ... })
 *   useQuery({ queryKey: queryKeys.clients.detail(clientId), ... })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.clients.all() })
 */
export const queryKeys = {
  // User queries
  user: {
    current: () => ['user'],
  },

  // Appointment queries
  appointments: {
    all: () => ['appointments'],
    list: (filters) => ['appointments', 'list', filters],
    byDate: (date) => ['appointments', 'date', date],
    detail: (id) => ['appointments', 'detail', id],
  },

  // Client queries
  clients: {
    all: () => ['clients'],
    list: (filters) => ['clients', 'list', filters],
    detail: (id) => ['clients', 'detail', id],
  },

  // Horse queries
  horses: {
    all: () => ['horses'],
    list: (filters) => ['horses', 'list', filters],
    detail: (id) => ['horses', 'detail', id],
    byOwner: (ownerId) => ['horses', 'owner', ownerId],
  },

  // Yard queries
  yards: {
    all: () => ['yards'],
    list: (filters) => ['yards', 'list', filters],
    detail: (id) => ['yards', 'detail', id],
  },

  // Treatment queries
  treatments: {
    all: () => ['treatments'],
    byAppointment: (appointmentId) => ['treatments', 'appointment', appointmentId],
    byHorse: (horseId) => ['treatments', 'horse', horseId],
    detail: (appointmentId, horseId) => ['treatments', 'detail', appointmentId, horseId],
  },

  // Invoice queries
  invoices: {
    all: () => ['invoices'],
    list: (filters) => ['invoices', 'list', filters],
    detail: (id) => ['invoices', 'detail', id],
  },

  // Payment queries
  payments: {
    all: () => ['payments'],
    list: (filters) => ['payments', 'list', filters],
    byInvoice: (invoiceId) => ['payments', 'invoice', invoiceId],
  },
};
