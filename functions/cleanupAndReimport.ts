import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized - must be logged in' }, { status: 401 });
    }

    const log = [];
    log.push(`Running as: ${user.email}`);
    log.push('Starting cleanup...');

    const entitiesToClean = ['Treatment', 'Appointment', 'Horse', 'Client', 'AppointmentType', 'Yard'];
    
    for (const entityName of entitiesToClean) {
      try {
        const records = await base44.asServiceRole.entities[entityName].filter({});
        log.push(`Found ${records.length} ${entityName} records`);
        
        if (records.length > 0) {
          for (const record of records) {
            await base44.asServiceRole.entities[entityName].delete(record.id);
          }
          log.push(`✓ Deleted ${records.length} ${entityName} records`);
        }
      } catch (err) {
        log.push(`✗ Error with ${entityName}: ${err.message}`);
      }
    }

    log.push('Cleanup complete!');
    
    return Response.json({ success: true, log });

  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});