import { Client, Yard, Horse, Appointment, Treatment, Invoice, Settings, User } from '@/api/entities';

// Get the current user's email (used for created_by filtering)
export const getCurrentUserEmail = async () => {
  try {
    const user = await User.me();
    return user?.email || null;
  } catch (err) {
    console.error('Failed to get current user email:', err);
    return null;
  }
};

// Secure create - Base44 auto-populates created_by, so just verify auth
export const secureCreate = async (Entity, data) => {
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) {
    throw new Error('User not authenticated');
  }

  // Base44 automatically sets created_by to user's email
  return Entity.create(data);
};

// Secure update - verifies ownership via created_by before updating
export const secureUpdate = async (Entity, id, data) => {
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) {
    throw new Error('User not authenticated');
  }

  // Get the existing record to verify ownership
  const existing = await Entity.get(id);
  if (!existing || existing.created_by !== userEmail) {
    throw new Error('Access denied: You do not own this record');
  }

  return Entity.update(id, data);
};

// Secure delete - verifies ownership via created_by before deleting
export const secureDelete = async (Entity, id) => {
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) {
    throw new Error('User not authenticated');
  }

  // Get the existing record to verify ownership
  const existing = await Entity.get(id);
  if (!existing || existing.created_by !== userEmail) {
    throw new Error('Access denied: You do not own this record');
  }

  return Entity.delete(id);
};

// Secure list - filters by created_by (user's email)
export const secureList = async (Entity, filters = {}) => {
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) {
    throw new Error('User not authenticated');
  }

  return Entity.filter({
    ...filters,
    created_by: userEmail
  });
};

// Secure get - verifies ownership via created_by before returning
export const secureGet = async (Entity, id) => {
  const userEmail = await getCurrentUserEmail();
  if (!userEmail) {
    throw new Error('User not authenticated');
  }

  const record = await Entity.get(id);
  if (!record || record.created_by !== userEmail) {
    throw new Error('Access denied: You do not own this record');
  }

  return record;
};

// Create secure wrappers for each entity
const createSecureEntity = (Entity) => ({
  create: (data) => secureCreate(Entity, data),
  update: (id, data) => secureUpdate(Entity, id, data),
  delete: (id) => secureDelete(Entity, id),
  list: (filters) => secureList(Entity, filters),
  filter: (filters) => secureList(Entity, filters), // Alias for list
  get: (id) => secureGet(Entity, id),
  // Expose the raw entity for cases where you need direct access (use with caution)
  raw: Entity
});

// Export secure versions of each entity
export const SecureClient = createSecureEntity(Client);
export const SecureYard = createSecureEntity(Yard);
export const SecureHorse = createSecureEntity(Horse);
export const SecureAppointment = createSecureEntity(Appointment);
export const SecureTreatment = createSecureEntity(Treatment);
export const SecureInvoice = createSecureEntity(Invoice);
export const SecureSettings = createSecureEntity(Settings);

export default {
  getCurrentUserEmail,
  secureCreate,
  secureUpdate,
  secureDelete,
  secureList,
  secureGet,
  SecureClient,
  SecureYard,
  SecureHorse,
  SecureAppointment,
  SecureTreatment,
  SecureInvoice,
  SecureSettings
};
