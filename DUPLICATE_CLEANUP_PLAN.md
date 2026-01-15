# Duplicate Client Cleanup Plan

## Problem Statement

Two "Sarah Thompson" client entries exist in the system with the same email but different phone numbers and different horses.

---

## Data Analysis

### Client Entry 1 (ID: `695919afe6a47da9c21ece4c`)

| Field | Value |
|-------|-------|
| Name | Sarah Thompson |
| Phone | 07712 345678 |
| Email | sarah.thompson@email.com |
| Horses | Bella (Show Jumping, Meadowbrook Stables), Apollo (Dressage, Meadowbrook Stables) |

### Client Entry 2 (ID: `69505aea4872ba4e16fddda8`)

| Field | Value |
|-------|-------|
| Name | Sarah Thompson |
| Phone | 07700 123456 |
| Email | sarah.thompson@email.com |
| Horses | Storm (Dressage, Meadow View Livery), Luna (Show Jumping, Meadow View Livery) |

### Key Observations

1. **Same person or different people?** Both have the same name and email, but different phone numbers and horses at different yards. This could be:
   - **Scenario A**: Same person with two phone numbers and horses at two different yards
   - **Scenario B**: Two different people who happen to share the same name and email (unlikely)

2. **Data relationships to consider**:
   - `Horse.owner_id` → references `Client.id`
   - `Appointment.client_id` → references `Client.id`
   - `Invoice.client_id` → references `Client.id`

---

## Decision Required

Before proceeding, you need to determine which scenario applies:

### If Same Person (Scenario A) - Merge Clients

If both entries represent the same person, merge them into one client record.

### If Different People (Scenario B) - Rename One

If these are genuinely different people, update one client's name to distinguish them (e.g., "Sarah Thompson (Meadow View)").

---

## Cleanup Option 1: Merge Clients (Recommended if Same Person)

### Step 1: Choose Primary Record

Decide which client record to keep as the "primary" record. Recommendation: Keep the one with more activity (appointments, invoices).

**Suggested Primary**: Client 1 (`695919afe6a47da9c21ece4c`) - Phone: 07712 345678

### Step 2: Update Horse Ownership

Transfer horses from the secondary client to the primary client.

```javascript
// Using Base44 SDK in browser console or a migration script

// Horses to transfer (from Client 2 to Client 1)
const horsesToTransfer = [
  // Storm and Luna belong to Client 2, need to move to Client 1
];

// Update each horse's owner_id
await base44.entities.Horse.update('<storm_horse_id>', {
  owner_id: '695919afe6a47da9c21ece4c'  // Primary client ID
});

await base44.entities.Horse.update('<luna_horse_id>', {
  owner_id: '695919afe6a47da9c21ece4c'  // Primary client ID
});
```

### Step 3: Update Appointments

Transfer any appointments from the secondary client to the primary client.

```javascript
// Find appointments for the secondary client
const appointments = await base44.entities.Appointment.filter({
  client_id: '69505aea4872ba4e16fddda8'  // Secondary client ID
});

// Update each to point to primary client
for (const appt of appointments) {
  await base44.entities.Appointment.update(appt.id, {
    client_id: '695919afe6a47da9c21ece4c'  // Primary client ID
  });
}
```

### Step 4: Update Invoices

Transfer any invoices from the secondary client to the primary client.

```javascript
// Find invoices for the secondary client
const invoices = await base44.entities.Invoice.filter({
  client_id: '69505aea4872ba4e16fddda8'  // Secondary client ID
});

// Update each to point to primary client
for (const inv of invoices) {
  await base44.entities.Invoice.update(inv.id, {
    client_id: '695919afe6a47da9c21ece4c'  // Primary client ID
  });
}
```

### Step 5: Update Primary Client Phone (Optional)

If you want to keep both phone numbers, update the primary client's notes or add a secondary phone field.

```javascript
await base44.entities.Client.update('695919afe6a47da9c21ece4c', {
  notes: 'Secondary phone: 07700 123456'
});
```

### Step 6: Delete Secondary Client

After all relationships are transferred, delete the secondary client.

```javascript
await base44.entities.Client.delete('69505aea4872ba4e16fddda8');
```

---

## Cleanup Option 2: Distinguish Clients (If Different People)

If these are genuinely different people, update one client's name to distinguish them.

### Step 1: Update Client Name

```javascript
// Add a distinguishing suffix to one of the clients
await base44.entities.Client.update('69505aea4872ba4e16fddda8', {
  name: 'Sarah Thompson (Meadow View)'
});
```

### Step 2: Update Email (If Different)

If they are different people, they should have different emails. Update one:

```javascript
await base44.entities.Client.update('69505aea4872ba4e16fddda8', {
  email: 'sarah.thompson2@email.com'  // Or get the correct email
});
```

---

## Implementation Options

### Option A: Manual Cleanup via App UI

1. Go to Client Detail for Client 2
2. Click Edit on each horse (Storm, Luna)
3. Change owner to Client 1 (Sarah Thompson - 07712 345678)
4. Check Appointments and Invoices pages for any referencing Client 2
5. Delete Client 2 via Edit > Delete (if available) or via database

### Option B: Script-Based Cleanup

Create a migration script to run in the Base44 environment:

```javascript
// cleanup-duplicate-client.js
// Run this in the Base44 function environment or browser console

async function mergeClients(primaryId, secondaryId) {
  console.log('Starting client merge...');
  
  // 1. Get all horses owned by secondary client
  const horses = await base44.entities.Horse.filter({ owner_id: secondaryId });
  console.log(`Found ${horses.length} horses to transfer`);
  
  for (const horse of horses) {
    await base44.entities.Horse.update(horse.id, { owner_id: primaryId });
    console.log(`Transferred horse: ${horse.name}`);
  }
  
  // 2. Get all appointments for secondary client
  const appointments = await base44.entities.Appointment.filter({ client_id: secondaryId });
  console.log(`Found ${appointments.length} appointments to transfer`);
  
  for (const appt of appointments) {
    await base44.entities.Appointment.update(appt.id, { client_id: primaryId });
    console.log(`Transferred appointment: ${appt.id}`);
  }
  
  // 3. Get all invoices for secondary client
  const invoices = await base44.entities.Invoice.filter({ client_id: secondaryId });
  console.log(`Found ${invoices.length} invoices to transfer`);
  
  for (const inv of invoices) {
    await base44.entities.Invoice.update(inv.id, { client_id: primaryId });
    console.log(`Transferred invoice: ${inv.id}`);
  }
  
  // 4. Delete secondary client
  await base44.entities.Client.delete(secondaryId);
  console.log('Deleted secondary client');
  
  console.log('Merge complete!');
}

// Execute the merge
mergeClients(
  '695919afe6a47da9c21ece4c',  // Primary (keep this one)
  '69505aea4872ba4e16fddda8'   // Secondary (delete this one)
);
```

### Option C: Add Delete Client Feature to App

If the app doesn't have a delete client feature, add one to `ClientDetail.jsx`:

```jsx
// Add to ClientDetail.jsx

const deleteClientMutation = useMutation({
  mutationFn: async () => {
    // Check for related records first
    const horses = await base44.entities.Horse.filter({ owner_id: clientId });
    const appointments = await base44.entities.Appointment.filter({ client_id: clientId });
    const invoices = await base44.entities.Invoice.filter({ client_id: clientId });
    
    if (horses.length > 0 || appointments.length > 0 || invoices.length > 0) {
      throw new Error('Cannot delete client with associated horses, appointments, or invoices. Please reassign or delete them first.');
    }
    
    return base44.entities.Client.delete(clientId);
  },
  onSuccess: () => {
    toast.success('Client deleted');
    navigate('/Clients');
  },
  onError: (error) => {
    toast.error(error.message);
  }
});
```

---

## Recommended Approach

1. **Confirm with the user** whether these are the same person or different people
2. **If same person**: Use Option B (script-based cleanup) for safety and auditability
3. **Backup first**: Export client data before making changes
4. **Test in staging**: If available, test the merge script in a non-production environment first

---

## Prevention: Add Duplicate Detection

To prevent future duplicates, consider adding validation to `NewClient.jsx`:

```jsx
// Add to NewClient.jsx before creating a new client

const checkDuplicate = async (email) => {
  const existing = await base44.entities.Client.filter({ email: email.toLowerCase() });
  return existing.length > 0 ? existing[0] : null;
};

// In the submit handler:
const existingClient = await checkDuplicate(formData.email);
if (existingClient) {
  toast.error(`A client with this email already exists: ${existingClient.name}`);
  return;
}
```

---

## Summary

| Step | Action | Risk Level |
|------|--------|------------|
| 1 | Confirm if same person | None |
| 2 | Backup data | None |
| 3 | Transfer horses | Low |
| 4 | Transfer appointments | Low |
| 5 | Transfer invoices | Low |
| 6 | Delete secondary client | Medium |
| 7 | Add duplicate prevention | None |

**Estimated Time**: 15-30 minutes for manual cleanup, 5 minutes for script-based cleanup.
