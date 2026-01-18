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

    const { action, data } = await req.json();
    const userEmail = user.email;

    if (action === 'import_appointment_types') {
      // Import appointment types
      const results = [];
      for (const type of (data || CLINIKO_DATA.appointment_types)) {
        const created = await base44.asServiceRole.entities.AppointmentType.create({
          name: type.name,
          duration_in_minutes: type.duration_in_minutes,
          color: type.color,
          description: type.description || '',
          created_by: userEmail
        });
        results.push(created);
      }
      return Response.json({ success: true, imported: results.length, type: 'appointment_types' });
    }

    if (action === 'import_clients') {
      // Import clients
      const clientIdMap = {};
      
      const clientsToCreate = data.map(client => ({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        created_by: userEmail
      }));
      
      const created = await base44.asServiceRole.entities.Client.bulkCreate(clientsToCreate);
      
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
      
      const horsesToCreate = horses.map(horse => ({
        name: horse.name,
        owner_id: clientIdMap[horse.owner_id] || null,
        sex: horse.sex || null,
        age: horse.age || null,
        discipline: horse.discipline || null,
        medical_notes: horse.medical_notes || '',
        created_by: userEmail
      }));
      
      const created = await base44.asServiceRole.entities.Horse.bulkCreate(horsesToCreate);
      
      // Map old IDs to new IDs
      for (let i = 0; i < horses.length; i++) {
        horseIdMap[horses[i].id] = created[i].id;
      }
      
      return Response.json({ success: true, imported: created.length, type: 'horses', idMap: horseIdMap });
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
          status: appt.status || 'scheduled',
          created_by: userEmail
        });
      }
      
      const created = await base44.asServiceRole.entities.Appointment.bulkCreate(appointmentsToCreate);
      
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
      const { treatments, horseIdMap } = data;
      
      const validTreatments = [];
      const treatmentsToCreate = [];
      
      for (const treatment of treatments) {
        const mappedHorseId = horseIdMap[treatment.horse_id];
        
        // Skip treatments without valid horse mapping
        if (!mappedHorseId) {
          console.log(`Skipping treatment - no valid horse mapping for ${treatment.horse_id}`);
          continue;
        }
        
        validTreatments.push(treatment);
        treatmentsToCreate.push({
          horse_id: mappedHorseId,
          treatment_types: treatment.treatment_types || [],
          notes: typeof treatment.notes === 'object' ? JSON.stringify(treatment.notes) : (treatment.notes || ''),
          status: treatment.status || 'completed',
          created_date: treatment.created_date,
          created_by: userEmail
        });
      }
      
      const created = await base44.asServiceRole.entities.Treatment.bulkCreate(treatmentsToCreate);
      
      return Response.json({ 
        success: true, 
        imported: created.length, 
        skipped: treatments.length - validTreatments.length,
        type: 'treatments' 
      });
    }

    if (action === 'import_settings') {
      // Import settings
      const settings = data || CLINIKO_DATA.settings;
      const created = await base44.asServiceRole.entities.Settings.create({
        business_name: settings.business_name,
        home_address: settings.home_address,
        created_by: userEmail
      });
      return Response.json({ success: true, imported: 1, type: 'settings', data: created });
    }

    return Response.json({ error: 'Invalid action. Use: import_appointment_types, import_clients, import_horses, import_appointments, import_treatments, import_settings' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});