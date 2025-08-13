'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex gap-2">
        <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
          Login
        </Link>
        <Link href="/signup" className="text-sm text-gray-600 hover:text-gray-900">
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        {session?.user?.name} ({session?.user?.role})
      </span>
      <button
        onClick={() => signOut()}
        className="text-sm text-red-600 hover:text-red-800"
      >
        Logout
      </button>
    </div>
  );
}
