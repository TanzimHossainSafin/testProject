export enum UserRole {
  ADMIN = 'admin',
  BUYER = 'buyer',
  PROBLEM_SOLVER = 'problem_solver',
}

export enum ProjectStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  REVISION_REQUESTED = 'revision_requested',
  COMPLETED = 'completed',
}

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface UserProfile {
  bio?: string;
  skills?: string[];
  experience?: string;
  portfolio?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profile: UserProfile;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  requirements?: string;
  budget?: number;
  deadline?: string;
  buyerId: User | string;
  assignedSolverId?: User | string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRequest {
  _id: string;
  projectId: Project | string;
  solverId: User | string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  projectId: string;
  title: string;
  description: string;
  deadline?: string;
  status: TaskStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  _id: string;
  taskId: string;
  solverId: User | string;
  filePath: string;
  fileName: string;
  fileSize: number;
  notes: string;
  status: SubmissionStatus;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
