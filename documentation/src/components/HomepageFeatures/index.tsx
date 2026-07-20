import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">SoulState</h1>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            A DAG-powered, graph-based state management library for React and vanilla JS.
          </p>
        </div>

        <div className="row">
          <Feature
            title="Surgical Reactivity"
            description={
              <>DAG-based invalidation with microtask batching, linked-list subscribers, and bitmask dispatch.
              Only affected subscribers are notified.</>
            }
          />

          <Feature
            title="React-First Design"
            description={
              <>Built to work perfectly with React 18 concurrent rendering, transitions, and Suspense.
              Powered by a stable subscription engine.</>
            }
          />

          <Feature
            title="Powerfully Simple API"
            description={
              <>Inspired by Zustand — but cleaner, sharper, and faster.
              A tiny API that scales from small apps to large architectures.</>
            }
          />
        </div>
      </div>
    </section>
  );
}

function Feature({ title, description }: { title: string; description: JSX.Element }) {
  return (
    <div className={clsx('col col--4', styles.featureItem)}>
      <div className="text-center p-6 rounded-xl bg-gray-800/40 border border-gray-700 backdrop-blur-sm shadow-md">
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="opacity-80 text-base leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
