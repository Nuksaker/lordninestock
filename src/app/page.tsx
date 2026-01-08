import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { initializeData } from '@/lib/repo/seed';

export default async function Home() {
  // Initialize seed data if needed
  try {
    await initializeData();
  } catch (error) {
    console.error('Error initializing data:', error);
  }
  
  // Check if user is logged in
  const session = await getSession();
  
  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
