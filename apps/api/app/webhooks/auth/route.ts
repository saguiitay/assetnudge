import { env } from '@/env';
import type {
  DeletedObjectJSON,
  OrganizationJSON,
  OrganizationMembershipJSON,
  UserJSON,
  WebhookEvent,
} from '@repo/auth/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

const handleUserCreated = (data: UserJSON) => {
  return new Response('User created', { status: 201 });
};

const handleUserUpdated = (data: UserJSON) => {
  return new Response('User updated', { status: 201 });
};

const handleUserDeleted = (data: DeletedObjectJSON) => {
  return new Response('User deleted', { status: 201 });
};

const handleOrganizationCreated = (data: OrganizationJSON) => {
  return new Response('Organization created', { status: 201 });
};

const handleOrganizationUpdated = (data: OrganizationJSON) => {
  return new Response('Organization updated', { status: 201 });
};

const handleOrganizationMembershipCreated = (
  data: OrganizationMembershipJSON
) => {
  return new Response('Organization membership created', { status: 201 });
};

const handleOrganizationMembershipDeleted = (
  data: OrganizationMembershipJSON
) => {
  // Need to unlink the user from the group
  return new Response('Organization membership deleted', { status: 201 });
};


export const POST = async (request: Request): Promise<Response> => {
  if (!env.CLERK_WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Not configured', ok: false });
  }

  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = (await request.json()) as object;
  const body = JSON.stringify(payload);

  // Create a new SVIX instance with your secret.
  const webhook = new Webhook(env.CLERK_WEBHOOK_SECRET);

  let event: WebhookEvent | undefined;

  // Verify the payload with the headers
  try {
    event = webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = event.data;
  const eventType = event.type;


  let response: Response = new Response('', { status: 201 });

  switch (eventType) {
    case 'user.created': {
      response = handleUserCreated(event.data);
      break;
    }
    case 'user.updated': {
      response = handleUserUpdated(event.data);
      break;
    }
    case 'user.deleted': {
      response = handleUserDeleted(event.data);
      break;
    }
    case 'organization.created': {
      response = handleOrganizationCreated(event.data);
      break;
    }
    case 'organization.updated': {
      response = handleOrganizationUpdated(event.data);
      break;
    }
    case 'organizationMembership.created': {
      response = handleOrganizationMembershipCreated(event.data);
      break;
    }
    case 'organizationMembership.deleted': {
      response = handleOrganizationMembershipDeleted(event.data);
      break;
    }
    default: {
      break;
    }
  }

  return response;
};
