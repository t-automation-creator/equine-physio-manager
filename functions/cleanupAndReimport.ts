import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.email !== 'annievetphysio@gmail.com') {
      return Response.json({ error: 'Only Annie can run this cleanup' }, { status: 403 });
    }

    const log = [];

    // Step 1: Delete all existing imported data (created by gninja2021)
    log.push('Starting cleanup...');

    const entitiesToClean = ['Treatment', 'Appointment', 'Horse', 'Client', 'AppointmentType', 'Yard'];
    
    for (const entityName of entitiesToClean) {
      const records = await base44.asServiceRole.entities[entityName].filter({});
      if (records.length > 0) {
        for (const record of records) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }
        log.push(`Deleted ${records.length} ${entityName} records`);
      }
    }

    log.push('Cleanup complete. Now re-import using the import functions with Annie as the authenticated user.');
    
    return Response.json({ success: true, log });

  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});