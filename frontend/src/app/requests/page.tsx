'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import { requestApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ProjectRequest, Project, UserRole } from '@/types';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import { FileText, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== UserRole.PROBLEM_SOLVER) {
      router.push('/dashboard');
      return;
    }

    const fetchRequests = async () => {
      try {
        const response = await requestApi.getMy();
        setRequests(response.data.data.requests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const acceptedRequests = requests.filter((r) => r.status === 'accepted');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-700" />;
    }
  };

  return (
    <DashboardLayout>
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-800 mt-1">Track your project work requests</p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">Accepted</p>
                  <p className="text-2xl font-bold text-green-600">{acceptedRequests.length}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{rejectedRequests.length}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Requests List */}
        <motion.div variants={item}>
          {requests.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-8 h-8 text-gray-600" />}
              title="No requests yet"
              description="When you request to work on projects, they will appear here"
              action={
                <Link href="/projects">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    Browse Projects
                  </motion.button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {requests.map((request) => {
                  const project = request.projectId as Project;
                  return (
                    <motion.div
                      key={request._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card hover>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                  request.status === 'accepted'
                                    ? 'bg-green-100'
                                    : request.status === 'rejected'
                                    ? 'bg-red-100'
                                    : 'bg-yellow-100'
                                }`}
                              >
                                {getStatusIcon(request.status)}
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {typeof project === 'object' ? project.title : 'Unknown Project'}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                      request.status
                                    )}`}
                                  >
                                    {formatStatus(request.status)}
                                  </span>
                                  <span className="text-xs text-gray-700">
                                    Requested {formatDate(request.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {request.status === 'accepted' && typeof project === 'object' && (
                              <Link href={`/projects/${project._id}`}>
                                <motion.button
                                  whileHover={{ x: 4 }}
                                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                  View Project
                                  <ArrowRight className="w-4 h-4" />
                                </motion.button>
                              </Link>
                            )}
                          </div>
                          {request.message && (
                            <p className="mt-3 text-sm text-gray-800 pl-16">{request.message}</p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
