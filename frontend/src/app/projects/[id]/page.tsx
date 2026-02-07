'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import { projectApi, requestApi, taskApi, submissionApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  UserRole,
  Project,
  ProjectRequest,
  Task,
  Submission,
  User,
  TaskStatus,
  SubmissionStatus,
} from '@/types';
import { formatDate, formatDateTime, formatStatus, getStatusColor, formatFileSize } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Plus,
  Upload,
  Download,
  FileText,
  Clock,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [submissions, setSubmissions] = useState<{ [taskId: string]: Submission[] }>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', deadline: '' });
  const [submitForm, setSubmitForm] = useState({ notes: '', file: null as File | null });
  const [reviewForm, setReviewForm] = useState({ status: '', reviewNotes: '' });

  const fetchProject = useCallback(async () => {
    try {
      const response = await projectApi.getById(id as string);
      setProject(response.data.data.project);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  }, [id]);

  const fetchRequests = useCallback(async () => {
    if (!project || !user) return;
    if (user.role === UserRole.BUYER || user.role === UserRole.ADMIN) {
      try {
        const response = await requestApi.getForProject(id as string);
        setRequests(response.data.data.requests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    }
  }, [id, project, user]);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await taskApi.getForProject(id as string);
      setTasks(response.data.data.tasks);

      // Fetch submissions for each task
      const subs: { [key: string]: Submission[] } = {};
      for (const task of response.data.data.tasks) {
        try {
          const subRes = await submissionApi.getForTask(task._id);
          subs[task._id] = subRes.data.data.submissions;
        } catch {
          subs[task._id] = [];
        }
      }
      setSubmissions(subs);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, [id]);

  useEffect(() => {
    const loadData = async () => {
      await fetchProject();
      setLoading(false);
    };
    loadData();
  }, [fetchProject]);

  useEffect(() => {
    if (project) {
      fetchRequests();
      fetchTasks();
    }
  }, [project, fetchRequests, fetchTasks]);

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await requestApi.accept(requestId);
      fetchProject();
      fetchRequests();
    } catch (error: any) {
      console.error('Error accepting request:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept request';
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(`reject-${requestId}`);
    try {
      await requestApi.reject(requestId);
      fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject request';
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create-task');
    try {
      await taskApi.create({
        projectId: id as string,
        title: taskForm.title,
        description: taskForm.description,
        deadline: taskForm.deadline || undefined,
      });
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', deadline: '' });
      fetchTasks();
      fetchProject();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setActionLoading(`delete-${taskId}`);
    try {
      await taskApi.delete(taskId);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !submitForm.file) return;

    setActionLoading('submit-work');
    try {
      const formData = new FormData();
      formData.append('taskId', selectedTask._id);
      formData.append('notes', submitForm.notes);
      formData.append('file', submitForm.file);

      await submissionApi.create(formData);
      setShowSubmitModal(false);
      setSubmitForm({ notes: '', file: null });
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error submitting work:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setActionLoading('review');
    try {
      await submissionApi.review(selectedSubmission._id, {
        status: reviewForm.status,
        reviewNotes: reviewForm.reviewNotes,
      });
      setShowReviewModal(false);
      setReviewForm({ status: '', reviewNotes: '' });
      setSelectedSubmission(null);
      fetchTasks();
      fetchProject();
    } catch (error) {
      console.error('Error reviewing submission:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openSubmitModal = (task: Task) => {
    setSelectedTask(task);
    setShowSubmitModal(true);
  };

  const openReviewModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <EmptyState title="Project not found" description="The project you're looking for doesn't exist." />
      </DashboardLayout>
    );
  }

  // Check if current user is the buyer of this project
  // Backend populates buyerId, so it comes as object with _id field
  // User object has id field (from auth)
  const extractId = (ref: User | string | any): string => {
    if (!ref) return '';
    if (typeof ref === 'string') return ref;
    return String(ref._id || ref.id || '');
  };

  const buyerId = extractId(project.buyerId);
  const solverId = project.assignedSolverId ? extractId(project.assignedSolverId) : null;
  const userId = String(user?.id || (user as any)?._id || '');

  // According to PDF: Only Buyer can accept/reject requests
  const isBuyer = user?.role === UserRole.BUYER && buyerId === userId;
  const isSolver = user?.role === UserRole.PROBLEM_SOLVER && solverId === userId;
  const isAdmin = user?.role === UserRole.ADMIN;

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/projects"
            className="inline-flex items-center text-sm text-gray-700 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Projects
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {formatStatus(project.status)}
                </span>
              </div>
              <p className="text-gray-800">{project.description}</p>
            </div>

            {isSolver && (project.status === 'assigned' || project.status === 'in_progress') && (
              <Button onClick={() => setShowTaskModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <UserIcon className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-700">Buyer</p>
                  <p className="font-medium">
                    {typeof project.buyerId === 'object' ? (project.buyerId as User).name : 'Unknown'}
                  </p>
                </div>
              </div>
              {project.assignedSolverId && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-700">Assigned To</p>
                    <p className="font-medium">
                      {typeof project.assignedSolverId === 'object'
                        ? (project.assignedSolverId as User).name
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {project.budget && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-700">Budget</p>
                    <p className="font-medium text-lg">{project.budget.toLocaleString()} TK</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {project.deadline && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-700">Deadline</p>
                    <p className="font-medium">{formatDate(project.deadline)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Requirements */}
        {project.requirements && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-lg font-semibold">Requirements</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800 whitespace-pre-wrap">{project.requirements}</p>
            </CardContent>
          </Card>
        )}

        {/* Pending Requests (Buyer only) */}
        {(isBuyer || isAdmin) && project.status === 'open' && pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Pending Requests</h2>
                  <Badge variant="warning">{pendingRequests.length} pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <AnimatePresence>
                    {pendingRequests.map((request) => (
                      <motion.div
                        key={request._id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {typeof request.solverId === 'object'
                                ? (request.solverId as User).name
                                : 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-700">
                              {typeof request.solverId === 'object'
                                ? (request.solverId as User).email
                                : ''}
                            </p>
                            {request.message && (
                              <p className="text-sm text-gray-800 mt-1">{request.message}</p>
                            )}
                          </div>
                        </div>
                        {isBuyer && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              loading={actionLoading === `reject-${request._id}`}
                              onClick={() => handleRejectRequest(request._id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              loading={actionLoading === request._id}
                              onClick={() => handleAcceptRequest(request._id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                          </div>
                        )}
                        {isAdmin && (
                          <div className="text-sm text-gray-700 italic">
                            Only buyer can accept/reject requests
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tasks Section */}
        {(project.status === 'assigned' || project.status === 'in_progress' || project.status === 'completed') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Tasks</h2>
                  <div className="text-sm text-gray-700">
                    {tasks.filter((t) => t.status === TaskStatus.COMPLETED).length} / {tasks.length} completed
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="w-8 h-8 text-gray-600" />}
                    title="No tasks yet"
                    description={
                      isSolver
                        ? 'Create tasks to break down the project work'
                        : 'The problem solver will add tasks here'
                    }
                  />
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {tasks.map((task, index) => (
                        <motion.div
                          key={task._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div className="p-4 bg-white">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    task.status === TaskStatus.COMPLETED
                                      ? 'bg-green-100'
                                      : task.status === TaskStatus.SUBMITTED
                                      ? 'bg-blue-100'
                                      : 'bg-gray-100'
                                  }`}
                                >
                                  {task.status === TaskStatus.COMPLETED ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <span className="text-sm font-medium text-gray-800">
                                      {index + 1}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                                  {task.description && (
                                    <p className="text-sm text-gray-700 mt-1">{task.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                        task.status
                                      )}`}
                                    >
                                      {formatStatus(task.status)}
                                    </span>
                                    {task.deadline && (
                                      <span className="text-xs text-gray-700 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(task.deadline)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isSolver && task.status !== TaskStatus.COMPLETED && (
                                  <>
                                    {task.status !== TaskStatus.SUBMITTED && (
                                      <Button
                                        size="sm"
                                        variant={task.status === TaskStatus.REVISION_REQUESTED ? 'primary' : 'outline'}
                                        onClick={() => openSubmitModal(task)}
                                      >
                                        <Upload className="w-4 h-4 mr-1" />
                                        {task.status === TaskStatus.REVISION_REQUESTED ? 'Resubmit' : 'Submit'}
                                      </Button>
                                    )}
                                    {task.status === TaskStatus.TODO && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        loading={actionLoading === `delete-${task._id}`}
                                        onClick={() => handleDeleteTask(task._id)}
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Submissions */}
                          {submissions[task._id] && submissions[task._id].length > 0 && (
                            <div className="border-t border-gray-200 bg-gray-50 p-4">
                              <p className="text-sm font-medium text-gray-700 mb-3">Submissions</p>
                              <div className="space-y-2">
                                {submissions[task._id].map((sub) => (
                                  <div
                                    key={sub._id}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                                  >
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-5 h-5 text-gray-600" />
                                      <div>
                                        <p className="text-sm font-medium">{sub.fileName}</p>
                                        <p className="text-xs text-gray-700">
                                          {formatFileSize(sub.fileSize)} • {formatDateTime(sub.createdAt)}
                                        </p>
                                        {sub.reviewNotes && sub.status === SubmissionStatus.REJECTED && (
                                          <p className="text-xs text-red-600 mt-1">
                                            Feedback: {sub.reviewNotes}
                                          </p>
                                        )}
                                        {sub.reviewNotes && sub.status === SubmissionStatus.APPROVED && (
                                          <p className="text-xs text-green-600 mt-1">
                                            Note: {sub.reviewNotes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                          sub.status
                                        )}`}
                                      >
                                        {formatStatus(sub.status)}
                                      </span>
                                      <button
                                        onClick={async () => {
                                          try {
                                            await submissionApi.download(sub._id, sub.fileName);
                                          } catch (error) {
                                            console.error('Download failed:', error);
                                          }
                                        }}
                                        className="p-1.5 rounded hover:bg-gray-100"
                                        title="Download file"
                                      >
                                        <Download className="w-4 h-4 text-gray-700" />
                                      </button>
                                      {(isBuyer || isAdmin) && sub.status === SubmissionStatus.PENDING && (
                                        <Button size="sm" onClick={() => openReviewModal(sub)}>
                                          Review
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      {/* Create Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Create Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            id="task-title"
            label="Task Title"
            placeholder="Enter task title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            required
          />
          <Textarea
            id="task-description"
            label="Description"
            placeholder="Describe the task..."
            rows={3}
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
          />
          <Input
            id="task-deadline"
            type="date"
            label="Deadline (Optional)"
            value={taskForm.deadline}
            onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowTaskModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading === 'create-task'}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Submit Work Modal */}
      <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Work">
        <form onSubmit={handleSubmitWork} className="space-y-4">
          <p className="text-sm text-gray-800">
            Submitting for: <strong>{selectedTask?.title}</strong>
          </p>
          <Textarea
            id="submit-notes"
            label="Notes"
            placeholder="Add any notes about your submission..."
            rows={3}
            value={submitForm.notes}
            onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".zip"
              onChange={(e) =>
                setSubmitForm({ ...submitForm, file: e.target.files?.[0] || null })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <p className="text-xs text-gray-700 mt-1">Only ZIP files are allowed (max 50MB)</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowSubmitModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading === 'submit-work'}>
              <Upload className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Submission Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Review Submission">
        <form onSubmit={handleReviewSubmission} className="space-y-4">
          <p className="text-sm text-gray-800">
            Reviewing: <strong>{selectedSubmission?.fileName}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="approved"
                  checked={reviewForm.status === 'approved'}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                  className="text-indigo-600"
                />
                <span className="text-green-600 font-medium">Approve</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="rejected"
                  checked={reviewForm.status === 'rejected'}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                  className="text-indigo-600"
                />
                <span className="text-red-600 font-medium">Request Revision</span>
              </label>
            </div>
          </div>
          <Textarea
            id="review-notes"
            label="Feedback (Optional)"
            placeholder="Provide feedback for the solver..."
            rows={3}
            value={reviewForm.reviewNotes}
            onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={actionLoading === 'review'}
              disabled={!reviewForm.status}
              variant={reviewForm.status === 'rejected' ? 'danger' : 'primary'}
            >
              {reviewForm.status === 'approved' ? 'Approve' : 'Request Revision'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
