# MiAi Technical Architecture Documentation

## Database Architecture (Supabase)

### Core Tables
1. `users`
   ```sql
   - id: uuid (primary key)
   - email: string
   - created_at: timestamp
   - last_login: timestamp
   - preferences: jsonb
   ```

2. `conversations`
   ```sql
   - id: uuid (primary key)
   - user_id: uuid (foreign key)
   - title: string
   - created_at: timestamp
   - updated_at: timestamp
   - summary: text
   - context: jsonb
   ```

3. `messages`
   ```sql
   - id: uuid (primary key)
   - conversation_id: uuid (foreign key)
   - content: text
   - role: enum ('user', 'assistant')
   - created_at: timestamp
   - embedding: vector(1536)
   - context_score: float
   ```

4. `personality_traits`
   ```sql
   - id: uuid (primary key)
   - trait_name: string
   - trait_value: float
   - context: jsonb
   - active: boolean
   ```

### Vector Storage Implementation

1. Embedding Configuration
   - Enable pgvector extension in Supabase
   - Configure vector dimensions (1536 for OpenAI embeddings)
   - Set up vector similarity search
   - Implement context scoring

2. Context Management
   - Generate embeddings for messages
   - Store conversation context
   - Track context relevance
   - Implement memory decay

## API Architecture

### Endpoints
1. Conversation Management
   ```typescript
   POST /api/conversations
   GET /api/conversations
   GET /api/conversations/:id
   DELETE /api/conversations/:id
   ```

2. Message Handling
   ```typescript
   POST /api/messages
   GET /api/messages/:conversationId
   PATCH /api/messages/:id
   ```

3. Context Management
   ```typescript
   GET /api/context/:conversationId
   POST /api/context/update
   ```

### Middleware Stack
1. Authentication
   - JWT validation
   - Session management
   - Rate limiting
   - CORS configuration

2. Request Processing
   - Body parsing
   - Validation
   - Error handling
   - Logging

## Security Implementation

### Authentication
1. OAuth Integration
   - Multiple providers
   - Token management
   - Session handling
   - Refresh mechanisms

2. Data Protection
   - Encryption at rest
   - Secure transmission
   - Access control
   - Audit logging

## Performance Optimization

### Caching Strategy
1. Client-side
   - Response caching
   - Context caching
   - State management
   - Offline support

2. Server-side
   - Query caching
   - Context caching
   - Memory optimization
   - Cache invalidation

### Monitoring
1. Performance Metrics
   - Response times
   - Context retrieval speed
   - Memory usage
   - User metrics

2. Logging System
   - Error tracking
   - Usage analytics
   - Context analysis
   - Audit trails

## Development Workflow

### Environment Setup
1. Local Development
   ```bash
   - Node.js environment
   - Supabase local setup
   - API configuration
   - Testing framework
   ```

2. CI/CD Pipeline
   - Build process
   - Testing automation
   - Deployment stages
   - Version control

### Testing Strategy
1. Unit Testing
   - Component tests
   - API tests
   - Context management tests
   - Performance tests

2. Quality Assurance
   - Code review process
   - Documentation requirements
   - Performance benchmarks
   - Security audits

## World ID Security Implementation

### World ID Integration
1. Authentication Flow
   ```typescript
   interface WorldIDVerification {
     credential: string
     nullifier_hash: string
     merkle_root: string
     proof: string
   }
   ```

2. Data Access Control
   - Unique World ID binding to user account
   - Nullifier hash verification
   - Zero-knowledge proof validation
   - Credential expiration management

### Data Access Security
1. Row Level Security (RLS)
   ```sql
   -- Example RLS policy for conversations
   CREATE POLICY "Users can only access their own conversations"
   ON conversations
   FOR ALL
   USING (
     auth.uid() = user_id
     AND EXISTS (
       SELECT 1 FROM users
       WHERE id = auth.uid()
       AND world_id_hash = current_setting('app.world_id_hash')
     )
   );
   ```

2. World ID Verification
   - Real-time proof verification
   - Nullifier tracking
   - Sybil attack prevention
   - Session binding

### Database Modifications

1. Users Table Enhancement
   ```sql
   ALTER TABLE users ADD COLUMN
     world_id_hash text UNIQUE NOT NULL,
     world_id_nullifier text UNIQUE NOT NULL,
     world_id_credential jsonb NOT NULL,
     verification_level text NOT NULL DEFAULT 'device',
     last_verification timestamp with time zone
   ```

2. Session Management
   ```sql
   CREATE TABLE user_sessions (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id uuid REFERENCES users(id),
     world_id_hash text NOT NULL,
     session_token text NOT NULL,
     created_at timestamp with time zone DEFAULT now(),
     expires_at timestamp with time zone NOT NULL,
     CONSTRAINT fk_world_id 
       FOREIGN KEY (world_id_hash) 
       REFERENCES users(world_id_hash)
   );
   ```

### API Security Layer

1. Request Validation
   ```typescript
   interface SecureRequest {
     worldId: WorldIDVerification
     sessionToken: string
     timestamp: number
     signature: string
   }
   ```

2. Middleware Implementation
   ```typescript
   const worldIdAuthMiddleware = async (req, res, next) => {
     try {
       // Verify World ID proof
       const { credential, nullifier_hash } = req.body.worldId;
       
       // Verify against stored user data
       const isValid = await verifyWorldIdProof({
         credential,
         nullifier_hash,
         action: 'access_data',
         signal: req.user.id
       });

       if (!isValid) {
         return res.status(401).json({
           error: 'Invalid World ID verification'
         });
       }

       next();
     } catch (error) {
       res.status(401).json({
         error: 'Authentication failed'
       });
     }
   };
   ```

### Security Measures

1. Data Encryption
   - End-to-end encryption for messages
   - Zero-knowledge storage
   - Encrypted backups
   ```typescript
   interface EncryptedData {
     content: string // encrypted
     iv: string
     worldIdHash: string
     timestamp: number
     signature: string
   }
   ```

2. Access Control
   - World ID verification per session
   - Temporary access tokens
   - Rate limiting per World ID
   ```typescript
   interface AccessControl {
     worldIdHash: string
     accessLevel: 'read' | 'write' | 'admin'
     permissions: string[]
     expiresAt: Date
   }
   ```

3. Audit Trail
   ```sql
   CREATE TABLE access_logs (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id uuid REFERENCES users(id),
     world_id_hash text NOT NULL,
     action_type text NOT NULL,
     resource_type text NOT NULL,
     resource_id uuid NOT NULL,
     timestamp timestamp with time zone DEFAULT now(),
     metadata jsonb
   );
   ```

### Emergency Procedures

1. Account Recovery
   - World ID re-verification process
   - Backup authentication methods
   - Cool-down periods

2. Security Incidents
   - Automatic session termination
   - Data access suspension
   - Incident logging and reporting