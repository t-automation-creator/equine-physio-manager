# Equine Physiotherapy Manager - Product Roadmap

**Document Version:** 2.0
**Date:** January 2026
**Status:** Draft for Review

---

## Executive Summary

This document outlines the complete development roadmap for the Equine Physiotherapy Manager application, covering:

1. **Feature completion** - Invoicing, pricing, UX polish
2. **Platform migration** - Base44 → Google Cloud Platform
3. **Mobile applications** - Native iOS and Android apps
4. **Cross-platform sync** - Real-time data consistency across all devices

**Target User:** Annie McAndrew Vet Physio (beta user)
**Current State:** Functional prototype on Base44 platform
**End State:** Production-ready multi-platform application on GCP

---

## Architecture Overview

### Current Architecture (Base44)
```
┌─────────────────────────────────────────────────────────┐
│                      BASE44 PLATFORM                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Auth      │  │  Database   │  │   Files     │     │
│  │  (Base44)   │  │  (Base44)   │  │  (Base44)   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Functions  │  │   Email     │  │    LLM      │     │
│  │   (Deno)    │  │  (Base44)   │  │  (OpenAI)   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │   React Web App     │
              │   (Vite + Base44    │
              │      SDK)           │
              └─────────────────────┘
```

### Target Architecture (GCP)
```
┌─────────────────────────────────────────────────────────────────────┐
│                     GOOGLE CLOUD PLATFORM                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Firebase   │  │   Cloud      │  │   Cloud      │              │
│  │    Auth      │  │  Firestore   │  │   Storage    │              │
│  │ (Identity)   │  │  (Database)  │  │   (Files)    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │    Cloud     │  │   SendGrid   │  │   Vertex AI  │              │
│  │  Functions   │  │   (Email)    │  │    (LLM)     │              │
│  │  / Cloud Run │  │              │  │   + Whisper  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │   Firebase   │  │    Cloud     │                                │
│  │   Hosting    │  │   Pub/Sub    │                                │
│  │   (Web)      │  │  (Events)    │                                │
│  └──────────────┘  └──────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │  React Web  │      │   iOS App   │      │ Android App │
   │    (PWA)    │      │   (React    │      │   (React    │
   │             │      │   Native)   │      │   Native)   │
   └─────────────┘      └─────────────┘      └─────────────┘
            │                    │                    │
            └────────────────────┴────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   SHARED CODEBASE       │
                    │   - Business Logic      │
                    │   - API Client          │
                    │   - Data Models         │
                    │   - Validation (Zod)    │
                    └─────────────────────────┘
```

---

## Multi-Tenancy Strategy

### Current Implementation
The application currently implements **user-level isolation**:

```javascript
// Server-side enforcement in getMyData.ts
const data = await base44.asServiceRole.entities[entity].filter({
  created_by: user.email,  // All queries filtered by user
  ...query
});
```

**Current Model:**
- Each user sees only their own data
- `created_by` field on all entities
- Server-side filtering (cannot be bypassed)

### Enhanced Multi-Tenancy (Planned)

**Tier 1: Solo Practitioner** (Current)
- Single user account
- All data owned by one user
- Simple and sufficient for beta

**Tier 2: Small Practice** (Future)
- Multiple practitioners in one practice
- Shared clients, horses, yards
- Individual appointment ownership
- Practice-level reporting

**Tier 3: Enterprise/Franchise** (Future)
- Multiple practices under one organization
- Practice-level isolation
- Organization-level admin/reporting

### Data Model for Multi-Tenancy
```javascript
// Future entity structure
{
  id: UUID,
  organization_id: UUID,    // Top-level tenant (future)
  practice_id: UUID,        // Practice/clinic (future)
  created_by: string,       // User who created
  assigned_to: string[],    // Users who can access (future)
  ...entity_fields
}
```

### Migration Path
1. **Phase 1:** Keep current user-level isolation
2. **Phase 2:** Add `practice_id` for team support
3. **Phase 3:** Add `organization_id` for enterprise

---

## Development Phases

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT TIMELINE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PHASE 1          PHASE 2          PHASE 3          PHASE 4         │
│  Feature          GCP              Mobile           Scale &         │
│  Completion       Migration        Apps             Polish          │
│                                                                      │
│  ████████         ████████         ████████         ████████        │
│                                                                      │
│  - Pricing        - Firebase       - React Native   - Analytics     │
│  - Invoicing        Auth             Setup          - Performance   │
│  - Payments       - Firestore      - iOS App        - Multi-tenant  │
│  - UX Polish      - Cloud          - Android App    - App Store     │
│  - Dashboard        Functions      - Offline Sync     Launch        │
│                   - File Storage   - Push Notifs                    │
│                   - Email Service                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Feature Completion

**Goal:** Complete all core features while still on Base44
**Rationale:** Faster iteration, validate features before migration

### 1.1 Pricing & Rates System
**Priority:** P0 - Critical

```
Service Pricing Model:
├── Appointment Types
│   ├── Equine Physio - £XX per session
│   ├── INDIBA - £XX per session
│   ├── Canine Physio - £XX per session
│   ├── Grooming - £XX per session
│   └── Custom types...
├── Per-Horse Pricing
│   └── Option to charge per horse in multi-horse appointments
├── Travel/Mileage
│   ├── Base call-out fee
│   └── Per-mile rate (after X free miles)
└── Discounts
    ├── Multi-horse discount
    └── Regular client discount (future)
```

**Tasks:**
- [ ] Add `default_price`, `price_per_horse` to AppointmentType entity
- [ ] Create Settings > Pricing configuration page
- [ ] Add travel fee settings
- [ ] Display prices during appointment booking

### 1.2 Invoice Creation Flow
**Priority:** P0 - Critical

**Workflow:**
```
Appointment Completed
        │
        ▼
┌───────────────────┐
│  Create Invoice   │ ◄── Button on appointment detail
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Auto-populate    │
│  - Service × qty  │
│  - Travel fees    │
│  - Discounts      │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Review & Edit    │ ◄── Adjust line items
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Save Draft  OR   │
│  Send to Client   │
└───────────────────┘
```

**Tasks:**
- [ ] "Create Invoice" button on completed appointments
- [ ] Invoice builder with auto-calculated line items
- [ ] Editable line items (add/remove/adjust)
- [ ] Tax calculation (configurable VAT %)
- [ ] Auto-incrementing invoice numbers
- [ ] PDF generation with business branding
- [ ] Email invoice to client

### 1.3 Payment Recording
**Priority:** P1 - High

- [ ] Mark invoice as paid (full/partial)
- [ ] Payment method tracking (cash, bank transfer, card)
- [ ] Payment date recording
- [ ] Outstanding balance calculation
- [ ] Payment history per client/invoice

### 1.4 UX Cleanup
**Priority:** P1 - High

**Issues to Fix:**
| Issue | Action |
|-------|--------|
| Admin Import visible | Hide behind feature flag or remove |
| Dev tools in Settings | Remove or move to hidden admin area |
| Generic Base44 styling | Apply custom branding |
| Cluttered Profile page | Separate user info from admin tools |

**Tasks:**
- [ ] Remove/hide Admin Import from navigation
- [ ] Reorganize Settings page:
  - Business Details
  - Pricing & Rates
  - Invoice Settings
  - Account & Security
- [ ] Clean up Profile page
- [ ] Add onboarding flow for new users

### 1.5 Dashboard Redesign
**Priority:** P2 - Medium

```
┌─────────────────────────────────────────────────────────┐
│  DASHBOARD                                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Today's Schedule                                        │
│  ┌────────┬────────┬────────┬────────┬────────┐        │
│  │ 9:00am │ 11:00  │ 1:00pm │ 3:00pm │ 5:00pm │        │
│  │ Yard A │ Yard B │  LUNCH │ Yard C │ Yard A │        │
│  │ 2 horses│ 1 horse│        │ 3 horses│ 1 horse│       │
│  └────────┴────────┴────────┴────────┴────────┘        │
│                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │     5        │ │    £650      │ │      3       │    │
│  │ Appointments │ │  This Week   │ │   Unpaid     │    │
│  │  This Week   │ │   Revenue    │ │   Invoices   │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                          │
│  Follow-ups Due          │  Quick Actions               │
│  ┌────────────────────┐  │  ┌────────────────────────┐ │
│  │ ⚠ Bella - 2 days   │  │  │ + New Appointment      │ │
│  │ ⚠ Storm - 4 days   │  │  │ + New Client           │ │
│  │ ○ Max - 1 week     │  │  │ 📄 Create Invoice      │ │
│  └────────────────────┘  │  └────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Tasks:**
- [ ] Today's schedule timeline view
- [ ] Quick stats cards
- [ ] Follow-up reminders from treatments
- [ ] Quick action buttons
- [ ] Recent activity feed

---

## Phase 2: GCP Migration

**Goal:** Move entire backend from Base44 to Google Cloud Platform
**Rationale:** Full control, scalability, mobile app support, real-time sync

### 2.1 GCP Project Setup

**Tasks:**
- [ ] Create GCP project
- [ ] Enable required APIs:
  - Firebase Authentication
  - Cloud Firestore
  - Cloud Storage
  - Cloud Functions
  - Cloud Run
  - Vertex AI
- [ ] Set up billing alerts
- [ ] Configure IAM roles and service accounts
- [ ] Set up development, staging, production environments

### 2.2 Authentication Migration (Firebase Auth)

**Base44 → Firebase Auth**

```javascript
// Current (Base44)
import { base44 } from '@/api/base44Client';
const user = await base44.auth.me();

// Target (Firebase)
import { getAuth, onAuthStateChanged } from 'firebase/auth';
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  // Handle user state
});
```

**Tasks:**
- [ ] Set up Firebase Authentication
- [ ] Configure auth providers:
  - Email/Password
  - Google Sign-In
  - Apple Sign-In (required for iOS)
- [ ] Create AuthContext wrapper for Firebase
- [ ] Implement token management
- [ ] Set up email verification flow
- [ ] Password reset functionality
- [ ] User migration strategy (existing Base44 users)

### 2.3 Database Migration (Cloud Firestore)

**Base44 Entities → Firestore Collections**

```
Firestore Structure:
├── users/
│   └── {userId}/
│       ├── profile: { name, email, ... }
│       └── settings: { business_name, pricing, ... }
├── clients/
│   └── {clientId}: { name, email, phone, owner_id, ... }
├── horses/
│   └── {horseId}: { name, client_id, yard_id, ... }
├── yards/
│   └── {yardId}: { name, address, location, ... }
├── appointments/
│   └── {appointmentId}: { date, time, client_id, horse_ids, ... }
├── treatments/
│   └── {treatmentId}: { horse_id, appointment_id, notes, ... }
├── invoices/
│   └── {invoiceId}: { client_id, line_items, status, ... }
└── appointment_types/
    └── {typeId}: { name, duration, price, color, ... }
```

**Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /clients/{clientId} {
      allow read, write: if request.auth != null
        && resource.data.owner_id == request.auth.uid;
    }

    match /horses/{horseId} {
      allow read, write: if request.auth != null
        && resource.data.owner_id == request.auth.uid;
    }

    // ... similar rules for all collections
  }
}
```

**Tasks:**
- [ ] Design Firestore schema
- [ ] Write security rules (multi-tenancy enforcement)
- [ ] Create data migration script (Base44 → Firestore)
- [ ] Set up Firestore indexes for queries
- [ ] Implement offline persistence configuration
- [ ] Create API service layer for Firestore operations

### 2.4 File Storage Migration (Cloud Storage)

**Tasks:**
- [ ] Set up Cloud Storage buckets:
  - `{project}-uploads` (treatment photos, horse photos)
  - `{project}-documents` (invoices, exports)
- [ ] Configure CORS for web uploads
- [ ] Set up signed URL generation for private files
- [ ] Implement file upload service
- [ ] Migrate existing files from Base44

### 2.5 Serverless Functions (Cloud Functions / Cloud Run)

**Function Migration:**

| Base44 Function | GCP Equivalent |
|-----------------|----------------|
| `getMyData.ts` | Firestore direct queries (no function needed) |
| `transcribeAudio.ts` | Cloud Function → OpenAI Whisper / Vertex AI |
| `importClinikoData.ts` | Cloud Function (admin only) |
| Email sending | Cloud Function → SendGrid |
| PDF generation | Cloud Run (for heavy processing) |

**Tasks:**
- [ ] Set up Cloud Functions project
- [ ] Migrate transcription function
- [ ] Create email service (SendGrid integration)
- [ ] Create PDF generation service
- [ ] Set up Cloud Pub/Sub for async operations:
  - Invoice email sending
  - Payment reminders
  - Appointment reminders

### 2.6 Web App Updates

**Tasks:**
- [ ] Replace Base44 SDK with Firebase SDK
- [ ] Update all API calls to use new services
- [ ] Implement real-time listeners (Firestore snapshots)
- [ ] Add offline support indicators
- [ ] Update build configuration for Firebase Hosting
- [ ] Set up CI/CD pipeline (GitHub Actions → Firebase)

### 2.7 AI/ML Services

**Tasks:**
- [ ] Set up Vertex AI for LLM features
- [ ] Migrate voice transcription:
  - Option A: Continue with OpenAI Whisper via Cloud Function
  - Option B: Use Google Cloud Speech-to-Text
- [ ] Implement note summarization with Vertex AI

---

## Phase 3: Mobile Applications

**Goal:** Native iOS and Android apps with offline support and real-time sync
**Technology:** React Native (code sharing with web app)

### 3.1 React Native Project Setup

**Monorepo Structure:**
```
equine-physio-manager/
├── packages/
│   ├── shared/                 # Shared code
│   │   ├── api/               # API client, Firestore queries
│   │   ├── models/            # TypeScript interfaces
│   │   ├── validation/        # Zod schemas
│   │   ├── utils/             # Helper functions
│   │   └── hooks/             # Shared React hooks
│   ├── web/                   # React web app
│   │   ├── src/
│   │   └── package.json
│   └── mobile/                # React Native app
│       ├── src/
│       ├── ios/
│       ├── android/
│       └── package.json
├── package.json               # Workspace root
└── turbo.json                 # Turborepo config
```

**Tasks:**
- [ ] Set up monorepo with Turborepo/Nx
- [ ] Initialize React Native project
- [ ] Extract shared code from web app
- [ ] Configure path aliases and module resolution
- [ ] Set up development environment (iOS Simulator, Android Emulator)

### 3.2 Mobile UI Implementation

**Navigation Structure:**
```
Mobile App Navigation:
├── Tab Navigator (Bottom)
│   ├── Home (Dashboard)
│   ├── Appointments (Calendar)
│   ├── Clients
│   └── More (Settings, Profile)
└── Stack Navigators
    ├── Appointment Detail → Treatment Entry
    ├── Client Detail → Horse Detail
    ├── Invoice List → Invoice Detail
    └── Settings screens
```

**Mobile-Specific Features:**
- [ ] Native calendar integration
- [ ] Camera access for treatment photos
- [ ] Voice recording with native audio
- [ ] Location services for travel tracking
- [ ] Biometric authentication (Face ID, fingerprint)
- [ ] Native share sheet for invoices

**Tasks:**
- [ ] Implement bottom tab navigation
- [ ] Create mobile-optimized components
- [ ] Implement gesture-based interactions
- [ ] Native camera/photo picker
- [ ] Native audio recording
- [ ] Haptic feedback
- [ ] Platform-specific styling (iOS/Android)

### 3.3 Offline Support & Sync

**Sync Strategy:**
```
┌─────────────────────────────────────────────────────────┐
│                    SYNC ARCHITECTURE                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐         ┌─────────────┐               │
│  │   Mobile    │◄───────►│  Firestore  │               │
│  │   Device    │  Sync   │   Cloud     │               │
│  └─────────────┘         └─────────────┘               │
│        │                        ▲                       │
│        │                        │                       │
│        ▼                        │                       │
│  ┌─────────────┐         ┌─────────────┐               │
│  │   Local     │         │    Web      │               │
│  │  Storage    │         │    App      │               │
│  │ (Offline)   │         │             │               │
│  └─────────────┘         └─────────────┘               │
│                                                          │
│  Conflict Resolution: Last-Write-Wins + Merge           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Firestore Offline Persistence:**
```javascript
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
```

**Tasks:**
- [ ] Enable Firestore offline persistence
- [ ] Implement optimistic UI updates
- [ ] Handle offline queue for writes
- [ ] Sync status indicators
- [ ] Conflict resolution strategy
- [ ] Background sync when online
- [ ] Storage management (cache limits)

### 3.4 Push Notifications

**Notification Types:**
| Event | Notification |
|-------|--------------|
| Appointment reminder | "Appointment in 1 hour: 3 horses at Oak Farm" |
| Payment received | "Payment received: £85 from John Smith" |
| Invoice overdue | "Invoice #42 is overdue (14 days)" |
| Follow-up due | "Follow-up due: Bella at Oak Farm" |

**Tasks:**
- [ ] Set up Firebase Cloud Messaging (FCM)
- [ ] Configure APNs for iOS
- [ ] Implement notification handlers
- [ ] Create Cloud Function triggers for notifications
- [ ] User notification preferences
- [ ] Notification scheduling (reminders)

### 3.5 iOS App

**Requirements for App Store:**
- [ ] Apple Developer Account
- [ ] App Store Connect setup
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] App icons (all sizes)
- [ ] Launch screens
- [ ] Screenshots for all device sizes
- [ ] App Store description and metadata
- [ ] Sign in with Apple implementation (required)

**iOS-Specific Tasks:**
- [ ] Configure Xcode project
- [ ] Set up code signing
- [ ] Implement iOS-specific UI patterns
- [ ] TestFlight beta testing
- [ ] App Store submission

### 3.6 Android App

**Requirements for Play Store:**
- [ ] Google Play Developer Account
- [ ] Privacy policy URL
- [ ] App icons and feature graphic
- [ ] Screenshots for phone and tablet
- [ ] Store listing content
- [ ] Content rating questionnaire
- [ ] Target API level compliance

**Android-Specific Tasks:**
- [ ] Configure Gradle build
- [ ] Set up keystore for signing
- [ ] Implement Android-specific UI patterns
- [ ] Internal testing track
- [ ] Play Store submission

---

## Phase 4: Scale & Polish

**Goal:** Production hardening, analytics, and advanced features

### 4.1 Analytics & Monitoring

**Tasks:**
- [ ] Firebase Analytics integration
- [ ] Crashlytics for error reporting
- [ ] Performance monitoring
- [ ] Custom event tracking:
  - Appointment created/completed
  - Invoice sent/paid
  - Feature usage metrics
- [ ] User engagement metrics

### 4.2 Performance Optimization

**Tasks:**
- [ ] Firestore query optimization
- [ ] Image optimization and lazy loading
- [ ] Bundle size optimization (web)
- [ ] App startup time optimization (mobile)
- [ ] Memory usage profiling
- [ ] Battery usage optimization (mobile)

### 4.3 Security Hardening

**Tasks:**
- [ ] Security audit of Firestore rules
- [ ] API rate limiting
- [ ] Input validation (server-side)
- [ ] Penetration testing
- [ ] GDPR compliance review
- [ ] Data encryption at rest verification

### 4.4 Advanced Multi-Tenancy

**Team/Practice Support:**
```javascript
// Enhanced data model
{
  practice_id: string,      // Shared workspace
  owner_id: string,         // User who created
  team_access: string[],    // Array of user IDs with access
  visibility: 'private' | 'team' | 'practice'
}
```

**Tasks:**
- [ ] Practice/team entity
- [ ] User invitation flow
- [ ] Role-based permissions (admin, practitioner, assistant)
- [ ] Shared calendar view
- [ ] Team activity feed

### 4.5 Financial Reports & Export

**Tasks:**
- [ ] Revenue reports (by period, service, client)
- [ ] Outstanding invoices report
- [ ] Tax summary report
- [ ] CSV/Excel export
- [ ] Accountant-friendly formats

### 4.6 App Store Launch

**Pre-Launch Checklist:**
- [ ] Beta testing complete (TestFlight + Play Internal)
- [ ] All critical bugs fixed
- [ ] Performance benchmarks met
- [ ] Store assets finalized
- [ ] Marketing website ready
- [ ] Support documentation
- [ ] Privacy policy compliant

---

## GCP Services Summary

| Service | Purpose | Estimated Cost |
|---------|---------|----------------|
| **Firebase Auth** | User authentication | Free tier covers most |
| **Cloud Firestore** | Database | ~$0.18/100K reads |
| **Cloud Storage** | File storage | ~$0.02/GB/month |
| **Cloud Functions** | Serverless compute | ~$0.40/million invocations |
| **Cloud Run** | Container hosting | ~$0.00002/vCPU-second |
| **Firebase Hosting** | Web hosting | Free tier generous |
| **SendGrid** | Email delivery | Free up to 100/day |
| **Vertex AI** | LLM/AI features | Pay per use |

**Estimated Monthly Cost (small practice):** $10-50/month

---

## Technology Stack Summary

### Web Application
| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Build | Vite |
| Styling | Tailwind CSS |
| UI Components | Radix UI |
| State | TanStack Query + Firestore |
| Forms | React Hook Form + Zod |
| Hosting | Firebase Hosting |

### Mobile Applications
| Layer | Technology |
|-------|------------|
| Framework | React Native |
| Navigation | React Navigation |
| State | TanStack Query + Firestore |
| Offline | Firestore Persistence |
| Push | Firebase Cloud Messaging |
| Build | EAS Build (Expo) |

### Backend
| Layer | Technology |
|-------|------------|
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Cloud Storage |
| Functions | Cloud Functions (Node.js) |
| Email | SendGrid |
| AI/ML | Vertex AI / OpenAI |

---

## Pricing Model Reference

| Service | Suggested Default | Notes |
|---------|-------------------|-------|
| Equine Physio | £65-85 | Per horse, standard session |
| INDIBA | £55-75 | Per horse, therapy session |
| Canine Physio | £45-55 | Per dog |
| Grooming | £25-40 | Per horse |
| Initial Assessment | £75-95 | First visit, longer session |
| Follow-up | £55-65 | Shorter check-in |
| Call-out Fee | £10-20 | Base travel charge |
| Mileage | £0.45/mile | After X miles from base |

*Fully configurable by each practitioner*

---

## Questions for Beta User Review

### Pricing & Invoicing
1. Do you charge per horse or per appointment?
2. Do you have a call-out/travel fee?
3. Any multi-horse discounts?
4. Invoice immediately or batch weekly?
5. What payment methods do clients use?

### Daily Workflow
1. How do you currently plan your day/route?
2. What Cliniko features do you use most?
3. What Cliniko features do you never use?
4. Do you work offline often (poor signal at yards)?

### Mobile Requirements
1. Do you primarily use phone or tablet in the field?
2. Do you take photos during treatments?
3. Do you use voice notes?
4. How important is offline access?

### Team/Future Needs
1. Do you work with anyone else (assistant, receptionist)?
2. Would you share clients with other practitioners?
3. Any features you wish Cliniko had?

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| GCP migration complexity | High | Thorough testing, staged rollout |
| Mobile app rejection | Medium | Follow guidelines strictly, beta test |
| Data migration issues | High | Backup everything, test migration scripts |
| Offline sync conflicts | Medium | Clear conflict resolution, user notification |
| Cost overruns | Low | Set billing alerts, optimize queries |
| Beta user feedback changes scope | Medium | Prioritize ruthlessly, MVP first |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| App Store rating | 4.5+ stars |
| Crash-free sessions | 99.5%+ |
| Offline capability | Full CRUD operations |
| Sync latency | < 2 seconds |
| Invoice creation time | < 30 seconds |
| Page load (web) | < 2 seconds |
| App launch (mobile) | < 3 seconds |

---

## Next Steps

1. **Review this roadmap** with beta user
2. **Prioritize Phase 1 features** based on feedback
3. **Begin Phase 1 development** (still on Base44)
4. **Set up GCP project** in parallel
5. **Plan migration timeline** after Phase 1 complete

---

*Document Version 2.0 - Updated to include GCP migration, mobile apps, and multi-tenancy strategy*
