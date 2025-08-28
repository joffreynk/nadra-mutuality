import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Dashboard from '@/components/ui/Dashboard';

export default async function HomePage() {
  const session = await auth();
  
  // If no session, check if any users exist
  if (!session) {
    // Avoid Prisma init error when DATABASE_URL is missing
    if (!process.env.DATABASE_URL) {
      redirect('/signup');
    }
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      // No users exist, redirect to signup
      redirect('/signup');
    } else {
      // Users exist but not logged in, redirect to login
      redirect('/login');
    }
  }

  // User is authenticated, show dashboard with session data
  return <Dashboard session={session} />;
}


