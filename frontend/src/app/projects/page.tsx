'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import { projectApi, requestApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { UserRole, Project, User, ProjectStatus, ProjectRequest } from '@/types';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import {
  Plus,
  FolderKanban,
  Calendar,
  DollarSign,
  User as UserIcon,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<ProjectRequest[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    budget: '',
    deadline: '',
  });

  const fetchProjects = async () => {
    try {
      const response = await projectApi.getAll();
      setProjects(response.data.data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    if (user?.role === UserRole.PROBLEM_SOLVER) {
      try {
        const response = await requestApi.getMy();
        setMyRequests(response.data.data.requests);
      } catch (error) {
        console.error('Error fetching my requests:', error);
      }
    }
  };

  useEffect(() => {
    fetchProjects();
    if (user?.role === UserRole.PROBLEM_SOLVER) {
      fetchMyRequests();
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await projectApi.create({
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        deadline: formData.deadline || undefined,
      });
      setShowCreateModal(false);
      setFormData({ title: '', description: '', requirements: '', budget: '', deadline: '' });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRequestToWork = async (projectId: string) => {
    setRequestingId(projectId);
    setError(null);
    setSuccess(null);
    try {
      await requestApi.create({ projectId, message: 'I would like to work on this project.' });
      setSuccess('Request submitted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      fetchProjects();
      fetchMyRequests(); // Refresh requests to update UI
    } catch (error: any) {
      console.error('Error requesting to work:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit request';
      setError(errorMessage);
      if (error.response?.status === 400 && errorMessage.includes('already requested')) {
        setError('You have already requested to work on this project');
        fetchMyRequests(); // Refresh to show updated state
      } else if (error.response?.status === 403) {
        setError('You do not have permission to request on this project');
      }
    } finally {
      setRequestingId(null);
    }
  };

  // Check if user has already requested for a project
  const hasRequested = (projectId: string): boolean => {
    return myRequests.some(
      (req) =>
        (typeof req.projectId === 'string' ? req.projectId : req.projectId._id) === projectId
    );
  };

  // Get request status for a project
  const getRequestStatus = (projectId: string): string | null => {
    const request = myRequests.find(
      (req) =>
        (typeof req.projectId === 'string' ? req.projectId : req.projectId._id) === projectId
    );
    return request ? request.status : null;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <DashboardLayout>
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">
              {user?.role === UserRole.BUYER
                ? 'Manage your projects'
                : user?.role === UserRole.PROBLEM_SOLVER
                ? 'Browse and request to work on projects'
                : 'View all projects'}
            </p>
          </div>
          {user?.role === UserRole.BUYER && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          )}
        </motion.div>

        {error && (
          <motion.div
            variants={item}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 font-bold"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            variants={item}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-800">{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-600 hover:text-green-800 font-bold"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="w-8 h-8 text-gray-400" />}
            title="No projects yet"
            description={
              user?.role === UserRole.BUYER
                ? 'Create your first project to get started'
                : 'No projects available at the moment'
            }
            action={
              user?.role === UserRole.BUYER ? (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              ) : undefined
            }
          />
        ) : (
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {projects.map((project) => (
                <motion.div
                  key={project._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card hover className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <FolderKanban className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {formatStatus(project.status)}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <UserIcon className="w-4 h-4" />
                          <span>
                            {typeof project.buyerId === 'object'
                              ? (project.buyerId as User).name
                              : 'Unknown'}
                          </span>
                        </div>
                        {project.deadline && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(project.deadline)}</span>
                          </div>
                        )}
                        {project.budget && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <DollarSign className="w-4 h-4" />
                            <span>${project.budget.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        <Link href={`/projects/${project._id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                        {user?.role === UserRole.PROBLEM_SOLVER &&
                          project.status === ProjectStatus.OPEN && (
                            <>
                              {hasRequested(project._id) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  className="cursor-not-allowed"
                                >
                                  {getRequestStatus(project._id) === 'pending'
                                    ? 'Pending'
                                    : getRequestStatus(project._id) === 'accepted'
                                    ? 'Accepted'
                                    : 'Rejected'}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  loading={requestingId === project._id}
                                  onClick={() => handleRequestToWork(project._id)}
                                >
                                  Request
                                </Button>
                              )}
                            </>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="title"
            label="Project Title"
            placeholder="Enter project title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Textarea
            id="description"
            label="Description"
            placeholder="Describe your project..."
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <Textarea
            id="requirements"
            label="Requirements (Optional)"
            placeholder="List specific requirements..."
            rows={3}
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="budget"
              type="number"
              label="Budget (Optional)"
              placeholder="e.g., 5000"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
            <Input
              id="deadline"
              type="date"
              label="Deadline (Optional)"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
