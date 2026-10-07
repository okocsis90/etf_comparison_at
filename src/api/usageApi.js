const VISITOR_ID_KEY = 'etf-comparison-visitor-id';

const getVisitorId = () => {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
};

export const recordAppUsage = async () => {
  try {
    const response = await fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: getVisitorId() }),
    });

    if (!response.ok) {
      throw new Error(`Usage tracking failed (${response.status})`);
    }
  } catch (error) {
    console.warn('Could not record app usage:', error);
  }
};
