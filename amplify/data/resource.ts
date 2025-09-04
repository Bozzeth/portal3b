import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  SevisPassApplication: a
    .model({
      userId: a.string().required(),
      applicationId: a.string().required(),
      status: a.enum(['pending', 'under_review', 'approved', 'rejected']),
      submittedAt: a.datetime().required(),
      documentType: a.string().required(),
      documentImageKey: a.string(), // S3 key for document image
      selfieImageKey: a.string(),   // S3 key for selfie image
      
      // Extracted information from document
      fullName: a.string(),
      dateOfBirth: a.date(),
      documentNumber: a.string(),
      nationality: a.string().default('Papua New Guinea'),
      
      // Verification data
      confidence: a.float(),
      requiresManualReview: a.boolean().default(false),
      faceId: a.string(), // AWS Rekognition face ID
      
      // Approval/Rejection data
      uin: a.string(),
      issuedAt: a.datetime(),
      rejectionReason: a.string(),
      reviewedBy: a.string(),
      reviewedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update']),
      allow.groupDefinedIn('reviewedBy').to(['read', 'update']),
      allow.group('ADMIN').to(['read', 'update']),
      allow.group('DICT_OFFICER').to(['read', 'update'])
    ])
    .identifier(['userId']),

  SevisPassHolder: a
    .model({
      userId: a.string().required(),
      uin: a.string().required(),
      fullName: a.string().required(),
      dateOfBirth: a.date(),
      documentNumber: a.string(),
      nationality: a.string().default('Papua New Guinea'),
      issuedAt: a.datetime().required(),
      expiryDate: a.datetime(),
      status: a.enum(['active', 'suspended', 'revoked']).default('active'),
      faceId: a.string(), // AWS Rekognition face ID for login
      documentImageKey: a.string(),
      photoImageKey: a.string(),
    })
    .authorization((allow) => [
      allow.owner().to(['read']),
      allow.group('ADMIN').to(['read', 'update']),
      allow.group('DICT_OFFICER').to(['read'])
    ])
    .identifier(['uin']),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
