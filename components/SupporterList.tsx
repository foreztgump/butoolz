'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from 'lucide-react';

const SupporterList: React.FC = () => {
  const [supporters, setSupporters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupporters = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/supporters');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch supporters');
        }
        const data: { names: string[] } = await response.json();
        setSupporters(data.names || []); // Ensure it's always an array
      } catch (err: any) {
        console.error('Error fetching supporters:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupporters();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <Card className="border-dashed bg-zinc-900/30 h-full">
      <CardContent className="pt-4 flex flex-col justify-center h-full">
        <div className="text-center space-y-3">
          <h2 className="text-lg font-medium flex items-center justify-center text-zinc-200">
            <Users className="h-5 w-5 mr-2 text-fuchsia-400" />
            Our Supporters
          </h2>
          {isLoading && (
            <p className="text-sm text-zinc-400">Loading supporters...</p>
          )}
          {error && (
            <p className="text-sm text-red-400">Error: {error}</p>
          )}
          {!isLoading && !error && supporters.length === 0 && (
            <p className="text-sm text-zinc-400">Be the first to support!</p>
          )}
          {!isLoading && !error && supporters.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {supporters.map((name, index) => (
                <span key={index} className="bg-indigo-900/60 text-indigo-300 text-xs font-medium px-2 py-0.5 rounded-full">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupporterList; 