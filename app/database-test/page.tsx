'use client';

import { useState, useEffect } from 'react';

export default function DatabaseTest() {
  const [data, setData] = useState<{ users: any[]; posts: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/database');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data from database');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!data) {
    return <div className="p-4">No data available</div>;
  }

  const { users, posts } = data;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <ul className="list-disc pl-5">
          {users.map((user) => (
            <li key={user.id}>
              {user.name} ({user.email}) - Created at: {user.created_at}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Posts</h2>
        {posts.length === 0 ? (
          <p>No posts found.</p>
        ) : (
          <ul className="list-disc pl-5">
            {posts.map((post) => (
              <li key={post.id}>
                <strong>{post.title}</strong> by {post.author_name || 'Unknown'}<br />
                {post.content}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}