export type Role = "Admin" | "Teacher" | "Student" | "HOD";

export type User = {
  Id: string;
  FullName: string;
  Email: string;
  Roles: Role[];
};

export function normalizeRole(value: unknown): Role | null {
  const role = String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
  if (role === "admin" || role === "administrator") return "Admin";
  if (role === "teacher") return "Teacher";
  if (role === "student") return "Student";
  if (role === "hod" || role === "head of department" || role === "head department") return "HOD";
  return null;
}

export function normalizeUser(value: unknown): User | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const rawRoles = raw.Roles ?? raw.roles ?? raw.Role ?? raw.role ?? raw.UserRole ?? raw.userRole;
  const roles = (Array.isArray(rawRoles) ? rawRoles : [rawRoles]).map(normalizeRole).filter((role): role is Role => role !== null);

  return {
    Id: String(raw.Id ?? raw.id ?? ""),
    FullName: String(raw.FullName ?? raw.fullName ?? ""),
    Email: String(raw.Email ?? raw.email ?? ""),
    Roles: [...new Set(roles)],
  };
}

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
  role?: string;
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
  SectionId?: string;
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

export type FeeCategory = {
  categoryId?: string;
  CategoryId?: string;
  categoryName?: string;
  CategoryName?: string;
};

export type FeeType = {
  FeeTypeId?: string;
  feeTypeId?: string;
  FeeCategoryId?: string;
  feeCategoryId?: string;
  Name?: string;
  name?: string;
  Amount?: number;
  amount?: number;
  Per?: string;
  per?: string;
  AcademicTerm?: string;
  academicTerm?: string;
  Academic_Term?: string;
  academic_term?: string;
  Currency?: string;
  currency?: string;
  ApplicableDate?: string;
  applicableDate?: string;
  status?: number;
  Status?: number;
  IsActive?: boolean;
  isActive?: boolean;
};

export type ApplicableFee = {
  AfId?: string;
  afId?: string;
  StudentId?: string;
  studentId?: string;
  FeeTypeId?: string;
  feeTypeId?: string;
  feeType?: FeeType | null;
  FeeType?: FeeType | null;
  StudentName?: string;
  studentName?: string;
  FeeTypeName?: string;
  feeTypeName?: string;
  Amount?: number;
  amount?: number;
  AcademicTerm?: string;
  academicTerm?: string;
  Academic_Term?: string;
  academic_term?: string;
  Status?: string | number;
  status?: string | number;
  CreatedAt?: string;
  createdAt?: string;
};

export type Invoice = {
  id?: string;
  Id?: string;
  invoiceNum?: string;
  InvoiceNum?: string;
  studentId?: string;
  StudentId?: string;
  studentName?: string;
  StudentName?: string;
  feeTypeId?: string;
  FeeTypeId?: string;
  feeTypeName?: string;
  FeeTypeName?: string;
  amount?: number;
  Amount?: number;
  amountPaid?: number;
  AmountPaid?: number;
  amountDue?: number;
  AmountDue?: number;
  ispaid?: boolean;
  IsPaid?: boolean;
  month?: string;
  Month?: string;
  year?: string;
  Year?: string;
  currency?: string;
  Currency?: string;
  dueDate?: string;
  DueDate?: string;
  createdAt?: string;
  CreatedAt?: string;
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
  StudentEnrollmentId?: string;
  studentEnrollmentId?: string;
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
  Section?: { SectionId?: string; SectionID?: string; Id?: string; SectionName?: string; Name?: string; name?: string; sectionName?: string; IntermediateClass?: string } | null;
  section?: { sectionId?: string; SectionId?: string; SectionID?: string; Id?: string; sectionName?: string; SectionName?: string; Name?: string; name?: string; intermediateClass?: string; IntermediateClass?: string } | null;
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

export type StudentAttendanceCourse = {
  TeacherSectionCourseId: string;
  CourseId: string;
  CourseName?: string | null;
  TeacherId: string;
  SectionId: string;
  SectionName?: string | null;
};

export type ApiErrorData = {
  Message?: string;
  message?: string;
  title?: string;
  errors?: Record<string, string[] | string>;
};

export type RoleListResponse = Role[];
