import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "sevispass-storage",
  access: (allow) => ({
    // Temporary public access for SevisPass documents (TODO: implement proper server-side auth)
    'public/sevispass/documents/*': [
      allow.guest.to(['read', 'write']),
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.groups(['ADMIN', 'DICT_OFFICER']).to(['read', 'write', 'delete'])
    ],
    // Temporary public access for SevisPass faces (TODO: implement proper server-side auth)
    'public/sevispass/faces/*': [
      allow.guest.to(['read', 'write']),
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.groups(['ADMIN', 'DICT_OFFICER']).to(['read', 'write', 'delete'])
    ],
    // CityPass application documents
    'public/citypass/applications/*': [
      allow.guest.to(['read', 'write']),
      allow.authenticated.to(['read', 'write']),
      allow.groups(['ADMIN']).to(['read', 'write', 'delete'])
    ],
    // CityPass holder documents
    'public/citypass/holders/*': [
      allow.authenticated.to(['read']),
      allow.groups(['ADMIN']).to(['read', 'write', 'delete'])
    ],
    // Protected access for liveness sessions
    'protected/liveness-sessions/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // Private admin access for sensitive operations
    'private/admin/*': [
      allow.groups(['ADMIN']).to(['read', 'write', 'delete'])
    ]
  })
});