'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import { userApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserRole } from '@/types';
import { formatRole, getRoleBadgeColor } from '@/lib/utils';
import { User, Mail, Briefcase, Link as LinkIcon, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    skills: '',
    experience: '',
    portfolio: '',
  });

  useEffect(() => {
    if (user?.role !== UserRole.PROBLEM_SOLVER) {
      router.push('/dashboard');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.profile?.bio || '',
        skills: user.profile?.skills?.join(', ') || '',
        experience: user.profile?.experience || '',
        portfolio: user.profile?.portfolio || '',
      });
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await userApi.updateProfile({
        name: formData.name,
        profile: {
          bio: formData.bio,
          skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
          experience: formData.experience,
          portfolio: formData.portfolio,
        },
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

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
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl mx-auto">
        <motion.div variants={item} className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-800 mt-1">Manage your profile information</p>
        </motion.div>

        {/* Profile Header */}
        <motion.div variants={item}>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                  <div className="flex items-center gap-2 text-gray-700 mt-1">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(
                      user?.role || ''
                    )}`}
                  >
                    {formatRole(user?.role || '')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Form */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Edit Profile</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600"
                  >
                    Profile updated successfully!
                  </motion.div>
                )}

                <Input
                  id="name"
                  label="Full Name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <Textarea
                  id="bio"
                  label="Bio"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />

                <div>
                  <Input
                    id="skills"
                    label="Skills"
                    placeholder="e.g., JavaScript, React, Node.js"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  />
                  <p className="text-xs text-gray-700 mt-1">Separate skills with commas</p>
                </div>

                <Textarea
                  id="experience"
                  label="Experience"
                  placeholder="Describe your relevant experience..."
                  rows={3}
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                />

                <Input
                  id="portfolio"
                  label="Portfolio URL"
                  type="url"
                  placeholder="https://your-portfolio.com"
                  value={formData.portfolio}
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" loading={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Preview */}
        {(formData.bio || formData.skills || formData.experience || formData.portfolio) && (
          <motion.div variants={item} className="mt-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Profile Preview</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.bio && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">About</h4>
                      <p className="text-gray-900">{formData.bio}</p>
                    </div>
                  )}

                  {formData.skills && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.split(',').map((skill, index) => (
                          skill.trim() && (
                            <span
                              key={index}
                              className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                            >
                              {skill.trim()}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.experience && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        Experience
                      </h4>
                      <p className="text-gray-900">{formData.experience}</p>
                    </div>
                  )}

                  {formData.portfolio && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <LinkIcon className="w-4 h-4" />
                        Portfolio
                      </h4>
                      <a
                        href={formData.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        {formData.portfolio}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
