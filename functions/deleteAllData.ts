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

    // Delete Treatments
    const treatments = await base44.asServiceRole.entities.Treatment.filter({ created_by: targetEmail });
    for (const record of treatments) {
      await base44.asServiceRole.entities.Treatment.delete(record.id);
    }
    deletedCounts.Treatment = treatments.length;

    // Delete Invoices
    const invoices = await base44.asServiceRole.entities.Invoice.filter({ created_by: targetEmail });
    for (const record of invoices) {
      await base44.asServiceRole.entities.Invoice.delete(record.id);
    }
    deletedCounts.Invoice = invoices.length;

    // Delete Appointments
    const appointments = await base44.asServiceRole.entities.Appointment.filter({ created_by: targetEmail });
    for (const record of appointments) {
      await base44.asServiceRole.entities.Appointment.delete(record.id);
    }
    deletedCounts.Appointment = appointments.length;

    // Delete Horses
    const horses = await base44.asServiceRole.entities.Horse.filter({ created_by: targetEmail });
    for (const record of horses) {
      await base44.asServiceRole.entities.Horse.delete(record.id);
    }
    deletedCounts.Horse = horses.length;

    // Delete Clients
    const clients = await base44.asServiceRole.entities.Client.filter({ created_by: targetEmail });
    for (const record of clients) {
      await base44.asServiceRole.entities.Client.delete(record.id);
    }
    deletedCounts.Client = clients.length;

    // Delete Yards
    const yards = await base44.asServiceRole.entities.Yard.filter({ created_by: targetEmail });
    for (const record of yards) {
      await base44.asServiceRole.entities.Yard.delete(record.id);
    }
    deletedCounts.Yard = yards.length;

    // Delete AppointmentTypes
    const appointmentTypes = await base44.asServiceRole.entities.AppointmentType.filter({ created_by: targetEmail });
    for (const record of appointmentTypes) {
      await base44.asServiceRole.entities.AppointmentType.delete(record.id);
    }
    deletedCounts.AppointmentType = appointmentTypes.length;

    // Delete Settings
    const settings = await base44.asServiceRole.entities.Settings.filter({ created_by: targetEmail });
    for (const record of settings) {
      await base44.asServiceRole.entities.Settings.delete(record.id);
    }
    deletedCounts.Settings = settings.length;

    return Response.json({ 
      success: true, 
      message: `Deleted all data for ${targetEmail}`,
      deletedCounts 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});