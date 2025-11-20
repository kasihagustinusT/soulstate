import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';

export default function Home(): JSX.Element {
  return (
    <Layout
      title="SoulState - The Zero-Overhead State of Mind"
      description="Minimalist, high-performance state management for React and vanilla JS"
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
              maxWidth: '600px',
            }}>
              A minimalist, high-performance state management library for React and vanilla JS.
              Re-engineered core focused on extreme performance and zero overhead.
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
              { value: '19.1x', label: 'Faster than alternatives' },
              { value: '< 1KB', label: 'Zero dependencies' },
              { value: 'O(1)', label: 'Unsubscribe complexity' },
              { value: '0', label: 'Memory allocation' },
              { value: '⚡', label: 'Microtask batching' },
              { value: '🔒', label: 'Mutation guard' },
            ].map((metric, idx) => (
              <div key={idx} className="performance-metric">
                <div className="metric-value">{metric.value}</div>
                <div className="metric-label">{metric.label}</div>
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
                2. Create Store
              </h4>
              <CodeBlock language="javascript">
{`import { createStore } from 'soulstate';

export const useCounterStore = createStore({
  count: 0,
  increment: () => useCounterStore.set(state => ({ count: state.count + 1 }))
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
  const increment = useStore(useCounterStore, s => s.increment);

  return (
    <div>
      <h1>{count}</h1>
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
              { title: 'TypeScript Ready', desc: 'Full type inference and safety' },
              { title: 'SSR Support', desc: 'Next.js and server-side rendering ready' },
              { title: 'Middleware', desc: 'Extend with logging, persistence, and more' },
              { title: 'Vanilla JS', desc: 'Works great without React too' },
              { title: 'Tree Shaking', desc: 'Only bundle what you use' },
              { title: 'DevTools', desc: 'Development mode with mutation guards' },
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
