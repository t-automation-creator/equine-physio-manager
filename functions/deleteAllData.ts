import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { targetEmail } = await req.json();
    
    if (!targetEmail) {
      return Response.json({ error: 'targetEmail is required' }, { status: 400 });
    }

    const deletedCounts = {};

    // Delete all entities for the target user
    const entities = ['Treatment', 'Invoice', 'Appointment', 'Horse', 'Client', 'Yard', 'AppointmentType', 'Settings'];
    
    for (const entityName of entities) {
      const records = await base44.asServiceRole.entities[entityName].filter({ created_by: targetEmail });
      
      for (const record of records) {
        await base44.asServiceRole.entities[entityName].delete(record.id);
      }
      
      deletedCounts[entityName] = records.length;
    }

    return Response.json({ 
      success: true, 
      message: `Deleted all data for ${targetEmail}`,
      deletedCounts 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});