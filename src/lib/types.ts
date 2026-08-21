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
  Fullname?: string;
  FullName?: string;
  Email?: string;
  Department?: string | null;
  Salary?: number | string | null;
  CNIC?: string | null;
  DateOfBirth?: string | null;
  HireDate?: string | null;
  IdentificationNumber?: string | null;
  Qualification?: string | null;
  Active?: boolean;
  IsActive?: boolean;
  Address?: string | null;
  Role?: string;
};

export type Course = {
  Id?: string;
  id?: string;
  Name: string;
  Code: string;
  Credits: number;
  Description?: string | null;
};

export type Section = {
  Id?: string;
  id?: string;
  Name: string;
  CourseId: string;
  Capacity: number;
  Course?: Course | null;
};

export type ApiErrorData = {
  Message?: string;
  message?: string;
  title?: string;
  errors?: Record<string, string[] | string>;
};

export type RoleListResponse = Role[];
