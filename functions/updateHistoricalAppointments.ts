import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all appointments before January 17, 2026
    const allAppointments = await base44.asServiceRole.entities.Appointment.list();
    const historicalAppointments = allAppointments.filter(appt => {
      const apptDate = new Date(appt.date);
      const cutoffDate = new Date('2026-01-17');
      return apptDate < cutoffDate;
    });

    // Get all treatments
    const allTreatments = await base44.asServiceRole.entities.Treatment.list();

    // Update each appointment and its treatments to completed status
    const appointmentUpdates = [];
    const treatmentUpdates = [];

    for (const appt of historicalAppointments) {
      // Update appointment status
      if (appt.status !== 'completed') {
        await base44.asServiceRole.entities.Appointment.update(appt.id, { status: 'completed' });
        appointmentUpdates.push(appt.id);
      }

      // Update all treatments for this appointment to completed
      const apptTreatments = allTreatments.filter(t => t.appointment_id === appt.id);
      for (const treatment of apptTreatments) {
        if (treatment.status !== 'completed') {
          await base44.asServiceRole.entities.Treatment.update(treatment.id, { status: 'completed' });
          treatmentUpdates.push(treatment.id);
        }
      }
    }

    return Response.json({ 
      success: true, 
      message: `Updated ${appointmentUpdates.length} appointments and ${treatmentUpdates.length} treatments to completed`,
      totalHistorical: historicalAppointments.length,
      appointmentsUpdated: appointmentUpdates.length,
      treatmentsUpdated: treatmentUpdates.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});