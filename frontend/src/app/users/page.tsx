'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import { userApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { User, UserRole } from '@/types';
import { formatRole, getRoleBadgeColor, formatDate } from '@/lib/utils';
import { Users, User as UserIcon, Shield, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      router.push('/dashboard');
      return;
    }

    const fetchUsers = async () => {
      try {
        setError(null);
        const response = await userApi.getAll();
        // Ensure all users have id field (transform _id to id if needed)
        const transformedUsers = response.data.data.users.map((user: any) => ({
          ...user,
          id: user.id || user._id,
        }));
        setUsers(transformedUsers);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch users';
        setError(errorMessage);
        if (error.response?.status === 403) {
          setError('You do not have permission to view users. Admin access required.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, router]);

  const handleEditRole = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setNewRole(userToEdit.role);
    setShowEditModal(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || newRole === selectedUser.role) return;

    setUpdating(true);
    setError(null);
    try {
      const userId = selectedUser.id || (selectedUser as any)._id;
      await userApi.updateRole(userId, newRole);
      setUsers(
        users.map((u) => {
          const uId = u.id || (u as any)._id;
          return uId === userId ? { ...u, role: newRole as UserRole, id: uId } : u;
        })
      );
      setShowEditModal(false);
    } catch (error: any) {
      console.error('Error updating role:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update user role';
      setError(errorMessage);
      if (error.response?.status === 403) {
        setError('You do not have permission to update user roles. Admin access required.');
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  const roleOptions = [
    { value: UserRole.PROBLEM_SOLVER, label: 'Problem Solver' },
    { value: UserRole.BUYER, label: 'Buyer' },
  ];

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
        <motion.div variants={item} className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
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
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Buyers</p>
                  <p className="text-2xl font-bold">
                    {users.filter((u) => u.role === UserRole.BUYER).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Problem Solvers</p>
                  <p className="text-2xl font-bold">
                    {users.filter((u) => u.role === UserRole.PROBLEM_SOLVER).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Users List */}
        <motion.div variants={item}>
          {users.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-gray-400" />}
              title="No users yet"
              description="Users will appear here when they register"
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <AnimatePresence>
                        {users.map((userItem) => (
                          <motion.tr
                            key={userItem.id || (userItem as any)._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <UserIcon className="w-4 h-4 text-gray-500" />
                                </div>
                                <span className="font-medium text-gray-900">{userItem.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {userItem.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                  userItem.role
                                )}`}
                              >
                                {formatRole(userItem.role)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {userItem.createdAt ? formatDate(userItem.createdAt) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {userItem.role !== UserRole.ADMIN && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditRole(userItem)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>

      {/* Edit Role Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Change User Role">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-medium">{selectedUser?.name}</p>
              <p className="text-sm text-gray-500">{selectedUser?.email}</p>
            </div>
          </div>

          <Select
            id="role"
            label="New Role"
            options={roleOptions}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              loading={updating}
              disabled={newRole === selectedUser?.role}
            >
              Update Role
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
