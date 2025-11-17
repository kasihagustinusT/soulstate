import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <h1 className="text-5xl font-bold">SoulState</h1>
      <p className="mt-4 text-xl text-gray-600">The Zero-Overhead State of Mind.</p>
      <div className="mt-8">
        <Link href="/getting-started" className="px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700">
          Get Started
        </Link>
      </div>
      {/* Add more marketing content here */}
    </div>
  );
}
