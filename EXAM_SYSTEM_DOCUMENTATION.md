# Exam Management System Documentation

## Overview

The Exam Management System is a comprehensive solution for managing student examinations within the ASU Science Management Backend. It provides automated exam scheduling, real-time exam mode management, and WebSocket-based notifications for seamless exam experiences.

## Key Features

### 1. Event Management
- Create and manage exam events with configurable settings
- Support for both lab-based and classroom-based exams
- Automatic and manual exam start/end capabilities
- Exam file management and distribution

### 2. Group Calculation & Scheduling
- Intelligent calculation of optimal student group distribution
- Lab capacity management and availability checking
- Automated student assignment to exam sessions
- Support for multiple exam sessions per event

### 3. Exam Mode Management
- Automatic exam mode activation (30 minutes before exam by default)
- Real-time status tracking for students and administrators
- WebSocket notifications for exam state changes
- Student exam mode verification and access control

### 4. Real-time Communication
- WebSocket-based notifications for exam events
- Channel-based communication for specific exam sessions
- Automatic student subscription to relevant exam channels
- Real-time exam access notifications

## Database Schema

### Events Table
```sql
- id: UUID (Primary Key)
- name: VARCHAR (Event name)
- duration: INTEGER (Duration in minutes)
- isExam: BOOLEAN (Whether this is an exam)
- isInLab: BOOLEAN (Whether exam is conducted in lab)
- examFiles: TEXT (Exam files/resources, nullable)
- degree: INTEGER (Total marks/degree)
- autoStart: BOOLEAN (Auto-start exam at scheduled time)
- examModeStartMinutes: INTEGER (Minutes before exam to activate exam mode)
- description: TEXT (Event description, nullable)
- courseId: UUID (Foreign key to courses)
```

### Event Schedules Table
```sql
- id: UUID (Primary Key)
- eventId: UUID (Foreign key to events)
- labId: UUID (Foreign key to labs)
- dateTime: TIMESTAMP (Scheduled exam time)
- examFiles: TEXT (Schedule-specific exam files, nullable)
- assistantId: UUID (Foreign key to assistant user)
- status: ENUM (scheduled, exam_mode_active, started, ended, cancelled)
- actualStartTime: TIMESTAMP (When exam actually started)
- actualEndTime: TIMESTAMP (When exam actually ended)
- examModeStartTime: TIMESTAMP (When exam mode was activated)
- maxStudents: INTEGER (Maximum students for this session)
- enrolledStudents: INTEGER (Number of enrolled students)
- examGroupId: UUID (Foreign key to exam groups, nullable)
```

### Exam Groups Table
```sql
- id: UUID (Primary Key)
- eventId: UUID (Foreign key to events)
- courseGroupId: UUID (Foreign key to course groups)
- groupNumber: INTEGER (Group sequence number)
- expectedStudentCount: INTEGER (Expected number of students)
- actualStudentCount: INTEGER (Actual enrolled students)
- notes: TEXT (Additional notes, nullable)
```

### Student Event Schedules Table
```sql
- eventSchedule_id: UUID (Composite Primary Key)
- student_id: UUID (Composite Primary Key)
- hasAttended: BOOLEAN (Whether student attended, nullable)
- examModel: VARCHAR (Exam model/version, nullable)
- seatNo: VARCHAR (Assigned seat number, nullable)
- mark: FLOAT (Student's mark, nullable)
- submittedAt: TIMESTAMP (When student submitted, nullable)
- isInExamMode: BOOLEAN (Whether student is in exam mode)
- examModeEnteredAt: TIMESTAMP (When student entered exam mode)
- examStartedAt: TIMESTAMP (When student started the exam)
```

## API Endpoints

### Event Management

#### Create Event
```http
POST /events
Content-Type: application/json

{
  "name": "Midterm Exam",
  "duration": 120,
  "isExam": true,
  "isInLab": true,
  "examFiles": "exam-files-url",
  "degree": 30,
  "autoStart": false,
  "examModeStartMinutes": 30,
  "description": "Computer Science Midterm Examination",
  "courseId": "course-uuid"
}
```

#### Get All Events
```http
GET /events
```

#### Get Event by ID
```http
GET /events/{id}
```

#### Update Event
```http
PATCH /events/{id}
Content-Type: application/json

{
  "autoStart": true,
  "examModeStartMinutes": 45
}
```

#### Delete Event
```http
DELETE /events/{id}
```

### Exam Group Management

#### Calculate Optimal Groups
```http
GET /events/{id}/calculate-groups
```

Response:
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
```

#### End Exam Manually
```http
POST /events/{scheduleId}/end
```

### Student Endpoints

#### Get Exam Mode Status
```http
GET /events/student/exam-mode-status
```

Response:
```json
{
  "isInExamMode": true,
  "examStartsIn": 15,
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
```

Response:
```json
["schedule-uuid-1", "schedule-uuid-2"]
```

## WebSocket Events

### Connection
Students automatically subscribe to relevant event schedule channels upon connection.

### Event Types

#### Exam Mode Start
```javascript
// Event: 'exam:mode_start'
{
  "eventScheduleId": "schedule-uuid",
  "eventName": "Midterm Exam",
  "status": "exam_mode_start",
  "timestamp": "2024-01-15T08:30:00Z"
}
```

#### Exam Start (Access Granted)
```javascript
// Event: 'exam:access_granted'
{
  "eventScheduleId": "schedule-uuid",
  "eventName": "Midterm Exam",
  "examFiles": "exam-files-url",
  "canAccess": true,
  "timestamp": "2024-01-15T09:00:00Z"
}
```

#### Exam End
```javascript
// Event: 'exam:end'
{
  "eventScheduleId": "schedule-uuid",
  "eventName": "Midterm Exam",
  "status": "exam_end",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

### Manual Channel Subscription
```javascript
// Client can manually join specific event channels
socket.emit('join_event_channels', {
  eventScheduleIds: ['schedule-uuid-1', 'schedule-uuid-2']
});

// Response
socket.on('event_channels_joined', (data) => {
  console.log(data.joinedChannels); // Array of successfully joined channels
});
```

## Automated Operations

### Cron Jobs
The system runs automated operations every minute:

1. **Exam Mode Activation**: Activates exam mode 30 minutes (configurable) before exam start
2. **Auto-Start Exams**: Automatically starts exams if `autoStart` is enabled
3. **Auto-End Exams**: Automatically ends exams after the duration expires

### Exam Status Flow
```
SCHEDULED → EXAM_MODE_ACTIVE → STARTED → ENDED
                ↓
            CANCELLED (manual)
```

## Usage Examples

### Frontend Integration

#### React/JavaScript Example
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
  // Show exam mode UI
});

socket.on('exam:access_granted', (data) => {
  console.log('Exam access granted:', data);
  // Enable exam interface, show exam files
});

socket.on('exam:end', (data) => {
  console.log('Exam ended:', data);
  // Disable exam interface, show results
});

// Get student's exam status
fetch('/events/student/exam-mode-status')
  .then(response => response.json())
  .then(data => {
    if (data.isInExamMode) {
      // Student is in exam mode
      showExamModeUI();
    }
  });
```

### Admin Workflow

1. **Create Event**: Define exam parameters and settings
2. **Calculate Groups**: Analyze student distribution and lab requirements
3. **Create Schedules**: Set up exam sessions based on calculations
4. **Monitor**: Track exam progress and manually control if needed

### Student Experience

1. **Automatic Notification**: Receive exam mode notification 30 minutes before exam
2. **Exam Mode**: Interface switches to exam mode, limiting functionality
3. **Exam Access**: Gain access to exam materials when exam starts
4. **Real-time Updates**: Receive notifications about exam status changes

## Security Considerations

- WebSocket connections require valid JWT authentication
- Students can only join channels for exams they're enrolled in
- Exam files are only accessible during active exam periods
- All exam operations are logged for audit purposes

## Configuration

### Environment Variables
```env
# WebSocket Configuration
WEBSOCKET_PATH=/socket.io
WEBSOCKET_PING_TIMEOUT=60000
WEBSOCKET_PING_INTERVAL=25000

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
```

### Event Configuration
- `examModeStartMinutes`: Minutes before exam to activate exam mode (default: 30)
- `autoStart`: Whether to automatically start exams at scheduled time
- `duration`: Exam duration in minutes for auto-end functionality

## Troubleshooting

### Common Issues

1. **Students not receiving notifications**
   - Check WebSocket connection
   - Verify student is enrolled in the exam
   - Ensure proper channel subscription

2. **Exam not starting automatically**
   - Verify `autoStart` is enabled
   - Check exam schedule time
   - Review cron job logs

3. **Group calculation errors**
   - Ensure course groups have students assigned
   - Verify lab capacities are set
   - Check course-lab relationships

### Monitoring

- Check application logs for cron job execution
- Monitor WebSocket connection counts
- Track exam status transitions in database
- Review student exam mode entries and exits

## Future Enhancements

- Exam proctoring integration
- Advanced analytics and reporting
- Mobile app support
- Offline exam capabilities
- Integration with learning management systems 