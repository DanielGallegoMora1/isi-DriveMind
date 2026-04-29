import type { AuthUser, AuthUserLicense, UserRole } from './types'

type PermitLike = {
  code: string
}

function normalizeLicenseCode(license: AuthUserLicense) {
  const code = typeof license === 'string' ? license : license.code
  return code.trim().toUpperCase()
}

export function getRoleHomePath(role: UserRole | string | null | undefined) {
  switch (role) {
    case 'system_admin':
      return '/admin'
    case 'school_admin':
      return '/school-admin'
    default:
      return '/'
  }
}

export function hasAllowedRole(user: AuthUser | null | undefined, allowedRoles: UserRole[]) {
  if (!user) {
    return false
  }

  return allowedRoles.includes(user.role as UserRole)
}

export function getStudentLicenseCodes(user: AuthUser | null | undefined) {
  if (user?.role !== 'student' || !user.licenses?.length) {
    return []
  }

  return user.licenses
    .map(normalizeLicenseCode)
    .filter((code, index, collection) => code.length > 0 && collection.indexOf(code) === index)
}

export function filterPermitsForStudent<T extends PermitLike>(permits: T[], user: AuthUser | null | undefined) {
  const allowedCodes = getStudentLicenseCodes(user)

  if (allowedCodes.length === 0) {
    return permits
  }

  return permits.filter((permit) => allowedCodes.includes(permit.code.trim().toUpperCase()))
}

export function getStudentPermitSummary(user: AuthUser | null | undefined, language: 'es' | 'en') {
  const licenseCodes = getStudentLicenseCodes(user)

  if (licenseCodes.length === 0) {
    return null
  }

  const label = language === 'en'
    ? licenseCodes.length === 1
      ? 'Permit'
      : 'Permits'
    : licenseCodes.length === 1
      ? 'Permiso'
      : 'Permisos'

  return `${label} ${licenseCodes.join(', ')}`
}
