import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './dashboard/Navbar';
import { LocationPrompt } from './LocationPrompt';
import { api } from '../lib/axios';

interface UserProfile {
  email: string | null;
  avatar: string | null;
  name: string | null;
}

export const Layout: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({ email: null, avatar: null, name: null });

  const extractProfile = (user: any): UserProfile => ({
    email: user?.email || null,
    avatar:
      user?.user_metadata?.avatar_url ||
      user?.user_metadata?.picture ||
      null,
    name:
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      null,
  });

  useEffect(() => {
    api.get('/api/me').then(({ data }) => {
      if (data?.user) setProfile(extractProfile(data.user));
    }).catch(err => {
      console.error("Failed to fetch user profile", err);
    });
  }, []);

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: '100dvh', backgroundColor: '#121212', color: '#EDEDED' }}
    >
      <LocationPrompt />
      <Navbar userEmail={profile.email} userAvatar={profile.avatar} userName={profile.name} />
      <Outlet />
    </div>
  );
};
