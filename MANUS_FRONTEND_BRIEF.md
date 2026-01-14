# Frontend Development Brief for Manus

**Project**: Equine Physiotherapy Manager
**Date**: 2026-01-14
**Backend Lead**: Claude
**Frontend Lead**: Manus
**Coordination**: Claude provides direction, both review each other's work

---

## 🎯 Mission Overview

You are the frontend developer for this equine physiotherapy management application. I (Claude) handle backend/API work, and together we ensure the application works seamlessly. I'll provide direction and coordinate our efforts.

---

## ✅ What Claude Just Fixed (Backend Health Check)

I completed a full backend and frontend health check and fixed 2 critical issues:

1. **CRITICAL**: Added missing path alias resolution to `vite.config.js` - this was blocking builds
2. Updated SDK version in serverless function for consistency

**Status**: Application is now healthy and ready for feature work.

---

## 🏗️ Application Architecture Overview

### Tech Stack (Frontend)
- **Framework**: React 18.2 + Vite 6.1
- **Routing**: React Router DOM 6.26
- **State**: TanStack React Query 5.84 (server state)
- **UI Library**: Radix UI components + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Tech Stack (Backend - Managed by Claude)
- **BaaS**: Base44 platform
- **SDK**: @base44/sdk 0.8.3
- **Functions**: Deno serverless (getMyData.ts)
- **Auth**: Base44 auth system
- **Database**: 7 entities (Client, Yard, Horse, Appointment, Treatment, Invoice, Settings)

---

## 📂 Frontend Code Structure

```
src/
├── api/               # Backend SDK clients (Claude manages)
│   ├── base44Client.js
│   ├── entities.js
│   ├── functions.js
│   └── integrations.js
├── pages/             # 22 page components (YOU manage)
│   ├── Home.jsx
│   ├── Appointments.jsx
│   ├── Clients.jsx
│   ├── Yards.jsx
│   ├── TreatmentEntry.jsx
│   └── ... (17 more)
├── components/        # Reusable components (YOU manage)
│   ├── ui/           # 70+ UI components
│   ├── appointments/  # Appointment-specific
│   └── AddressPrompt.jsx
├── lib/               # Utilities & context (SHARED)
│   ├── AuthContext.jsx  (Claude manages)
│   ├── query-client.js
│   └── utils.js
├── utils/             # Helper functions (YOU manage)
│   └── index.ts
├── App.jsx           # Main app component
└── Layout.jsx        # App shell with navigation
```

---

## 🎯 Your Immediate Tasks (Priority Order)

### 1. **Verify Build Works** ⚠️ DO THIS FIRST
```bash
npm run build
```

**Expected**: Build should succeed without path alias errors
**If it fails**: Let Claude know immediately - there may be other config issues

---

### 2. **Test Core User Flows** (End-to-End Testing)

#### Flow A: Create Appointment → Treatment → Invoice
1. Navigate to Appointments page
2. Click "New Appointment"
3. Select client, yard, horses, date/time
4. Save appointment
5. From Home page, click "Start Treatment"
6. Enter treatment details, add photos
7. Complete treatment
8. Click "Create Invoice"
9. Review and send invoice

**What to Check**:
- [ ] Forms validate properly
- [ ] Data saves correctly
- [ ] Navigation works between steps
- [ ] Loading states display
- [ ] Success messages appear
- [ ] Errors are handled gracefully

#### Flow B: Client & Horse Management
1. Create new client (Clients → New Client)
2. Add horse to client (from ClientDetail → Add Horse)
3. View horse details
4. Edit horse information
5. View horse treatment history

**What to Check**:
- [ ] Client-Horse relationship works
- [ ] Horse list displays correctly
- [ ] Treatment history shows up
- [ ] Edit forms pre-populate correctly

#### Flow C: Yard Management
1. Create new yard
2. Assign horses to yard
3. Schedule appointment at yard
4. View yard details

---

### 3. **UI/UX Polish Tasks**

#### Mobile Responsiveness
- [ ] Test on mobile viewport (375px width)
- [ ] Bottom navigation bar works correctly
- [ ] Hamburger menu opens/closes properly
- [ ] Forms are usable on mobile
- [ ] Cards/lists look good on small screens

#### Loading States
- [ ] Skeleton loaders display during data fetching
- [ ] Button loading states work (spinners)
- [ ] Page transitions feel smooth
- [ ] No flash of empty content

#### Empty States
- [ ] "No appointments" message is helpful
- [ ] "No clients" includes CTA button
- [ ] Empty lists have illustrations/icons
- [ ] Users know what action to take

#### Error Handling
- [ ] Form validation errors are clear
- [ ] API errors display user-friendly messages
- [ ] Network errors have retry options
- [ ] Auth errors redirect to login

---

### 4. **Component-Level Testing**

#### Forms (YOU OWN THIS)
Test all forms for:
- [ ] Field validation (required, email, phone formats)
- [ ] Error messages display correctly
- [ ] Submit button disables during submission
- [ ] Success feedback after save
- [ ] Cancel button works (navigates back)

**Critical Forms**:
- NewAppointment.jsx
- NewClient.jsx
- NewHorse.jsx
- TreatmentEntry.jsx
- CreateInvoice.jsx

#### Date/Time Pickers
- [ ] Calendar component works
- [ ] Time selection works
- [ ] Date formats correctly (using date-fns)
- [ ] Past dates handled appropriately

#### File Uploads
- [ ] Treatment photo upload works
- [ ] Image preview displays
- [ ] File size limits enforced
- [ ] Multiple files can be uploaded

---

### 5. **Integration Testing** (COORDINATE WITH CLAUDE)

These features interact with backend integrations:

#### Email Sending (Invoice emails)
- **Backend**: Claude will verify Base44 SendEmail integration
- **Frontend**: You test the "Send Invoice" button
- **Test**: Click send, verify success message, check email received

#### File Storage (Treatment photos)
- **Backend**: Claude will verify Base44 UploadFile integration
- **Frontend**: You test photo upload in TreatmentEntry
- **Test**: Upload image, verify it saves, check it displays in treatment history

#### Voice Recording (Treatment notes)
- **Frontend**: You test recording UI in TreatmentEntry
- **Backend**: Claude will verify transcription integration
- **Test**: Record audio, verify transcription appears

#### PDF Generation (Treatment history, Invoices)
- **Frontend**: You test "Download PDF" buttons
- **Test**: Generate PDF, verify formatting, check content accuracy

---

## 🐛 Known Issues to Watch For

### Issues Already Fixed by Claude ✅
- ~~Path alias resolution missing~~ → FIXED
- ~~SDK version mismatch~~ → FIXED

### Potential Issues to Monitor

1. **React Query Cache Issues**
   - Watch for stale data after mutations
   - May need to add `queryClient.invalidateQueries()` after creates/updates
   - If you see outdated data, let Claude know the queryKey

2. **Authentication Redirects**
   - If users get stuck in auth loops, check AuthContext
   - Token expiration might cause unexpected logouts
   - Report any 401/403 errors

3. **Mobile Safari Issues**
   - Date pickers may behave differently
   - File uploads may need special handling
   - Test on actual iOS device if possible

4. **Form Validation Edge Cases**
   - Recurring appointments logic
   - Horse selection with multiple horses
   - Invoice line item calculations

---

## 🤝 How We'll Work Together

### Your Responsibilities (Frontend)
- All UI components and pages
- Form validation and user input handling
- Responsive design and mobile optimization
- Client-side routing and navigation
- Component styling with Tailwind
- User experience and interactions

### Claude's Responsibilities (Backend)
- API endpoints and serverless functions
- Database schema and entity relationships
- Authentication and authorization
- Third-party integrations (email, file storage, etc.)
- Server-side validation and security
- Data fetching strategy (React Query setup)

### Shared Responsibilities
- Integration points between frontend and backend
- Error handling strategies
- Loading and empty states
- Testing end-to-end user flows
- Performance optimization

---

## 📞 Communication Protocol

### When to Ask Claude

1. **API Issues**
   - "This endpoint is returning 500 errors"
   - "I'm not getting the data I expected from getMyData"
   - "Authentication isn't working"

2. **Data Structure Questions**
   - "What fields are available on the Horse entity?"
   - "How do I query appointments by date?"
   - "What's the relationship between Client and Yard?"

3. **Integration Issues**
   - "File upload isn't working"
   - "Email sending fails"
   - "Voice transcription returns empty"

4. **Architecture Decisions**
   - "Should we add a new entity type?"
   - "How should we handle recurring appointments?"
   - "What's the best way to structure this query?"

### What Claude Needs From You

1. **Bug Reports**
   - Component name and file path
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser console errors (if any)

2. **Feature Requests**
   - User story or use case
   - Proposed UI/UX approach
   - Any data requirements

3. **Code Review Requests**
   - "Can you review my TreatmentEntry.jsx changes?"
   - "Does this approach align with our architecture?"
   - "Are there any security concerns here?"

---

## 🚀 Getting Started Checklist

Before you start coding:

- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Run `npm run build` to verify build works (should succeed now)
- [ ] Run `npm run dev` to start development server
- [ ] Open the app in browser and verify it loads
- [ ] Test login/authentication flow
- [ ] Review this document and ask Claude any questions

---

## 📊 Testing Checklist Template

Use this for each feature you work on:

```markdown
## Feature: [Name]
**Files Changed**:
- [ ] Component file(s)
- [ ] Page file(s)
- [ ] Utility functions

**Testing**:
- [ ] Desktop Chrome
- [ ] Desktop Safari/Firefox
- [ ] Mobile viewport (DevTools)
- [ ] Actual mobile device (if available)

**Functionality**:
- [ ] Happy path works
- [ ] Error cases handled
- [ ] Loading states display
- [ ] Empty states display
- [ ] Navigation works
- [ ] Data persists correctly

**Code Quality**:
- [ ] No console errors
- [ ] No ESLint warnings
- [ ] Proper TypeScript types (if applicable)
- [ ] Accessible (keyboard navigation, screen readers)

**Claude Review**: Requested? Y/N
**Status**: ⏳ In Progress | ✅ Complete | 🐛 Issues Found
```

---

## 🎨 Design System Quick Reference

### Colors
- **Primary**: `emerald-600` (green for actions)
- **Neutral**: `stone-50` to `stone-900` (grays)
- **Success**: `emerald-600`
- **Error**: `red-600`
- **Warning**: `yellow-600`

### Component Patterns
```jsx
// Standard button
<Button className="bg-emerald-600 hover:bg-emerald-700">
  Action
</Button>

// Card container
<div className="bg-white rounded-2xl border-2 border-stone-200 p-6">
  Content
</div>

// Page header
<PageHeader
  title="Page Title"
  action={<Button>New Item</Button>}
/>

// Empty state
<EmptyState
  icon={Icon}
  title="No items yet"
  description="Get started by creating one"
  action={<Button>Create Item</Button>}
/>
```

### Spacing
- Card padding: `p-6`
- Section spacing: `space-y-4` or `space-y-8`
- Page padding: `p-4 md:p-8`

### Typography
- Page title: `text-3xl font-bold text-stone-800`
- Section heading: `text-xl font-bold text-stone-800`
- Body text: `text-stone-700`
- Muted text: `text-stone-500`

---

## 📖 Resources

### Documentation
- [React Query Docs](https://tanstack.com/query/latest)
- [Radix UI Docs](https://www.radix-ui.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)

### Code Examples in Repo
- **Complex Form**: See `NewAppointment.jsx` (recurring appointments)
- **Data Fetching**: See `Home.jsx` (multiple dependent queries)
- **File Upload**: See `TreatmentEntry.jsx`
- **Responsive Layout**: See `Layout.jsx`

---

## ✅ Success Criteria

Your work is successful when:

1. ✅ All 22 pages load without errors
2. ✅ Users can complete core workflows end-to-end
3. ✅ Mobile experience is smooth and usable
4. ✅ Forms validate and save correctly
5. ✅ Loading/empty/error states are helpful
6. ✅ No console errors in browser DevTools
7. ✅ Build process completes successfully
8. ✅ Claude has reviewed and approved your changes

---

## 🎯 Let's Get Started!

**Your First Task**: Run the build and test the core appointment flow.

Reply to Claude when you've:
1. Verified the build works
2. Tested the appointment creation flow
3. Found any bugs or issues

Claude will be monitoring your progress and ready to help with any backend/integration issues you encounter.

Good luck, and let's build something great together! 🚀

---

**Questions?** Ask Claude anytime.
