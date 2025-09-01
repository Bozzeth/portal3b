import { defineAuth } from "@aws-amplify/backend";

/**
 * Define and configure your auth resource for SevisPortal Enhanced
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    phone: true,
  },
  groups: ["CITIZEN", "DICT_OFFICER", "ORG_VOUCHER", "ADMIN"],
  userAttributes: {
    givenName: {
      mutable: true,
      required: true,
    },
    familyName: {
      mutable: true,
      required: true,
    },
    phoneNumber: {
      mutable: true,
      required: false,
    },
    "custom:user_role": {
      dataType: "String",
      mutable: true,
    },
    "custom:sevispass_uin": {
      dataType: "String",
      mutable: true,
    },
    "custom:organization_id": {
      dataType: "String",
      mutable: true,
    },
    "custom:voucher_limit": {
      dataType: "Number",
      mutable: true,
    },
  },
});
