# Common Modules - Identity Service

This folder contains shared code used across the Identity service modules.

## 📁 Structure

```
common/
├── config/          # Configuration modules (JWT, Database, etc.)
├── decorators/      # Custom decorators and validators
├── dtos/           # Shared DTOs used by multiple modules
├── entities/       # TypeORM entities
└── filters/        # Exception filters
```

## 📦 Modules

### Config

- **jwt.config.module.ts** - JWT configuration for authentication

### Decorators

- **match-password.decorator.ts** - Password confirmation validator
- **match-password.validation-constraint.ts** - Validation constraint logic

### DTOs

Shared request/response DTOs:

- `request/` - Common request DTOs (auth, pagination, etc.)
- `response/` - Common response DTOs (tokens, validation, etc.)

### Entities

TypeORM entities:

- **User** - User account entity
- **Role** - User roles (ADMIN, USER, STAFF, MANAGER)
- **Authority** - Permissions (READ, WRITE, DELETE, UPDATE)
- **RemoveToken** - Token blacklist for logout

### Filters

Exception handling:

- **GlobalExceptionFilter** - Global exception handler
- **CatchAppExceptionFilter** - Custom app exception handler

## 🎯 Usage

Import from index files for clean imports:

```typescript
// Entities
import { User, Role, Authority, RemoveToken } from 'src/common/entities';

// Filters
import { GlobalExceptionFilter } from 'src/common/filters';

// Decorators
import { MatchPassword } from 'src/common/decorators';

// Config
import { JwtConfigModule } from 'src/common/config';
```

Or use direct imports when needed:

```typescript
import { User } from 'src/common/entities/user';
import { ValidateTokenRequestDto } from 'src/common/dtos/request/validate-token-request.dto';
```

## 📝 Guidelines

- Only add code that is **truly shared** across multiple modules
- Keep module-specific code in their respective folders
- Use index.ts for clean exports
- Document new additions in this README
