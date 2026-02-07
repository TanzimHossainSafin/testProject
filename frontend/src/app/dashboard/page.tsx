'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import { projectApi, userApi, requestApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { UserRole, Project, ProjectRequest, User } from '@/types';
import { formatStatus, getStatusColor } from '@/lib/utils';
import {
  FolderKanban,
  Users,
  FileCheck,
  Clock,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  projects: number;
  users?: number;
  pendingRequests: number;
  completedProjects: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [myRequests, setMyRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [projectsRes] = await Promise.all([
          projectApi.getAll(),
        ]);

        const projects = projectsRes.data.data.projects;
        setRecentProjects(projects.slice(0, 5));

        let usersCount = 0;
        let pendingRequests = 0;

        if (user.role === UserRole.ADMIN) {
          const usersRes = await userApi.getAll();
          usersCount = usersRes.data.data.users.length;
        }

        if (user.role === UserRole.PROBLEM_SOLVER) {
          const requestsRes = await requestApi.getMy();
          setMyRequests(requestsRes.data.data.requests);
          pendingRequests = requestsRes.data.data.requests.filter(
            (r: ProjectRequest) => r.status === 'pending'
          ).length;
        }

        if (user.role === UserRole.BUYER) {
          // Count pending requests for buyer's projects
          let totalPending = 0;
          for (const project of projects) {
            if (project.status === 'open') {
              try {
                const reqRes = await requestApi.getForProject(project._id);
                totalPending += reqRes.data.data.requests.filter(
                  (r: ProjectRequest) => r.status === 'pending'
                ).length;
              } catch {
                // Skip if error
              }
            }
          }
          pendingRequests = totalPending;
        }

        setStats({
          projects: projects.length,
          users: usersCount,
          pendingRequests,
          completedProjects: projects.filter((p: Project) => p.status === 'completed').length,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <DashboardLayout>
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-gray-800 mt-1">
            Here&apos;s what&apos;s happening with your projects
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">Total Projects</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.projects || 0}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {user?.role === UserRole.ADMIN && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.users || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {user?.role === UserRole.PROBLEM_SOLVER ? 'My Pending' : 'Pending Requests'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.pendingRequests || 0}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.completedProjects || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Projects */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
                <Link
                  href="/projects"
                  className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <p className="text-gray-700 text-center py-8">No projects yet</p>
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <Link
                      key={project._id}
                      href={`/projects/${project._id}`}
                      className="block"
                    >
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{project.title}</p>
                            <p className="text-sm text-gray-700">
                              {typeof project.buyerId === 'object' ? (project.buyerId as User).name : 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {formatStatus(project.status)}
                        </span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* My Requests (Problem Solver only) */}
        {user?.role === UserRole.PROBLEM_SOLVER && myRequests.length > 0 && (
          <motion.div variants={item} className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">My Requests</h2>
                  <Link
                    href="/requests"
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myRequests.slice(0, 3).map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <p className="font-medium text-gray-900">
                        {typeof request.projectId === 'object'
                          ? (request.projectId as Project).title
                          : 'Project'}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {formatStatus(request.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
