'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function Header() {
  const router = useRouter();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleDashboardClick = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/sign-in');
    }
  };

  return (
    <div className="p-5 flex justify-between items-center border shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex flex-row items-center">
        <Image src={"/piecharts.png"} alt="logo" width={40} height={25} />
        <span className="font-bold text-xl ml-2 text-gray-800 dark:text-white">Spent</span>
      </div>

      <div className="flex gap-3 items-center">
        <Button
          onClick={handleDashboardClick}
          variant="outline"
          className="rounded-full border-gray-300 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
          disabled={!isAuthReady}
        >
          Dashboard
        </Button>

        {isAuthReady && isLoggedIn ? (
          <div
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white"
            title="You are logged in"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.121 17.804A8 8 0 1117.805 5.12M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        ) : (
          <Link href={"/sign-in"}>
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white">
              Get Started
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default Header;
