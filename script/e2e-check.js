const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  try {
    console.log('Running basic E2E checks...');
    const res = await fetch('http://localhost:3000/api/survey/models');
    if (!res.ok) throw new Error('Models endpoint failed: ' + res.status);
    const data = await res.json();
    console.log('Models endpoint OK:', Object.keys(data));

    const authRes = await fetch('http://localhost:3000/api/auth/session');
    if (authRes.status === 401) {
      console.log('Auth session endpoint returned 401 (expected for unauthenticated)');
    } else {
      console.log('Auth session status:', authRes.status);
    }

    console.log('E2E quick checks completed');
    process.exit(0);
  } catch (err) {
    console.error('E2E check failed:', err.message || err);
    process.exit(1);
  }
})();
