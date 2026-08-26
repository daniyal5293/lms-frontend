export type Role = "Admin" | "Teacher" | "Student" | "HOD";

export type User = {
  Id: string;
  FullName: string;
  Email: string;
  Roles: Role[];
};

export type AuthResponse = {
  AccessToken: string;
  AccessTokenExpiresAt: string;
  User: User;
};

export type Teacher = {
  Id?: string;
  id?: string;
  teacher_id?: string;
  Fullname?: string;
  FullName?: string;
  fullname?: string;
  Email?: string;
  email?: string;
  Department?: string | null;
  department?: string | null;
  Salary?: number | string | null;
  salary?: number | string | null;
  CNIC?: string | null;
  cnic?: string | null;
  DateOfBirth?: string | null;
  dateOfBirth?: string | null;
  HireDate?: string | null;
  hireDate?: string | null;
  IdentificationNumber?: string | null;
  identificationNumber?: string | null;
  Qualification?: string | null;
  qualification?: string | null;
  Active?: boolean;
  IsActive?: boolean;
  isActive?: boolean;
  Address?: string | null;
  address?: string | null;
  Role?: string;
};

export type Course = {
  Id?: string;
  id?: string;
  courseId?: string;
  course_id?: string;
  Name: string;
  courseName?: string;
  Code: string;
  Credits: number;
  Description?: string | null;
  courseDescription?: string | null;
  courseDuration?: number;
};

export type Section = {
  Id?: string;
  id?: string;
  sectionId?: string;
  section_id?: string;
  Name?: string;
  sectionName?: string;
  CourseId?: string;
  Capacity?: number;
  IntermediateClass?: string;
  intermediateClass?: string;
  StartDate?: string;
  startDate?: string;
  IsActive?: boolean;
  isActive?: boolean;
  Course?: Course | null;
};

export type Student = {
  Id?: string;
  id?: string;
  StudentId?: string;
  studentId?: string;
  student_id?: string;
  FullName?: string;
  fullName?: string;
  Email?: string;
  email?: string;
  PhoneNumber?: string;
  phoneNumber?: string;
  DateOfBirth?: string;
  dateOfBirth?: string;
  EnrollmentDate?: string;
  enrollmentDate?: string;
  CNIC?: string;
  cnic?: string;
  SectionId?: string;
  sectionId?: string;
  EnrollmentId?: string;
  enrollmentId?: string;
  Section?: Section | null;
};

export type TeacherSectionCourse = {
  TeacherSectionCourseId?: string;
  teacherSectionCourseId?: string;
  TeacherId?: string;
  teacherId?: string;
  SectionId?: string;
  sectionId?: string;
  CourseId?: string;
  courseId?: string;
  AssignedDate?: string;
  assignedDate?: string;
  RemovedDate?: string | null;
  removedDate?: string | null;
  IsActive?: boolean;
  isActive?: boolean;
  Teacher?: { Teacher_Id?: string; teacher_Id?: string; Department?: string; UserId?: string; userId?: string } | null;
  teacher?: { teacher_Id?: string; Teacher_Id?: string; Department?: string; UserId?: string; userId?: string } | null;
  Section?: { SectionId?: string; SectionName?: string; sectionName?: string; IntermediateClass?: string } | null;
  section?: { sectionId?: string; SectionId?: string; sectionName?: string; SectionName?: string; intermediateClass?: string; IntermediateClass?: string } | null;
  Course?: { CourseId?: string; CourseName?: string; courseName?: string; CourseDescription?: string } | null;
  course?: { courseId?: string; CourseId?: string; courseName?: string; CourseName?: string; courseDescription?: string; CourseDescription?: string } | null;
};

export type AttendanceStatus = "Present" | "Absent" | "Late" | "Leave";

export type Attendance = {
  AttendanceId: string;
  StudentEnrollmentId: string;
  StudentId: string;
  StudentFullName?: string | null;
  TeacherSectionCourseId: string;
  SectionId: string;
  SectionName?: string | null;
  CourseId: string;
  CourseName?: string | null;
  AttendanceDate: string;
  Status: AttendanceStatus;
  Remarks?: string | null;
};

export type AttendanceSummary = {
  StudentId: string;
  StudentFullName?: string | null;
  TotalClasses: number;
  PresentCount: number;
  AbsentCount: number;
  LateCount: number;
  LeaveCount: number;
  AttendancePercentage: number;
};

export type ApiErrorData = {
  Message?: string;
  message?: string;
  title?: string;
  errors?: Record<string, string[] | string>;
};

export type RoleListResponse = Role[];
