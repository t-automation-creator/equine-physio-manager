// COMMENTED OUT - Import function kept for reference
// Last used: 2026-01-18
// Successfully imported all Cliniko data for annievetphysio@gmail.com
// To re-enable: uncomment the entire file

/*
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

// Cliniko data import function
// This function imports pre-exported Cliniko data for a specific user

const CLINIKO_DATA = {
  "clients": [
    {"id":"client_1","name":"EMILE FAURIE","email":"emilefaurie@hotmail.co.uk","phone":"","address":"Heath Farm, Milton-Under-Wychwood"},
    {"id":"client_2","name":"GEORGIE WEST","email":null,"phone":"","address":""},
    {"id":"client_3","name":"JESSIE MCCONKEY","email":null,"phone":"","address":""},
    {"id":"client_4","name":"LYN HANNAM","email":null,"phone":"","address":""},
    {"id":"client_5","name":"McAndrew","email":null,"phone":"","address":""},
    {"id":"client_6","name":"AMANDA WASDELL","email":null,"phone":"","address":""},
    {"id":"client_7","name":"NATALIE SHERLOCK","email":"natalie.sherlock@hotmail.co.uk","phone":"","address":""},
    {"id":"client_8","name":"EMMA SHERLOCK","email":"emmasherlock@hotmail.co.uk","phone":"","address":""},
    {"id":"client_9","name":"AIMEE SHERLOCK","email":"aimeesherlock@hotmail.co.uk","phone":"","address":""},
    // ... truncated for brevity - full data will be loaded from file
  ],
  "appointment_types": [
    {"id":"appt_type_1","name":"Equine Physio","duration_in_minutes":60,"color":"#B8D9FF","description":null},
    {"id":"appt_type_2","name":"INDIBA","duration_in_minutes":45,"color":"#f7b6ec","description":null},
    {"id":"appt_type_3","name":"Canine Physio","duration_in_minutes":60,"color":"#d7f2ca","description":null},
    {"id":"appt_type_4","name":"Grooming","duration_in_minutes":30,"color":"#e5dcfe","description":null},
    {"id":"appt_type_5","name":"PENCIL IN","duration_in_minutes":30,"color":"#B8D9FF","description":"contact owner because horse is due treatment"}
  ],
  "settings": {
    "business_name": "Annie McAndrew Vet Physio",
    "home_address": "Mousley House Farm, Case Lane Hatton CV35 7JG",
    "phone": "07946854950"
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data, target_email } = await req.json();
    const userEmail = target_email || user.email;

    if (action === 'import_appointment_types') {
      // Import appointment types
      const results = [];
      const idMap = {};
      for (const type of (data || CLINIKO_DATA.appointment_types)) {
        const clinikoId = type.cliniko_id || type.id;
        const created = await base44.entities.AppointmentType.create({
          cliniko_id: clinikoId,
          name: type.name,
          duration_in_minutes: type.duration_in_minutes,
          color: type.color,
          description: type.description || ''
        });
        results.push(created);
        if (clinikoId) {
          idMap[clinikoId] = created.id;
        }
      }
      return Response.json({ success: true, imported: results.length, type: 'appointment_types', idMap });
    }

    if (action === 'import_clients') {
      // Import clients
      const clientIdMap = {};
      
      const clientsToCreate = data.map(client => ({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || ''
      }));
      
      const created = await base44.entities.Client.bulkCreate(clientsToCreate);
      
      // Map old IDs to new IDs
      for (let i = 0; i < data.length; i++) {
        clientIdMap[data[i].id] = created[i].id;
      }
      
      return Response.json({ success: true, imported: created.length, type: 'clients', idMap: clientIdMap });
    }

    if (action === 'import_horses') {
      // Import horses - requires clientIdMap from previous import
      const { horses, clientIdMap } = data;
      const horseIdMap = {};
      
      const validHorses = [];
      const horsesToCreate = [];
      
      for (const horse of horses) {
        const mappedOwnerId = clientIdMap[horse.owner_id];
        
        // Skip horses without valid owner mapping (required field)
        if (!mappedOwnerId) {
          console.log(`Skipping horse ${horse.name} - no valid owner mapping for ${horse.owner_id}`);
          continue;
        }
        
        validHorses.push(horse);
        horsesToCreate.push({
          name: horse.name,
          owner_id: mappedOwnerId,
          sex: horse.sex || null,
          age: horse.age || null,
          discipline: horse.discipline || null,
          medical_notes: horse.medical_notes || ''
        });
      }
      
      const created = await base44.entities.Horse.bulkCreate(horsesToCreate);
      
      // Map old IDs to new IDs (only for valid horses)
      for (let i = 0; i < validHorses.length; i++) {
        horseIdMap[validHorses[i].id] = created[i].id;
      }
      
      return Response.json({ 
        success: true, 
        imported: created.length, 
        skipped: horses.length - validHorses.length,
        type: 'horses', 
        idMap: horseIdMap 
      });
    }

    if (action === 'import_appointments') {
      // Import appointments - requires clientIdMap and horseIdMap
      const { appointments, clientIdMap, horseIdMap, appointmentTypeIdMap } = data;
      const appointmentIdMap = {};
      
      // Filter and map appointments, skipping those without valid client_id or horses
      const validAppointments = [];
      const appointmentsToCreate = [];
      
      for (const appt of appointments) {
        const mappedClientId = clientIdMap[appt.client_id];
        
        // Skip appointments without valid client mapping
        if (!mappedClientId) {
          console.log(`Skipping appointment ${appt.id} - no valid client mapping for ${appt.client_id}`);
          continue;
        }
        
        const mappedHorseIds = (appt.horse_ids || [])
          .map((id) => horseIdMap[id])
          .filter((id) => id);
        
        // Skip appointments with no valid horses (required field)
        if (mappedHorseIds.length === 0) {
          console.log(`Skipping appointment ${appt.id} - no valid horses after mapping`);
          continue;
        }
        
        validAppointments.push(appt);
        appointmentsToCreate.push({
          date: appt.date,
          time: appt.time || null,
          client_id: mappedClientId,
          horse_ids: mappedHorseIds,
          appointment_type_id: appointmentTypeIdMap?.[appt.appointment_type_id] || null,
          notes: appt.notes || '',
          status: appt.status || 'scheduled'
        });
      }
      
      const created = await base44.entities.Appointment.bulkCreate(appointmentsToCreate);
      
      // Map old IDs to new IDs (only for valid appointments)
      for (let i = 0; i < validAppointments.length; i++) {
        appointmentIdMap[validAppointments[i].id] = created[i].id;
      }
      
      return Response.json({ 
        success: true, 
        imported: created.length, 
        skipped: appointments.length - validAppointments.length,
        type: 'appointments', 
        idMap: appointmentIdMap 
      });
    }

    if (action === 'import_treatments') {
      // Import treatments - requires horseIdMap
      const { treatments, horseIdMap, appointmentIdMap } = data;
      
      const results = [];
      const errors = [];
      let skipped = 0;
      
      for (const treatment of treatments) {
        try {
          const mappedHorseId = horseIdMap[treatment.horse_id];
          const mappedAppointmentId = treatment.appointment_id ? appointmentIdMap?.[treatment.appointment_id] : null;
          
          // Skip treatments without valid horse mapping (required)
          if (!mappedHorseId) {
            console.log(`Skipping treatment - no valid horse mapping for ${treatment.horse_id}`);
            skipped++;
            continue;
          }
          
          // Skip treatments without valid appointment mapping (required)
          if (!mappedAppointmentId) {
            console.log(`Skipping treatment - no valid appointment mapping for ${treatment.appointment_id}`);
            skipped++;
            continue;
          }
          
          const treatmentData = {
            horse_id: mappedHorseId,
            appointment_id: mappedAppointmentId,
            treatment_types: treatment.treatment_types || [],
            notes: typeof treatment.notes === 'object' ? JSON.stringify(treatment.notes) : (treatment.notes || ''),
            status: treatment.status || 'completed'
          };
          
          // Add optional fields if present
          if (treatment.created_date) {
            treatmentData.created_date = treatment.created_date;
          }
          if (treatment.follow_up_date) {
            treatmentData.follow_up_date = treatment.follow_up_date;
          }
          
          const created = await base44.entities.Treatment.create(treatmentData);
          results.push(created);
          
        } catch (err) {
          console.error(`Failed to import treatment (horse: ${treatment.horse_id}):`, err.message);
          errors.push({ horse_id: treatment.horse_id, error: err.message });
        }
      }
      
      return Response.json({ 
        success: true, 
        imported: results.length, 
        skipped,
        errors: errors.length > 0 ? errors : undefined,
        type: 'treatments' 
      });
    }

    if (action === 'import_settings') {
      // Import settings
      const settings = data || CLINIKO_DATA.settings;
      const created = await base44.entities.Settings.create({
        business_name: settings.business_name,
        home_address: settings.home_address
      });
      return Response.json({ success: true, imported: 1, type: 'settings', data: created });
    }

    return Response.json({ error: 'Invalid action. Use: import_appointment_types, import_clients, import_horses, import_appointments, import_treatments, import_settings' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
*/

// Placeholder to prevent deployment errors
Deno.serve(async (req) => {
  return Response.json({ 
    message: 'Import function is currently disabled. Contact administrator to re-enable.' 
  }, { status: 503 });
});