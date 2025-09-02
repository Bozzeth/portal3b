import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "sevispass-storage",
  access: (allow) => ({
    // Public access for document uploads during registration
    'public/documents/*': [
      allow.guest.to(['read', 'write', 'delete']),
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // Protected access for processed images and liveness sessions
    'protected/faces/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    'protected/liveness-sessions/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // Private access for admin and sensitive data
    'private/admin/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});