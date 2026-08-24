export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { password } = req.body || {};
  if (password !== process.env.VITE_ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_PROJECT_ID) {
    return res.status(400).json({ error: 'Vercel Analytics not configured' });
  }

  try {
    const fetchVercel = async (endpoint, query = '', type = 'visits') => {
      // Fetch data for the last 30 days
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 30);
      const since = sinceDate.toISOString();
      const until = new Date().toISOString();
      
      let q = `since=${since}&until=${until}`;
      if (query) q += `&${query}`;

      const response = await fetch(`https://api.vercel.com/v1/query/web-analytics/${type}/${endpoint}?projectId=${process.env.VERCEL_PROJECT_ID}&${q}`, {
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`
        }
      });
      const dataRes = await response.json();
      return dataRes.data || (dataRes.error ? [] : dataRes);
    };

    const [
      countData,
      countryData,
      referrerData,
      pageData,
      deviceData,
      browserData,
      osData,
      eventsData
    ] = await Promise.all([
      fetchVercel('count'),
      fetchVercel('aggregate', 'by=country'),
      fetchVercel('aggregate', 'by=referrerHostname'),
      fetchVercel('aggregate', 'by=requestPath'),
      fetchVercel('aggregate', 'by=deviceType'),
      fetchVercel('aggregate', 'by=browserName'),
      fetchVercel('aggregate', 'by=osName'),
      fetchVercel('aggregate', 'by=eventName', 'events')
    ]);

    return res.status(200).json({
      data: {
        count: countData,
        countries: countryData,
        referrers: referrerData,
        pages: pageData,
        devices: deviceData,
        browsers: browserData,
        os: osData,
        events: eventsData
      }
    });
  } catch (err) {
    console.error('Vercel API error:', err);
    return res.status(500).json({ error: 'Failed to fetch detailed analytics' });
  }
}
