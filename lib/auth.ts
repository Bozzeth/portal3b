import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export type UserRole = 'CITIZEN' | 'DICT_OFFICER' | 'ORG_VOUCHER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  givenName?: string;
  familyName?: string;
  phoneNumber?: string;
  userRole?: UserRole;
  sevispassUin?: string;
  organizationId?: string;
  voucherLimit?: number;
}

export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const currentUser = await getCurrentUser();
    const session = await fetchAuthSession();
    
    if (!currentUser || !session.tokens) {
      return null;
    }

    const idToken = session.tokens.idToken;
    const accessToken = session.tokens.accessToken;
    
    if (!idToken || !accessToken) {
      return null;
    }

    const userAttributes = idToken.payload;
    const groups = accessToken.payload['cognito:groups'] as string[] || [];

    return {
      id: currentUser.userId,
      email: userAttributes.email as string,
      givenName: userAttributes.given_name as string,
      familyName: userAttributes.family_name as string,
      phoneNumber: userAttributes.phone_number as string,
      userRole: (userAttributes['custom:user_role'] as UserRole) || (groups[0] as UserRole) || 'CITIZEN',
      sevispassUin: userAttributes['custom:sevispass_uin'] as string,
      organizationId: userAttributes['custom:organization_id'] as string,
      voucherLimit: userAttributes['custom:voucher_limit'] ? parseInt(userAttributes['custom:voucher_limit'] as string) : undefined,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

export function hasRole(user: User | null, roles: UserRole[]): boolean {
  if (!user || !user.userRole) return false;
  return roles.includes(user.userRole);
}

export function canAccessAdminFeatures(user: User | null): boolean {
  return hasRole(user, ['ADMIN', 'DICT_OFFICER']);
}

export function canVouchForOthers(user: User | null): boolean {
  return hasRole(user, ['CITIZEN', 'ORG_VOUCHER']) && !!user?.sevispassUin;
}

export function isOrganizationalVoucher(user: User | null): boolean {
  return hasRole(user, ['ORG_VOUCHER']) && !!user?.organizationId;
}