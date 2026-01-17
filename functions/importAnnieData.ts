import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

/**
 * Annie's Cliniko Data Import Function
 *
 * This function imports Annie McAndrew's Cliniko data into her account.
 * All records are tagged with created_by: "annievetphysio@gmail.com"
 *
 * Import order (dependencies matter!):
 * 1. Appointment Types - no dependencies
 * 2. Clients - no dependencies
 * 3. Horses - depends on Clients (owner_id)
 * 4. Appointments - depends on Horses, Clients, Types
 * 5. Treatments - depends on Horses, Appointments
 * 6. Settings - no dependencies
 */

const ANNIE_EMAIL = "annievetphysio@gmail.com";

// Data cleaning utilities
function cleanAddress(address: string | null | undefined): string {
  if (!address) return '';
  // Remove Python None artifacts
  if (address === 'None None None None' || address === 'null') return '';
  return address.trim();
}

function cleanString(str: string | null | undefined): string {
  if (!str || str === 'null' || str === 'None') return '';
  return str.trim();
}

function parseDate(isoString: string): string {
  // "2024-04-26T16:00:00Z" → "2024-04-26"
  if (!isoString) return '';
  return isoString.split('T')[0];
}

function parseTime(isoString: string): string {
  // "2024-04-26T16:00:00Z" → "16:00"
  if (!isoString) return '';
  const match = isoString.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : '';
}

function flattenTreatmentContent(content: any): string {
  if (!content || !content.sections) return '';

  const parts: string[] = [];
  for (const section of content.sections) {
    if (section.name) {
      parts.push(`## ${section.name}\n`);
    }
    if (section.questions) {
      for (const q of section.questions) {
        if (q.answer) {
          // Strip HTML tags for cleaner text
          const cleanAnswer = q.answer.replace(/<[^>]*>/g, '').trim();
          if (cleanAnswer) {
            parts.push(`**${q.name}:** ${cleanAnswer}\n`);
          }
        }
      }
    }
  }
  return parts.join('\n');
}

// Rate limiting helper
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify this is Annie's account
    if (user.email !== ANNIE_EMAIL) {
      return Response.json({
        error: `This import is configured for ${ANNIE_EMAIL}. Current user: ${user.email}`
      }, { status: 403 });
    }

    const { action, data } = await req.json();

    // ========================================
    // STEP 1: Import Appointment Types
    // ========================================
    if (action === 'import_appointment_types') {
      const appointmentTypes = data?.appointmentTypes || [];
      const results = [];
      const idMap: Record<string, string> = {};

      for (const type of appointmentTypes) {
        try {
          const created = await base44.asServiceRole.entities.AppointmentType.create({
            name: type.name,
            duration_in_minutes: type.duration_in_minutes,
            color: type.color || '#B8D9FF',
            description: cleanString(type.description),
            created_by: ANNIE_EMAIL
          });
          idMap[type.id] = created.id;
          results.push({ success: true, id: created.id, name: type.name });
          await delay(50); // Rate limiting
        } catch (err) {
          results.push({ success: false, id: type.id, error: err.message });
        }
      }

      return Response.json({
        success: true,
        type: 'appointment_types',
        imported: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        idMap,
        details: results
      });
    }

    // ========================================
    // STEP 2: Import Clients
    // ========================================
    if (action === 'import_clients') {
      const clients = data?.clients || [];
      const results = [];
      const idMap: Record<string, string> = {};

      for (const client of clients) {
        try {
          const created = await base44.asServiceRole.entities.Client.create({
            name: cleanString(client.name),
            email: cleanString(client.email) || '',
            phone: cleanString(client.phone) || '',
            address: cleanAddress(client.address),
            created_by: ANNIE_EMAIL
          });
          idMap[client.id] = created.id;
          results.push({ success: true, id: created.id, name: client.name });
          await delay(50);
        } catch (err) {
          results.push({ success: false, id: client.id, error: err.message });
        }
      }

      return Response.json({
        success: true,
        type: 'clients',
        imported: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        idMap,
        details: results
      });
    }

    // ========================================
    // STEP 3: Import Horses (needs clientIdMap)
    // ========================================
    if (action === 'import_horses') {
      const horses = data?.horses || [];
      const clientIdMap = data?.clientIdMap || {};
      const results = [];
      const idMap: Record<string, string> = {};

      for (const horse of horses) {
        try {
          const mappedOwnerId = clientIdMap[horse.owner_id];

          const created = await base44.asServiceRole.entities.Horse.create({
            name: cleanString(horse.name),
            owner_id: mappedOwnerId || null,
            sex: cleanString(horse.sex) || null,
            age: horse.age || null,
            discipline: horse.discipline || null,
            medical_notes: cleanString(horse.medical_notes) || '',
            created_by: ANNIE_EMAIL
          });
          idMap[horse.id] = created.id;
          results.push({
            success: true,
            id: created.id,
            name: horse.name,
            linked_to_client: !!mappedOwnerId
          });
          await delay(50);
        } catch (err) {
          results.push({ success: false, id: horse.id, error: err.message });
        }
      }

      return Response.json({
        success: true,
        type: 'horses',
        imported: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        linked: results.filter(r => r.success && r.linked_to_client).length,
        unlinked: results.filter(r => r.success && !r.linked_to_client).length,
        idMap,
        details: results
      });
    }

    // ========================================
    // STEP 4: Import Appointments (needs all maps)
    // ========================================
    if (action === 'import_appointments') {
      const appointments = data?.appointments || [];
      const clientIdMap = data?.clientIdMap || {};
      const horseIdMap = data?.horseIdMap || {};
      const appointmentTypeIdMap = data?.appointmentTypeIdMap || {};
      const results = [];
      const idMap: Record<string, string> = {};

      let batchCount = 0;
      for (const appt of appointments) {
        try {
          // Map horse IDs - appointments reference patient_id from Cliniko
          // We need to look up by cliniko_id pattern
          const horseIds: string[] = [];

          // Check if horse_ids is already an array
          if (Array.isArray(appt.horse_ids)) {
            for (const hid of appt.horse_ids) {
              const mappedId = horseIdMap[hid];
              if (mappedId) horseIds.push(mappedId);
            }
          }

          // Map client_id
          const mappedClientId = appt.client_id ? clientIdMap[appt.client_id] : null;

          // Map appointment_type_id
          const mappedTypeId = appt.appointment_type_id ? appointmentTypeIdMap[appt.appointment_type_id] : null;

          // Parse date and time from different possible formats
          let date = appt.date;
          let time = appt.time;

          if (appt.starts_at) {
            date = parseDate(appt.starts_at);
            time = parseTime(appt.starts_at);
          }

          const created = await base44.asServiceRole.entities.Appointment.create({
            date: date,
            time: time || null,
            client_id: mappedClientId || null,
            horse_ids: horseIds,
            appointment_type_id: mappedTypeId || null,
            notes: cleanString(appt.notes) || '',
            status: appt.status || 'completed',
            created_by: ANNIE_EMAIL
          });

          idMap[appt.id] = created.id;
          results.push({
            success: true,
            id: created.id,
            has_client: !!mappedClientId,
            has_horses: horseIds.length > 0,
            has_type: !!mappedTypeId
          });

          batchCount++;
          if (batchCount % 50 === 0) {
            await delay(200); // Longer pause every 50 records
          } else {
            await delay(30);
          }
        } catch (err) {
          results.push({ success: false, id: appt.id, error: err.message });
        }
      }

      return Response.json({
        success: true,
        type: 'appointments',
        imported: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        with_client: results.filter(r => r.success && r.has_client).length,
        with_horses: results.filter(r => r.success && r.has_horses).length,
        with_type: results.filter(r => r.success && r.has_type).length,
        idMap
      });
    }

    // ========================================
    // STEP 5: Import Treatments (needs horse and appointment maps)
    // ========================================
    if (action === 'import_treatments') {
      const treatments = data?.treatments || [];
      const horseIdMap = data?.horseIdMap || {};
      const appointmentIdMap = data?.appointmentIdMap || {};
      const results = [];

      for (const treatment of treatments) {
        try {
          const mappedHorseId = treatment.horse_id ? horseIdMap[treatment.horse_id] : null;
          const mappedApptId = treatment.appointment_id ? appointmentIdMap[treatment.appointment_id] : null;

          // Flatten the structured notes content
          let notes = treatment.notes;
          if (typeof notes === 'object' && notes.sections) {
            notes = flattenTreatmentContent(notes);
          } else if (typeof notes !== 'string') {
            notes = '';
          }

          const created = await base44.asServiceRole.entities.Treatment.create({
            horse_id: mappedHorseId || null,
            appointment_id: mappedApptId || null,
            treatment_types: treatment.treatment_types || [],
            notes: notes,
            status: treatment.status || 'completed',
            created_date: treatment.created_date || treatment.finalized_at,
            created_by: ANNIE_EMAIL
          });

          results.push({
            success: true,
            id: created.id,
            linked_to_horse: !!mappedHorseId,
            linked_to_appointment: !!mappedApptId
          });
          await delay(50);
        } catch (err) {
          results.push({ success: false, id: treatment.id, error: err.message });
        }
      }

      return Response.json({
        success: true,
        type: 'treatments',
        imported: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        linked_to_horse: results.filter(r => r.success && r.linked_to_horse).length,
        linked_to_appointment: results.filter(r => r.success && r.linked_to_appointment).length,
        details: results
      });
    }

    // ========================================
    // STEP 6: Import Settings
    // ========================================
    if (action === 'import_settings') {
      const settings = data?.settings || {};

      const created = await base44.asServiceRole.entities.Settings.create({
        business_name: settings.business_name || 'Annie McAndrew Vet Physio',
        home_address: cleanAddress(settings.home_address) || 'Mousley House Farm, Case Lane Hatton CV35 7JG',
        phone: settings.phone || '07946854950',
        created_by: ANNIE_EMAIL
      });

      return Response.json({
        success: true,
        type: 'settings',
        imported: 1,
        data: created
      });
    }

    // ========================================
    // FULL IMPORT - Orchestrates all steps
    // ========================================
    if (action === 'full_import') {
      const { appointmentTypes, clients, horses, appointments, treatments, settings } = data;

      const summary = {
        appointmentTypes: { imported: 0, failed: 0 },
        clients: { imported: 0, failed: 0 },
        horses: { imported: 0, failed: 0, linked: 0 },
        appointments: { imported: 0, failed: 0, with_links: 0 },
        treatments: { imported: 0, failed: 0, linked: 0 },
        settings: { imported: 0 }
      };

      const idMaps = {
        appointmentTypes: {} as Record<string, string>,
        clients: {} as Record<string, string>,
        horses: {} as Record<string, string>,
        appointments: {} as Record<string, string>
      };

      // Step 1: Appointment Types
      for (const type of (appointmentTypes || [])) {
        try {
          const created = await base44.asServiceRole.entities.AppointmentType.create({
            name: type.name,
            duration_in_minutes: type.duration_in_minutes,
            color: type.color || '#B8D9FF',
            description: cleanString(type.description),
            created_by: ANNIE_EMAIL
          });
          idMaps.appointmentTypes[type.id] = created.id;
          summary.appointmentTypes.imported++;
          await delay(50);
        } catch (err) {
          summary.appointmentTypes.failed++;
        }
      }

      // Step 2: Clients
      for (const client of (clients || [])) {
        try {
          const created = await base44.asServiceRole.entities.Client.create({
            name: cleanString(client.name),
            email: cleanString(client.email) || '',
            phone: cleanString(client.phone) || '',
            address: cleanAddress(client.address),
            created_by: ANNIE_EMAIL
          });
          idMaps.clients[client.id] = created.id;
          summary.clients.imported++;
          await delay(50);
        } catch (err) {
          summary.clients.failed++;
        }
      }

      // Step 3: Horses
      for (const horse of (horses || [])) {
        try {
          const mappedOwnerId = idMaps.clients[horse.owner_id];
          const created = await base44.asServiceRole.entities.Horse.create({
            name: cleanString(horse.name),
            owner_id: mappedOwnerId || null,
            sex: cleanString(horse.sex) || null,
            age: horse.age || null,
            discipline: horse.discipline || null,
            medical_notes: cleanString(horse.medical_notes) || '',
            created_by: ANNIE_EMAIL
          });
          idMaps.horses[horse.id] = created.id;
          summary.horses.imported++;
          if (mappedOwnerId) summary.horses.linked++;
          await delay(50);
        } catch (err) {
          summary.horses.failed++;
        }
      }

      // Step 4: Appointments
      let batchCount = 0;
      for (const appt of (appointments || [])) {
        try {
          const horseIds: string[] = [];
          if (Array.isArray(appt.horse_ids)) {
            for (const hid of appt.horse_ids) {
              const mappedId = idMaps.horses[hid];
              if (mappedId) horseIds.push(mappedId);
            }
          }

          const mappedClientId = appt.client_id ? idMaps.clients[appt.client_id] : null;
          const mappedTypeId = appt.appointment_type_id ? idMaps.appointmentTypes[appt.appointment_type_id] : null;

          let date = appt.date;
          let time = appt.time;
          if (appt.starts_at) {
            date = parseDate(appt.starts_at);
            time = parseTime(appt.starts_at);
          }

          const created = await base44.asServiceRole.entities.Appointment.create({
            date: date,
            time: time || null,
            client_id: mappedClientId || null,
            horse_ids: horseIds,
            appointment_type_id: mappedTypeId || null,
            notes: cleanString(appt.notes) || '',
            status: appt.status || 'completed',
            created_by: ANNIE_EMAIL
          });

          idMaps.appointments[appt.id] = created.id;
          summary.appointments.imported++;
          if (mappedClientId || horseIds.length > 0) summary.appointments.with_links++;

          batchCount++;
          if (batchCount % 50 === 0) {
            await delay(200);
          } else {
            await delay(30);
          }
        } catch (err) {
          summary.appointments.failed++;
        }
      }

      // Step 5: Treatments
      for (const treatment of (treatments || [])) {
        try {
          const mappedHorseId = treatment.horse_id ? idMaps.horses[treatment.horse_id] : null;
          const mappedApptId = treatment.appointment_id ? idMaps.appointments[treatment.appointment_id] : null;

          let notes = treatment.notes;
          if (typeof notes === 'object' && notes.sections) {
            notes = flattenTreatmentContent(notes);
          } else if (typeof notes !== 'string') {
            notes = '';
          }

          await base44.asServiceRole.entities.Treatment.create({
            horse_id: mappedHorseId || null,
            appointment_id: mappedApptId || null,
            treatment_types: treatment.treatment_types || [],
            notes: notes,
            status: treatment.status || 'completed',
            created_date: treatment.created_date || treatment.finalized_at,
            created_by: ANNIE_EMAIL
          });

          summary.treatments.imported++;
          if (mappedHorseId) summary.treatments.linked++;
          await delay(50);
        } catch (err) {
          summary.treatments.failed++;
        }
      }

      // Step 6: Settings
      if (settings) {
        try {
          await base44.asServiceRole.entities.Settings.create({
            business_name: settings.business_name || 'Annie McAndrew Vet Physio',
            home_address: cleanAddress(settings.home_address) || 'Mousley House Farm, Case Lane Hatton CV35 7JG',
            phone: settings.phone || '07946854950',
            created_by: ANNIE_EMAIL
          });
          summary.settings.imported = 1;
        } catch (err) {
          // Settings may already exist
        }
      }

      return Response.json({
        success: true,
        type: 'full_import',
        summary,
        idMaps
      });
    }

    return Response.json({
      error: 'Invalid action. Use: import_appointment_types, import_clients, import_horses, import_appointments, import_treatments, import_settings, or full_import'
    }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
