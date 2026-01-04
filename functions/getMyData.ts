import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity, query = {} } = await req.json();

    // Server-side enforcement: ALWAYS filter by created_by
    const secureQuery = {
      ...query,
      created_by: user.email
    };

    let data;
    switch (entity) {
      case 'Appointment':
        data = await base44.asServiceRole.entities.Appointment.filter(secureQuery);
        break;
      case 'Client':
        data = await base44.asServiceRole.entities.Client.filter(secureQuery);
        break;
      case 'Yard':
        data = await base44.asServiceRole.entities.Yard.filter(secureQuery);
        break;
      case 'Horse':
        data = await base44.asServiceRole.entities.Horse.filter(secureQuery);
        break;
      case 'Treatment':
        data = await base44.asServiceRole.entities.Treatment.filter(secureQuery);
        break;
      case 'Invoice':
        data = await base44.asServiceRole.entities.Invoice.filter(secureQuery);
        break;
      case 'Settings':
        data = await base44.asServiceRole.entities.Settings.filter(secureQuery);
        break;
      default:
        return Response.json({ error: 'Invalid entity' }, { status: 400 });
    }

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});