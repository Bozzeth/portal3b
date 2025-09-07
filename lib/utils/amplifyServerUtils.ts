import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { generateServerClientUsingCookies, generateServerClientUsingReqRes } from '@aws-amplify/adapter-nextjs/data';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { Amplify } from 'aws-amplify';
import type { Schema } from '@/amplify/data/resource';
import outputs from '@/amplify_outputs.json';

// Configure Amplify once
Amplify.configure(outputs);

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs
});

export const cookiesClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
});

export const reqResBasedClient = generateServerClientUsingReqRes<Schema>({
  config: outputs,
});

// Create a server-side API key client for public operations
export const publicServerClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
  authMode: 'apiKey'
});

export async function AuthGetCurrentUserServer() {
  try {
    const currentUser = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    });
    return currentUser;
  } catch (error) {
    console.error(error);
    return null;
  }
}