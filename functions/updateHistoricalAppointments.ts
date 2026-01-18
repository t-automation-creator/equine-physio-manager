import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all appointments before January 17, 2026
    const allAppointments = await base44.entities.Appointment.list();
    const historicalAppointments = allAppointments.filter(appt => {
      const apptDate = new Date(appt.date);
      const cutoffDate = new Date('2026-01-17');
      return apptDate < cutoffDate;
    });

    // Update each appointment to completed status
    const updates = [];
    for (const appt of historicalAppointments) {
      if (appt.status !== 'completed') {
        await base44.entities.Appointment.update(appt.id, { status: 'completed' });
        updates.push(appt.id);
      }
    }

    return Response.json({ 
      success: true, 
      message: `Updated ${updates.length} appointments to completed`,
      totalHistorical: historicalAppointments.length,
      updated: updates.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});