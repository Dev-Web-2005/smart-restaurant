/**
 * Role enumeration for authorization
 */
export enum RoleEnum {
  ADMIN = 1,
  USER = 2,
  STAFF = 3,
  CHEF = 4,
  CUSTOMER = 5,
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
