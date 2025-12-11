/**
 * Role enumeration for authorization
 */
export enum RoleEnum {
  ADMIN = 1,
  USER = 2,
  CHEF = 3,
  STAFF = 4,
  MANAGER = 5,
  CUSTOMER = 6,
}

/**
 * Authority/Permission enumeration
 */
export enum AuthorityEnum {
  READ = 1,
  WRITE = 2,
  DELETE = 3,
  UPDATE = 4,
  EXECUTE = 5,
  CREATE = 6,
  VIEW = 7,
  MANAGE = 8,
  MODIFY_STATE = 9,
}

/**
 * Token type enumeration
 */
export enum TokenTypeEnum {
  ACCESS = "access",
  REFRESH = "refresh",
}

/**
 * Environment mode enumeration
 */
export enum EnvironmentEnum {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
}
