# Backend Development Notes - Claude

**Project**: Equine Physiotherapy Manager
**Role**: Backend Developer & Technical Coordinator
**Frontend Dev**: Manus
**Last Updated**: 2026-01-14

---

## 🎯 My Responsibilities

As backend developer, I handle:
- API endpoints and serverless functions
- Database schema and entity management
- Authentication and authorization
- Base44 SDK integration
- Server-side validation and security
- Third-party integrations (email, file storage, LLM)
- React Query setup and data fetching patterns

I also **provide technical direction** to Manus and **review frontend code** for architectural alignment.

---

## ✅ Recent Work Completed

### Health Check - 2026-01-14

**Issues Fixed**:
1. ✅ Added path alias resolution to vite.config.js (CRITICAL)
2. ✅ Updated SDK version in functions/getMyData.ts to 0.8.3

**Files Modified**:
- `vite.config.js` - Added resolve.alias for @/ imports
- `functions/getMyData.ts` - SDK version consistency

**Verification Completed**:
- ✅ All 7 entities properly configured
- ✅ Authentication flow working correctly
- ✅ Multi-tenancy security enforced (created_by filter)
- ✅ All imports resolve correctly
- ✅ All components exist and are importable
- ✅ No broken dependencies

---

## 🏗️ Backend Architecture

### Database Entities (7 Total)

```typescript
// Managed via Base44 SDK

1. Client
   - id: UUID
   - name: string
   - email: string
   - phone: string
   - address: string
   - created_by: string (user email)
   - created_date: timestamp

2. Yard (Facility/Stable)
   - id: UUID
   - name: string
   - address: string
   - location: { lat, lng }
   - created_by: string
   - created_date: timestamp

3. Horse
   - id: UUID
   - name: string
   - client_id: UUID (FK → Client)
   - yard_id: UUID (FK → Yard)
   - age: number
   - sex: enum (Male, Female, Gelding) **NEW**
   - discipline: string[] (dressage, jumping, etc.)
   - medical_notes: text
   - photos: string[] (file URLs)
   - created_by: string
   - created_date: timestamp

4. Appointment
   - id: UUID
   - client_id: UUID (FK → Client)
   - yard_id: UUID (FK → Yard, nullable)
   - horse_ids: UUID[] (FK → Horse, array)
   - appointment_type_id: UUID (FK → AppointmentType, nullable) **NEW**
   - date: date (YYYY-MM-DD)
   - time: time (HH:MM)
   - notes: text
   - status: enum (scheduled, completed, cancelled)
   - recurring: boolean
   - recurrence_pattern: object
   - created_by: string
   - created_date: timestamp

5. Treatment
   - id: UUID
   - appointment_id: UUID (FK → Appointment)
   - horse_id: UUID (FK → Horse)
   - treatment_types: string[] (massage, stretching, etc.)
   - notes: text (rich text)
   - photos: string[] (file URLs)
   - voice_recording: string (file URL)
   - transcription: text
   - follow_up_date: date
   - status: enum (completed, pending, cancelled)
   - created_by: string
   - created_date: timestamp

6. Invoice
   - id: UUID
   - appointment_id: UUID (FK → Appointment)
   - client_id: UUID (FK → Client)
   - line_items: object[]
   - subtotal: number
   - tax: number
   - total_amount: number
   - status: enum (draft, sent, paid, overdue)
   - due_date: date
   - sent_date: date
   - paid_date: date
   - notes: text
   - created_by: string
   - created_date: timestamp

7. Settings
   - id: UUID
   - user_id: string (user email)
   - home_address: string
   - business_name: string
   - pricing_config: object
   - created_by: string
   - created_date: timestamp

8. AppointmentType **NEW**
   - id: UUID
   - name: string (e.g., "Equine Physio", "INDIBA")
   - duration_in_minutes: number (e.g., 60, 45)
   - color: string (hex color, e.g., "#B8D9FF")
   - description: text (optional)
   - created_by: string
   - created_date: timestamp
```

### Entity Relationships

```
Client (1) ──→ (Many) Horse
Client (1) ──→ (Many) Appointment
Client (1) ──→ (Many) Invoice

Yard (1) ──→ (Many) Horse
Yard (1) ──→ (Many) Appointment

Horse (1) ──→ (Many) Treatment
Horse (Many) ←─→ (Many) Appointment (via horse_ids array)

Appointment (1) ──→ (Many) Treatment
Appointment (1) ──→ (0-1) Invoice

Treatment (1) ──→ (1) Horse
Treatment (1) ──→ (1) Appointment
```

---

## 🔒 Security Implementation

### Multi-Tenancy (CRITICAL)

**Server-Side Enforcement** in `functions/getMyData.ts`:

```typescript
// ALWAYS filter by authenticated user
const secureQuery = {
  ...query,
  created_by: user.email
};
```

**Security Guarantees**:
- ✅ All queries filtered by `created_by: user.email`
- ✅ No user can access another user's data
- ✅ Enforced server-side (cannot be bypassed from frontend)
- ✅ Authentication required (401 if no user)

### Authentication Flow

1. **App Load** → AuthContext checks app public settings
2. **Token Check** → Verifies token via `base44.auth.me()`
3. **Route Protection** → AuthenticatedApp component guards routes
4. **API Calls** → All calls include token automatically
5. **Token Expiry** → Redirects to login via `navigateToLogin()`

**Error States Handled**:
- `auth_required` → Redirect to login
- `user_not_registered` → Show error page
- `401/403` → Token expired, trigger re-auth

---

## 🔌 Base44 Integrations Available

### Email Integration
```javascript
import { SendEmail } from '@/api/integrations';

await SendEmail.invoke({
  to: 'client@example.com',
  subject: 'Your Invoice',
  html: '<html>...</html>',
  from: 'noreply@app.com'
});
```

**Use Cases**:
- Invoice sending (InvoiceDetail.jsx)
- Appointment reminders
- Treatment follow-up notifications

### File Upload Integration
```javascript
import { UploadFile, UploadPrivateFile } from '@/api/integrations';

const result = await UploadFile.invoke({
  file: fileBlob,
  fileName: 'treatment-photo.jpg',
  contentType: 'image/jpeg'
});
// Returns: { url: 'https://...' }
```

**Use Cases**:
- Treatment photos (TreatmentEntry.jsx)
- Horse photos (NewHorse.jsx, EditHorse.jsx)
- Invoice attachments

### File Signed URLs
```javascript
import { CreateFileSignedUrl } from '@/api/integrations';

const result = await CreateFileSignedUrl.invoke({
  fileUrl: 'https://...',
  expiresIn: 3600 // seconds
});
// Returns: { signedUrl: 'https://...' }
```

**Use Cases**:
- Private file access
- Temporary download links

### LLM Integration
```javascript
import { InvokeLLM } from '@/api/integrations';

const result = await InvokeLLM.invoke({
  prompt: 'Summarize this treatment note...',
  model: 'gpt-4',
  maxTokens: 500
});
```

**Potential Use Cases**:
- Treatment note summarization
- Voice transcription cleanup
- Invoice description generation

### Image Generation
```javascript
import { GenerateImage } from '@/api/integrations';

const result = await GenerateImage.invoke({
  prompt: 'A horse in a field',
  size: '1024x1024'
});
// Returns: { url: 'https://...' }
```

**Potential Use Cases**:
- Placeholder images
- Report illustrations

### File Data Extraction
```javascript
import { ExtractDataFromUploadedFile } from '@/api/integrations';

const result = await ExtractDataFromUploadedFile.invoke({
  fileUrl: 'https://...',
  fileType: 'pdf'
});
// Returns: { text: '...' }
```

**Potential Use Cases**:
- Extract text from uploaded documents
- Parse veterinary reports

---

## 📊 React Query Setup (Data Fetching Strategy)

### Query Client Configuration

```javascript
// src/lib/query-client.js
export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});
```

### Standard Query Pattern

```javascript
const { data, isLoading, error } = useQuery({
  queryKey: ['entityName', filters],
  queryFn: async () => {
    const response = await base44.functions.invoke('getMyData', {
      entity: 'EntityName',
      query: { /* filters */ }
    });
    return response.data.data;
  },
  enabled: !!prerequisiteData,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000    // 10 minutes (was cacheTime)
});
```

### Mutation Pattern

```javascript
const mutation = useMutation({
  mutationFn: async (newData) => {
    return await EntityName.create(newData);
  },
  onSuccess: () => {
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['entityName'] });
  }
});
```

### Common Query Keys

```javascript
// Appointments
['appointments'] // All appointments
['appointments', 'today'] // Today's appointments
['appointments', date] // Specific date

// Clients
['clients'] // All clients
['clients', clientIds] // Specific clients
['client', id] // Single client

// Horses
['horses'] // All horses
['horses', horseIds] // Specific horses
['horse', id] // Single horse

// Treatments
['treatments'] // All treatments
['treatments', appointmentId] // By appointment

// Invoices
['invoices'] // All invoices
['invoice', id] // Single invoice
```

---

## 🐛 Issues to Monitor

### Potential Issues from Health Check

1. **React Query Cache Staleness**
   - Watch for stale data after mutations
   - May need to add `invalidateQueries` after creates/updates
   - Example: Creating a horse doesn't show up in horse list

2. **File Upload Size Limits**
   - Base44 may have file size limits
   - Need to handle large images (compression?)
   - Watch for upload failures

3. **Recurring Appointment Logic**
   - Complex logic in NewAppointment.jsx
   - May need backend support for generating recurring instances
   - Watch for edge cases (monthly on 31st, leap years, etc.)

4. **Invoice Calculation Accuracy**
   - Line item totals
   - Tax calculation
   - Rounding errors with currency

5. **Voice Transcription**
   - Integration may need configuration
   - Watch for transcription accuracy
   - Handle errors gracefully

---

## 🤝 Coordination with Manus

### Code Review Protocol

When Manus submits code for review:

1. **Check Architecture Alignment**
   - Does it follow established patterns?
   - Is data fetching done correctly with React Query?
   - Are API calls going through proper channels?

2. **Security Review**
   - No client-side auth bypasses
   - Proper token handling
   - No exposure of sensitive data

3. **Performance Review**
   - Unnecessary re-renders?
   - Expensive computations?
   - Too many API calls?

4. **Integration Points**
   - Does it work with backend APIs?
   - Are error states handled?
   - Loading states implemented?

### When Manus Reports Issues

**API Errors (500, 401, 403)**:
- Check function logs
- Verify authentication
- Check query structure
- Verify entity exists

**Data Not Showing**:
- Check query key
- Verify data returned from function
- Check created_by filter
- Verify relationships are correct

**Integration Failures**:
- Check Base44 integration config
- Verify API keys/credentials
- Check rate limits
- Review integration logs

---

## 🔧 Backend Tasks to Complete

### Immediate Priorities

- [ ] **Monitor Manus's build test** - Ensure vite.config.js fix works
- [ ] **Test getMyData function** - Verify all entities return data correctly
- [ ] **Verify email integration** - Test invoice sending
- [ ] **Verify file upload integration** - Test treatment photo upload
- [ ] **Check voice transcription** - Ensure integration is configured

### Future Enhancements

- [ ] Add pagination to getMyData function (for large datasets)
- [ ] Add sorting options to entity queries
- [ ] Implement batch operations for efficiency
- [ ] Add server-side validation for complex rules
- [ ] Create webhook handlers for async operations
- [ ] Implement caching strategy for frequently accessed data

### Performance Optimizations

- [ ] Add indexes to frequently queried fields
- [ ] Implement data prefetching for predictable user flows
- [ ] Optimize query patterns (reduce N+1 queries)
- [ ] Add database query monitoring
- [ ] Implement API response compression

---

## 📝 Notes for Next Session

### Things to Discuss with Manus

1. **Recurring Appointments**: Do we need backend support for generating instances?
2. **File Upload UX**: What's the max file size we should allow?
3. **Email Templates**: Should we create reusable email templates?
4. **Error Messages**: Standardize error message format?
5. **Loading States**: Consistent loading spinner/skeleton pattern?

### Things to Monitor

1. Are query keys consistent across the app?
2. Is invalidateQueries being called after mutations?
3. Are loading states implemented everywhere?
4. Are error boundaries in place?
5. Is the app performant with large datasets?

---

## 🚀 Success Metrics

**Backend is successful when**:
- ✅ All API endpoints respond correctly
- ✅ Authentication works seamlessly
- ✅ Data is properly isolated between users
- ✅ Integrations function reliably
- ✅ No server errors in production
- ✅ Response times are acceptable (<500ms)
- ✅ Frontend team is unblocked

**Coordination is successful when**:
- ✅ Manus understands architecture
- ✅ Issues are resolved quickly
- ✅ Code reviews are constructive
- ✅ Both frontend and backend work together
- ✅ User experience is seamless

---

## 📖 Quick Reference

### Run Backend Tests
```bash
# Test getMyData function locally (if testing setup exists)
deno test functions/getMyData.test.ts
```

### Check Function Logs
```bash
# Via Base44 dashboard or CLI
base44 logs functions/getMyData
```

### Deploy Backend Changes
```bash
# Via Base44 CLI
base44 deploy functions
```

### Check API Health
```bash
# Test endpoint directly
curl -X POST https://api.base44.com/functions/v1/getMyData \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"entity": "Client", "query": {}}'
```

---

**Last Updated**: 2026-01-14
**Next Review**: After Manus completes initial testing
**Status**: ✅ Backend Healthy, Coordinating with Frontend
