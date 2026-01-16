import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { action, email, role, userEmail, clients, yards } = await req.json();

    if (action === 'invite') {
      // Step 1: Invite the user
      if (!email) {
        return Response.json({ error: 'Email is required' }, { status: 400 });
      }

      await base44.users.inviteUser(email, role || 'user');

      return Response.json({ 
        success: true, 
        message: `Invitation sent to ${email}` 
      });
    }

    if (action === 'createData') {
      // Step 2: Create data for the invited user
      if (!userEmail) {
        return Response.json({ error: 'User email is required' }, { status: 400 });
      }

      const createdData = {
        clients: [],
        yards: [],
      };

      // Create clients with created_by set to the invited user's email
      if (clients && clients.length > 0) {
        for (const client of clients) {
          if (client.name) {
            const created = await base44.asServiceRole.entities.Client.create({
              ...client,
              created_by: userEmail,
            });
            createdData.clients.push(created);
          }
        }
      }

      // Create yards with created_by set to the invited user's email
      if (yards && yards.length > 0) {
        for (const yard of yards) {
          if (yard.name) {
            const created = await base44.asServiceRole.entities.Yard.create({
              ...yard,
              created_by: userEmail,
            });
            createdData.yards.push(created);
          }
        }
      }

      return Response.json({ 
        success: true, 
        message: 'Data created successfully',
        data: createdData
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});