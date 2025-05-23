# Frontend Exam Flow Integration Guide

This document provides all technical details needed for frontend integration with the exam flow system, including WebSocket events, channels, REST endpoints, and data structures.

## Table of Contents

- [WebSocket Technical Details](#websocket-technical-details)
- [REST API Endpoints](#rest-api-endpoints)
- [Key Entity Attributes](#key-entity-attributes)
- [Automated Operations](#automated-operations)
- [Frontend Integration Examples](#frontend-integration-examples)
- [Special Considerations](#special-considerations)

## WebSocket Technical Details

### Connection & Authentication

- **Connection URL**: Standard Socket.IO path (`/socket.io` by default)
- **Authentication**: JWT token via `auth.token` in handshake or `Authorization` header with `Bearer` prefix
- **Auto-subscription**: Students automatically subscribe to relevant exam channels on connection

### Channel Types & Naming Convention

- **Personal Channel**: `user:{userId}`
- **User Type Channel**: `userType:{userTypeId}` 
- **Event Schedule Channel**: `eventSchedule:{eventScheduleId}`
- **Course Channel**: `course:{courseId}`
- **Lab Channel**: `lab:{labId}`

### WebSocket Event Types

#### Core Events
- `ping` / `pong` - Connection health check
- `error` - Error notifications

#### Exam Events
- `exam:mode_start` - Exam mode activated (30 min before exam)
- `exam:access_granted` - Exam started, files accessible
- `exam:end` - Exam ended

#### Privilege Events
- `privilege:change` - User privilege changes

#### General Events
- `notification` - General notifications

### WebSocket Event Data Structures

#### Exam Mode Start Event
```typescript
// Event: 'exam:mode_start'
{
  eventScheduleId: UUID,
  eventName: string,
  status: 'exam_mode_start',
  timestamp: string (ISO format)
}
```

#### Exam Access Granted Event
```typescript
// Event: 'exam:access_granted'
{
  eventScheduleId: UUID,
  eventName: string,
  examFiles?: string, // URL to exam files
  canAccess: true,
  timestamp: string (ISO format)
}
```

#### Exam End Event
```typescript
// Event: 'exam:end'
{
  eventScheduleId: UUID,
  eventName: string,
  status: 'exam_end',
  timestamp: string (ISO format)
}
```

#### Privilege Change Event
```typescript
// Event: 'privilege:change'
{
  privilege: string, // privilege code
  granted: boolean, // true if granted, false if revoked
  timestamp: string (ISO format),
  resourceIds?: UUID[] | null // specific resources affected
}
```

### Manual Channel Management

```javascript
// Join specific event channels
socket.emit('join_event_channels', {
  eventScheduleIds: ['schedule-uuid-1', 'schedule-uuid-2']
});

// Response
socket.on('event_channels_joined', (data) => {
  console.log(data.joinedChannels); // Array of joined channel IDs
  console.log(data.message); // Success message
});
```

## REST API Endpoints

### Event Management

#### Create Event
```http
POST /events
Content-Type: application/json
Authorization: Bearer {token}
```

#### Get All Events
```http
GET /events
Authorization: Bearer {token}
```

#### Get Event by ID
```http
GET /events/{id}
Authorization: Bearer {token}
```

#### Update Event
```http
PATCH /events/{id}
Content-Type: application/json
Authorization: Bearer {token}
```

#### Delete Event
```http
DELETE /events/{id}
Authorization: Bearer {token}
```

### Exam Group & Scheduling

#### Calculate Optimal Groups
```http
GET /events/{id}/calculate-groups
Authorization: Bearer {token}
```

**Response:**
```json
{
  "totalStudents": 150,
  "requiredSessions": 5,
  "groupDistribution": [
    {
      "courseGroupId": "group-uuid",
      "courseGroupName": "Group 1",
      "studentCount": 30,
      "recommendedSessions": 1,
      "maxStudentsPerSession": 30
    }
  ],
  "labAvailability": [
    {
      "labId": "lab-uuid",
      "labName": "Computer Lab 1",
      "capacity": 30,
      "availableSlots": 30
    }
  ]
}
```

#### Create Exam Groups and Schedules
```http
POST /events/{id}/create-groups
Content-Type: application/json
Authorization: Bearer {token}

{
  "schedules": [
    {
      "courseGroupId": "group-uuid",
      "labId": "lab-uuid",
      "dateTime": "2024-01-15T09:00:00Z",
      "assistantId": "assistant-uuid",
      "maxStudents": 30
    }
  ]
}
```

### Exam Control

#### Start Exam Manually
```http
POST /events/{scheduleId}/start
Authorization: Bearer {token}
```

#### End Exam Manually
```http
POST /events/{scheduleId}/end
Authorization: Bearer {token}
```

### Student Endpoints

#### Get Exam Mode Status
```http
GET /events/student/exam-mode-status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "isInExamMode": true,
  "examStartsIn": 15, // minutes until exam mode starts
  "examSchedules": [
    {
      "eventScheduleId": "schedule-uuid",
      "eventName": "Midterm Exam",
      "dateTime": "2024-01-15T09:00:00Z",
      "status": "exam_mode_active"
    }
  ]
}
```

#### Get Event Schedule IDs for WebSocket
```http
GET /events/student/schedule-ids
Authorization: Bearer {token}
```

**Response:**
```json
["schedule-uuid-1", "schedule-uuid-2"]
```

## Key Entity Attributes

### Event Entity (Important Fields)
- `autoStart` (boolean) - Whether exam auto-starts at scheduled time
- `examModeStartMinutes` (number) - Minutes before exam to activate exam mode (default: 30)
- `isExam` (boolean) - Whether this is an exam event
- `isInLab` (boolean) - Whether exam is conducted in lab
- `examFiles` (string) - Exam files/resources URL
- `duration` (number) - Exam duration in minutes
- `degree` (number) - Total marks/points for exam

### Event Schedule Entity (Important Fields)
- `status` (enum) - `scheduled`, `exam_mode_active`, `started`, `ended`, `cancelled`
- `actualStartTime` (Date) - When exam actually started
- `actualEndTime` (Date) - When exam actually ended  
- `examModeStartTime` (Date) - When exam mode was activated
- `maxStudents` (number) - Maximum students for session
- `enrolledStudents` (number) - Current enrolled student count
- `examFiles` (string) - Schedule-specific exam files override

### Student Event Schedule Entity (Important Fields)
- `isInExamMode` (boolean) - Whether student is currently in exam mode
- `examModeEnteredAt` (Date) - When student entered exam mode
- `examStartedAt` (Date) - When student started the exam
- `hasAttended` (boolean) - Whether student attended
- `examModel` (string) - Exam model/version assigned
- `seatNo` (string) - Assigned seat number
- `mark` (number) - Student's exam mark
- `submittedAt` (Date) - When student submitted exam

## Automated Operations

### Cron Jobs (Runs Every Minute)
1. **Exam Mode Activation** - Activates exam mode 30 minutes (configurable) before exam start
2. **Auto-Start Exams** - Automatically starts exams if `autoStart` is enabled  
3. **Auto-End Exams** - Automatically ends exams after duration expires

### Exam Status Flow
```
SCHEDULED → EXAM_MODE_ACTIVE → STARTED → ENDED
               ↓
           CANCELLED (manual intervention)
```

## Frontend Integration Examples

### React/JavaScript WebSocket Integration

```javascript
import io from 'socket.io-client';

// Connect to WebSocket
const socket = io('ws://localhost:3000', {
  auth: {
    token: `Bearer ${authToken}`
  }
});

// Listen for exam events
socket.on('exam:mode_start', (data) => {
  console.log('Exam mode started:', data);
  // Show exam mode UI, restrict navigation
  showExamModeInterface(data);
});

socket.on('exam:access_granted', (data) => {
  console.log('Exam access granted:', data);
  // Enable exam interface, show exam files
  enableExamInterface(data);
  if (data.examFiles) {
    loadExamFiles(data.examFiles);
  }
});

socket.on('exam:end', (data) => {
  console.log('Exam ended:', data);
  // Disable exam interface, show results/summary
  disableExamInterface(data);
});

socket.on('privilege:change', (data) => {
  console.log('Privilege changed:', data);
  // Update user permissions in UI
  updateUserPrivileges(data);
});

// Manual channel subscription for specific exams
const subscribeToExamChannels = (scheduleIds) => {
  socket.emit('join_event_channels', {
    eventScheduleIds: scheduleIds
  });
};

socket.on('event_channels_joined', (data) => {
  console.log('Joined channels:', data.joinedChannels);
});

// Check exam status on page load
const checkExamStatus = async () => {
  try {
    const response = await fetch('/events/student/exam-mode-status', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    const status = await response.json();
    
    if (status.isInExamMode) {
      showExamModeInterface(status);
    }
    
    if (status.examStartsIn !== undefined) {
      showExamCountdown(status.examStartsIn);
    }
  } catch (error) {
    console.error('Failed to check exam status:', error);
  }
};
```

### Error Handling

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Handle connection errors, show user feedback
  showErrorMessage(error.message);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Handle disconnection, attempt reconnection
  if (reason === 'io server disconnect') {
    // Server forced disconnect, don't auto-reconnect
    showConnectionError('Server disconnected');
  }
});
```

## Special Considerations

### Student Auto-Subscription
- Students automatically subscribe to exam channels for the next 7 days upon connection
- Only enrolled exam events are included in auto-subscription
- Manual subscription available via `join_event_channels` for specific events

### Exam Mode Behavior
- **Exam Mode Start**: UI should restrict navigation, show countdown, prepare exam interface
- **Exam Access Granted**: Enable exam content, show exam files, start exam timer
- **Exam End**: Disable exam interface, show submission status, restore normal navigation

### Privilege System Integration
- Real-time privilege changes affect access to exam management features
- `resourceIds` may specify access to specific exams or resources
- Frontend should update UI permissions immediately upon receiving privilege changes

### Security Considerations
- All WebSocket connections require valid JWT authentication
- Students can only join channels for exams they're enrolled in
- Exam files are only accessible during active exam periods
- All exam operations should be validated on both client and server

### Performance Tips
- Cache exam status locally to reduce API calls
- Use WebSocket events as primary source of truth for real-time updates
- Implement proper loading states during exam transitions
- Handle network interruptions gracefully during exams

### Testing Considerations
- Test WebSocket reconnection during exam sessions
- Verify proper cleanup when exams end
- Test privilege changes during active exam sessions
- Ensure exam mode restrictions work correctly across browser tabs 