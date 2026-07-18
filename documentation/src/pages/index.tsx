import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';

export default function Home(): JSX.Element {
  return (
    <Layout
      title="SoulState - The Zero-Overhead State of Mind"
      description="DAG-powered, high-performance state management for React and vanilla JS"
    >
      <main>
        {/* Hero Section */}
        <section className="hero">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="hero__title">SoulState</h1>
            <p className="hero__subtitle">
              The Zero-Overhead State of Mind
            </p>
            <p style={{
              fontSize: '1.1rem',
              margin: '0 auto 3rem',
              opacity: 0.8,
              lineHeight: '1.6',
              maxWidth: '620px',
            }}>
              DAG-powered state management with surgical reactivity, computed state, and transactions.
              Built for extreme performance at scale with zero overhead.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <Link className="button button--primary button--lg" to="/docs/introduction">
                Get Started
              </Link>
              <Link className="button button--secondary button--lg" to="/docs/api/core-store">
                API Reference
              </Link>
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section style={{ margin: '4rem 0', textAlign: 'center' }}>
          <h2 style={{
            marginBottom: '3rem',
            fontWeight: 300,
            fontSize: '2.5rem',
            color: 'var(--ifm-color-emphasis-900)',
          }}>
            Built for Performance
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
          }}>
            {[
              { value: '914x', label: 'Faster irrelevant update elimination' },
              { value: '100K+', label: 'Subscribers at O(M) complexity' },
              { value: '< 1KB', label: 'Zero runtime dependencies' },
              { value: 'O(1)', label: 'Unsubscribe via linked list' },
              { value: 'O(1)', label: 'Bitmask dispatch (≤8 keys)' },
              { value: '0', label: 'Memory allocations in set' },
            ].map((metric, idx) => (
              <div key={idx} className="performance-metric">
                <div className="metric-value">{metric.value}</div>
                <div className="metric-label">{metric.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture Highlight */}
        <section style={{
          margin: '4rem 0',
          textAlign: 'center',
          padding: '3rem 1rem',
          background: 'var(--surface-light)',
          borderRadius: '16px',
        }}>
          <h2 style={{
            marginBottom: '2rem',
            fontWeight: 300,
            fontSize: '2.5rem',
            color: 'var(--ifm-color-emphasis-900)',
          }}>
            DAG-Powered Reactivity
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
            gap: '2rem',
            maxWidth: '1000px',
            margin: '0 auto',
          }}>
            {[
              {
                title: 'Surgical Invalidation',
                desc: 'Reverse-dependency graph traces only affected subscribers. Changing 1 key in a 1,000-key store touches nothing else.',
              },
              {
                title: 'Computed State',
                desc: 'Memoized, dependency-aware computed nodes with deep propagation. Stale values recompute topologically — no glitches.',
              },
              {
                title: 'Transactions',
                desc: 'Batch multiple mutations into a single atomic propagation cycle. Rollback support for failed operations.',
              },
            ].map((item, idx) => (
              <div key={idx} className="card" style={{
                padding: '2rem',
                textAlign: 'left',
              }}>
                <h4 style={{
                  marginBottom: '1rem',
                  color: 'var(--brand-primary)',
                  fontWeight: 600,
                  fontSize: '1.15rem',
                }}>
                  {item.title}
                </h4>
                <p style={{
                  color: 'var(--ifm-color-emphasis-700)',
                  margin: 0,
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Start */}
        <section style={{ margin: '4rem 0' }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: '3rem',
            fontWeight: 300,
            fontSize: '2.5rem',
            color: 'var(--ifm-color-emphasis-900)',
          }}>
            Get Started in 60 Seconds
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))',
            gap: '2rem',
            alignItems: 'start',
          }}>
            <div className="card">
              <h4 style={{ marginBottom: '1rem', fontWeight: 500, color: 'var(--ifm-color-emphasis-900)' }}>
                1. Install
              </h4>
              <CodeBlock language="bash">
                {`npm install soulstate`}
              </CodeBlock>

              <h4 style={{ marginBottom: '1rem', marginTop: '2rem', fontWeight: 500, color: 'var(--ifm-color-emphasis-900)' }}>
                2. Create Store with Computed State
              </h4>
              <CodeBlock language="javascript">
{`import { createStore } from 'soulstate';

export const useCounterStore = createStore({
  count: 0,
  increment: () => useCounterStore.set(s => ({ count: s.count + 1 })),
  get doubled() {
    return useCounterStore.get('count') * 2;
  }
});`}
              </CodeBlock>
            </div>

            <div className="card">
              <h4 style={{ marginBottom: '1rem', fontWeight: 500, color: 'var(--ifm-color-emphasis-900)' }}>
                3. Use in React
              </h4>
              <CodeBlock language="jsx">
{`import { useStore } from 'soulstate/react';
import { useCounterStore } from './store';

function Counter() {
  const count = useStore(useCounterStore, s => s.count);
  const doubled = useStore(useCounterStore, s => s.doubled);
  const increment = useStore(useCounterStore, s => s.increment);

  return (
    <div>
      <h1>{count} × 2 = {doubled}</h1>
      <button onClick={increment}>+1</button>
    </div>
  );
}`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ margin: '4rem 0' }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: '3rem',
            fontWeight: 300,
            fontSize: '2.5rem',
            color: 'var(--ifm-color-emphasis-900)',
          }}>
            Everything You Need
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
            gap: '1.5rem',
          }}>
            {[
              { title: 'DAG Architecture', desc: 'Directed acyclic graph for surgical invalidation and topological recomputation' },
              { title: 'Computed State', desc: 'Memoized, dependency-aware derived state with glitch-free propagation' },
              { title: 'Transactions', desc: 'Atomic multi-mutation batches with rollback support' },
              { title: 'Slices', desc: 'Modular store composition with createSlice and combineSlices' },
              { title: 'Microtask Batching', desc: 'Deterministic batching of all setState calls via microtask scheduler' },
              { title: 'Hybrid Dispatch', desc: 'Bitmask fast path for ≤8 keys, graph path for complex updates' },
              { title: 'TypeScript First', desc: 'Full type inference and safety with zero boilerplate' },
              { title: 'SSR Support', desc: 'Next.js and server-side rendering ready out of the box' },
              { title: 'Middleware', desc: 'Redux DevTools integration and persistence middleware included' },
              { title: 'Shallow Equality', desc: 'Built-in shallow comparator and useShallow hook for fine-grained renders' },
              { title: 'Zero Allocations', desc: 'Reusable proxy tracking and minimal structural sharing in set' },
              { title: 'Vanilla JS', desc: 'Full API surface works without React — no peer dependency required' },
            ].map((feature, idx) => (
              <div key={idx} className="card" style={{
                padding: '2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '180px',
              }}>
                <h4 style={{
                  marginBottom: '1rem',
                  color: 'var(--brand-primary)',
                  fontWeight: 500,
                  fontSize: '1.25rem',
                }}>
                  {feature.title}
                </h4>
                <p style={{
                  color: 'var(--ifm-color-emphasis-700)',
                  margin: 0,
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Benchmark Comparison */}
        <section style={{ margin: '4rem 0', textAlign: 'center' }}>
          <h2 style={{
            marginBottom: '3rem',
            fontWeight: 300,
            fontSize: '2.5rem',
            color: 'var(--ifm-color-emphasis-900)',
          }}>
            How It Compares
          </h2>
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
          }}>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Benchmark</th>
                  <th>SoulState</th>
                  <th>Zustand</th>
                  <th>Ratio</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { bench: 'Sync throughput (ops/s)', soul: '5.2M', other: '5.5M', ratio: '1.05x slower' },
                  { bench: 'No-op elimination (sparse)', soul: '914x', other: 'baseline', ratio: '914x faster' },
                  { bench: 'Deep chain recomputation', soul: '26x', other: 'baseline', ratio: '26x faster' },
                  { bench: 'Hybrid dispatch (8 keys)', soul: '2.8x', other: 'baseline', ratio: '2.8x faster' },
                  { bench: 'Hybrid dispatch (64 keys)', soul: '16.8x', other: 'baseline', ratio: '16.8x faster' },
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left', fontWeight: 500 }}>{row.bench}</td>
                    <td style={{ color: 'var(--brand-primary)', fontWeight: 500 }}>{row.soul}</td>
                    <td>{row.other}</td>
                    <td style={{ fontWeight: 600 }}>{row.ratio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section style={{
          textAlign: 'center',
          padding: '4rem 1rem',
          background: 'var(--surface-light)',
          borderRadius: '16px',
          marginBottom: '2rem',
        }}>
          <h2 style={{
            marginBottom: '1rem',
            fontWeight: 300,
            fontSize: '2.5rem',
            color: 'var(--ifm-color-emphasis-900)',
          }}>
            Ready to Build Faster?
          </h2>
          <p style={{
            marginBottom: '2rem',
            fontSize: '1.2rem',
            color: 'var(--ifm-color-emphasis-700)',
            maxWidth: '500px',
            margin: '0 auto 2rem',
            lineHeight: '1.6',
          }}>
            Join developers who have made the switch to SoulState and experience the performance difference.
          </p>
          <Link
            className="button button--primary button--lg"
            to="/docs/introduction"
            style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
          >
            Start Building with SoulState
          </Link>
        </section>
      </main>
    </Layout>
  );
}
