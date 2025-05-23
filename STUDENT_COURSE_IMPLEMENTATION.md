# Student Course Management System

This implementation provides a comprehensive student course enrollment system with automatic group assignment based on lab capacity and software requirements, enhanced with CRON job automation and comprehensive course management features.

## Features Implemented

### 1. Course Groups (`CourseGroup` Entity)
- **Purpose**: Organizes students within courses into manageable groups
- **Key Fields**:
  - `courseId`: Reference to the course
  - `order`: Defines the priority/sequence of groups (lower order = higher priority)
  - `labId`: Assigned lab for the group
  - `isDefault`: Marks the default group for a course
  - `capacity`: Automatically calculated based on lab resources

### 2. Student Course Enrollment (`StudentCourses` Entity)
- **Enhanced Entity**: Extended existing entity with course group relationship
- **Key Fields**:
  - `studentId` & `courseId`: Primary keys (composite)
  - `courseGroupId`: Foreign key to assigned course group
  - `groupNumber`: Order number of the assigned group

### 3. Automatic Group Assignment Logic

#### Capacity Calculation Algorithm
The system automatically calculates group capacity based on:

1. **Lab Devices**: Count of available devices in the assigned lab
2. **Software Requirements**: Course-specific software needs
3. **Device Compatibility**: Devices must have all required software without issues

```typescript
// Pseudo-logic for capacity calculation
if (course has no software requirements) {
    capacity = total_devices_in_lab
} else {
    capacity = devices_with_all_required_software_and_no_issues
}
```

#### Group Assignment Process
When a student enrolls:

1. **Validation**: Check if student and course exist
2. **Duplicate Check**: Ensure student isn't already enrolled
3. **Group Selection**: 
   - Find groups ordered by `order` field (ascending)
   - Calculate current enrollment vs capacity
   - Assign to first available group
4. **Enrollment Creation**: Create StudentCourse record with assigned group

### 4. CRON Job Automation

#### Automatic Default Group Creation
- **Schedule**: Runs every minute
- **Purpose**: Creates default groups for practical courses automatically
- **Robust Error Handling**:
  - Gracefully handles missing tables during database initialization
  - Checks table existence before executing queries
  - Individual course processing errors don't stop batch operations
  - Race condition protection to prevent duplicate group creation
- **Smart Lab Assignment**:
  - Attempts to assign to existing course-lab relationships first
  - Falls back to first available lab if no specific assignment exists
- **Comprehensive Logging**: Detailed logs for monitoring and debugging

#### Manual Trigger
- **Endpoint**: `POST /course-groups/create-defaults`
- **Purpose**: Allow manual triggering for testing and immediate execution

### 5. Enhanced Course Management

#### Course Pagination with Rich Data
The course pagination endpoint now provides:
- **Course Code**: Combined subject code and course number (e.g., "CS258")
- **Course Name**: Full course name
- **Assigned Doctors**: List of doctor names assigned to the course
- **Course Type**: "Practical" or "Theory" based on `hasLab` field
- **Number of Students**: Total enrolled student count
- **Default Group Status**: Indicates if default group exists

#### Advanced Filtering
- Filter by course type (Practical/Theory)
- Filter by subject code
- Search by course name or code
- Sort by multiple fields

### 6. Performance Optimizations

#### TypeORM Index Decorators
Added strategic indexes using TypeORM decorators for automatic creation:

**Course Entity:**
```typescript
@Index('idx_courses_has_lab', ['hasLab'])
@Index('idx_courses_subject_code', ['subjectCode'])
@Index('idx_courses_subject_number', ['subjectCode', 'courseNumber'])
```

**CourseGroup Entity:**
```typescript
@Index('idx_course_groups_course_default', ['courseId', 'isDefault'])
@Index('idx_course_groups_is_default', ['isDefault'])
@Index('idx_course_groups_course_id', ['courseId'])
@Index('idx_course_groups_lab_id', ['labId'])
```

**StudentCourses Entity:**
```typescript
@Index('idx_student_courses_course_id', ['courseId'])
@Index('idx_student_courses_student_id', ['studentId'])
@Index('idx_student_courses_course_group_id', ['courseGroupId'])
@Index('idx_student_courses_course_student', ['courseId', 'studentId'])
```

**Lab Entity:**
```typescript
@Index('idx_labs_created_at', ['created_at'])
@Index('idx_labs_supervisor_id', ['supervisorId'])
```

**Benefits:**
- **Automatic Creation**: Indexes are created automatically when TypeORM synchronizes
- **Version Control**: Index definitions are part of the codebase
- **Consistent Deployment**: Same indexes across all environments
- **No Manual SQL Required**: Everything handled by TypeORM migrations

## API Endpoints

### Student Course Enrollment
```
POST /student-courses/enroll
Body: {
  "studentId": "uuid",
  "courseId": "uuid"
}

GET /student-courses?page=1&limit=10&courseId=uuid&studentId=uuid
```

### Course Group Management
```
POST /course-groups
Body: {
  "courseId": "uuid",
  "order": 1,
  "labId": "uuid",
  "isDefault": true
}

POST /course-groups/create-defaults  # Manual trigger for CRON job
GET /course-groups?courseId=uuid&labId=uuid
GET /course-groups/:id
PATCH /course-groups/:id
DELETE /course-groups/:id
```

### Enhanced Course Management
```
GET /courses/paginated?page=1&limit=10&courseType=Practical&search=CS
GET /courses/statistics  # Course statistics and counts
```

#### Sample Course Pagination Response
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Operating Systems",
      "courseCode": "CS258",
      "courseType": "Practical",
      "assignedDoctors": ["Dr. Salma Youssef"],
      "numberOfStudents": 45,
      "hasDefaultGroup": true,
      "creditHours": 3,
      "subjectCode": "CS",
      "courseNumber": 258,
      "hasLab": true,
      "labDuration": "3 hours",
      "attendanceMarks": 10
    }
  ],
  "total": 1
}
```

### Course Statistics
```json
{
  "totalCourses": 10,
  "practicalCourses": 7,
  "theoryCourses": 3,
  "coursesWithDefaultGroups": 6,
  "practicalCoursesWithoutDefaultGroups": 1,
  "totalStudents": 478
}
```

## Database Schema Changes

### New Table: `course_groups`
```sql
CREATE TABLE course_groups (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL,
  order INT NOT NULL,
  lab_id VARCHAR(36) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  capacity INT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE KEY unique_course_order (course_id, order),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (lab_id) REFERENCES labs(id)
);
```

### Modified Table: `student_course`
```sql
ALTER TABLE student_course 
ADD COLUMN course_group_id VARCHAR(36) NULL,
ADD FOREIGN KEY (course_group_id) REFERENCES course_groups(id) ON DELETE SET NULL;
```

**Note**: All indexes are automatically created by TypeORM when synchronizing the database schema.

## Usage Examples

### 1. Creating a Course Group
```typescript
// Create a default course group for a course
const courseGroup = await courseGroupService.create({
  courseId: "course-uuid",
  labId: "lab-uuid", 
  order: 1,
  isDefault: true
});
```

### 2. Enrolling a Student
```typescript
// Student will be automatically assigned to best available group
const enrollment = await studentCourseService.enrollStudent({
  studentId: "student-uuid",
  courseId: "course-uuid"
});
```

### 3. Getting Enhanced Course Data
```typescript
// Get courses with rich pagination data
const courses = await courseService.getPaginated({
  page: 1,
  limit: 10,
  courseType: 'Practical',
  search: 'Operating'
});
```

### 4. Manual Default Group Creation
```typescript
// Manually trigger default group creation
const result = await courseGroupCronService.manuallyCreateDefaultGroups();
// Returns: { created: 3, errors: [] }
```

## Key Benefits

1. **Automatic Assignment**: Students are automatically placed in appropriate groups
2. **Resource Optimization**: Capacity calculation ensures efficient lab utilization
3. **Software Compatibility**: Only assigns to groups where all required software is available
4. **Automated Management**: CRON job ensures default groups are always available
5. **Performance Optimized**: Strategic database indexes for fast queries
6. **Rich Data Presentation**: Course listing matches UI requirements exactly
7. **Comprehensive Monitoring**: Detailed logging and statistics
8. **Robust Error Handling**: Graceful handling of missing tables and initialization states

## Error Handling

The system includes comprehensive error handling:
- Validates student and course existence
- Prevents duplicate enrollments
- Handles cases where no groups are available
- Gracefully manages software compatibility issues
- CRON job includes race condition protection
- Individual course processing errors don't stop batch operations
- **Database Initialization Safety**: Handles missing tables during startup
- **Graceful Degradation**: System continues to function even if some tables don't exist yet

## Monitoring and Maintenance

### CRON Job Monitoring
- Detailed logging at INFO level for normal operations
- WARN level for missing resources or tables
- ERROR level for failures with full stack traces
- Manual trigger endpoint for testing and immediate execution
- **Initialization Safety**: Checks table existence before operations

### Performance Monitoring
- Database indexes ensure sub-second query performance via TypeORM decorators
- Statistics endpoint provides system health overview
- Capacity calculation optimized for large datasets
- **Automatic Index Management**: TypeORM handles index creation and synchronization

## Deployment Notes

### Database Schema Synchronization
- **Automatic**: When `synchronize: true` in TypeORM config, indexes are created automatically
- **Migrations**: For production, use TypeORM migrations to manage schema changes
- **No Manual SQL**: All database changes handled through TypeORM

### CRON Job Initialization
- **Safe Startup**: CRON job safely handles database initialization states
- **Table Checks**: Automatically detects missing tables and waits for creation
- **Progressive Enhancement**: Features become available as database schema is ready

## Future Enhancements

1. **Advanced Lab Assignment**: Consider time slots and resource conflicts
2. **Waitlist Management**: Queue students when all groups are full
3. **Group Rebalancing**: Automatically redistribute students when capacity changes
4. **Dashboard Integration**: Real-time monitoring of CRON job execution
5. **Notification System**: Alert administrators of system issues 