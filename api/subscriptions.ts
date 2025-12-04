import type { VercelRequest, VercelResponse } from '@vercel/node';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = 'Subscriptions!A:K';
const EXPECTED_HEADERS = ['ID', 'Name', 'Amount', 'Frequency', 'Category', 'StartDate', 'ProjectionMonths', 'HasGST', 'GSTAmount', 'IsActive', 'UpdatedAt'];

interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'MONTHLY' | 'ANNUAL';
  category: string;
  startDate: string;
  projectionMonths: number;
  hasGST: boolean;
  gstAmount: number;
  isActive: boolean;
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
      }),
    });
    const data = await response.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

async function ensureSubscriptionsSheet(accessToken: string): Promise<void> {
  // Check if Subscriptions sheet exists
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;
  const metaResponse = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const metaData = await metaResponse.json();

  const hasSubscriptionsSheet = metaData.sheets?.some(
    (s: any) => s.properties?.title === 'Subscriptions'
  );

  if (!hasSubscriptionsSheet) {
    // Create the sheet
    const createUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`;
    await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          addSheet: {
            properties: { title: 'Subscriptions' }
          }
        }]
      }),
    });

    // Add header row
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Subscriptions!A1:K1?valueInputOption=USER_ENTERED`;
    await fetch(headerUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [EXPECTED_HEADERS]
      }),
    });
  } else {
    // Check if headers exist and match expected structure
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Subscriptions!A1:K1`;
    const headerResponse = await fetch(headerUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const headerData = await headerResponse.json();
    const existingHeaders = headerData.values?.[0] || [];

    // If no headers or headers don't match, set them
    if (existingHeaders.length === 0 || existingHeaders[0] !== 'ID') {
      const setHeaderUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Subscriptions!A1:K1?valueInputOption=USER_ENTERED`;
      await fetch(setHeaderUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [EXPECTED_HEADERS]
        }),
      });
    }
  }
}

async function getSubscriptions(accessToken: string): Promise<Subscription[]> {
  await ensureSubscriptionsSheet(accessToken);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Sheets API error: ${response.status}`);
  }

  const data = await response.json();
  const rows = data.values || [];

  return rows.slice(1).map((row: string[]) => ({
    id: row[0] || '',
    name: row[1] || '',
    amount: parseFloat(row[2]) || 0,
    frequency: row[3] as 'MONTHLY' | 'ANNUAL',
    category: row[4] || '',
    startDate: row[5] || '',
    projectionMonths: parseInt(row[6]) || 12,
    hasGST: row[7]?.toLowerCase() === 'true',
    gstAmount: parseFloat(row[8]) || 0,
    isActive: row[9]?.toLowerCase() !== 'false',
  }));
}

async function addSubscription(accessToken: string, subscription: Subscription): Promise<void> {
  await ensureSubscriptionsSheet(accessToken);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}:append?valueInputOption=USER_ENTERED`;

  const row = [
    subscription.id,
    subscription.name,
    subscription.amount,
    subscription.frequency,
    subscription.category,
    subscription.startDate,
    subscription.projectionMonths,
    subscription.hasGST,
    subscription.gstAmount,
    subscription.isActive,
    new Date().toISOString(),
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add subscription: ${response.status}`);
  }
}

async function updateSubscription(accessToken: string, id: string, updates: Partial<Subscription>): Promise<void> {
  const subscriptions = await getSubscriptions(accessToken);
  const rowIndex = subscriptions.findIndex(s => s.id === id);

  if (rowIndex === -1) {
    throw new Error('Subscription not found');
  }

  const updated = { ...subscriptions[rowIndex], ...updates };
  const sheetRowIndex = rowIndex + 2;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Subscriptions!A${sheetRowIndex}:K${sheetRowIndex}?valueInputOption=USER_ENTERED`;

  const row = [
    updated.id,
    updated.name,
    updated.amount,
    updated.frequency,
    updated.category,
    updated.startDate,
    updated.projectionMonths,
    updated.hasGST,
    updated.gstAmount,
    updated.isActive,
    new Date().toISOString(),
  ];

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update subscription: ${response.status}`);
  }
}

async function deleteSubscription(accessToken: string, id: string): Promise<void> {
  const subscriptions = await getSubscriptions(accessToken);
  const rowIndex = subscriptions.findIndex(s => s.id === id);

  if (rowIndex === -1) {
    throw new Error('Subscription not found');
  }

  const sheetRowIndex = rowIndex + 2;

  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;
  const metaResponse = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const metaData = await metaResponse.json();
  const sheetGid = metaData.sheets?.find((s: any) => s.properties?.title === 'Subscriptions')?.properties?.sheetId || 0;

  const deleteUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`;
  const response = await fetch(deleteUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheetGid,
            dimension: 'ROWS',
            startIndex: sheetRowIndex - 1,
            endIndex: sheetRowIndex,
          },
        },
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete subscription: ${response.status}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  let accessToken = authHeader?.replace('Bearer ', '');
  const refreshToken = req.headers['x-refresh-token'] as string;

  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  if (!SHEET_ID) {
    return res.status(500).json({ error: 'GOOGLE_SHEET_ID not configured' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const subscriptions = await getSubscriptions(accessToken);
        return res.json(subscriptions);
      }

      case 'POST': {
        const subscription = req.body as Subscription;
        await addSubscription(accessToken, subscription);
        return res.json({ success: true });
      }

      case 'PUT': {
        const { id } = req.query;
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Subscription ID required' });
        }
        await updateSubscription(accessToken, id, req.body);
        return res.json({ success: true });
      }

      case 'DELETE': {
        const { id } = req.query;
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Subscription ID required' });
        }
        await deleteSubscription(accessToken, id);
        return res.json({ success: true });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    if (error.message?.includes('401') && refreshToken) {
      const newToken = await refreshAccessToken(refreshToken);
      if (newToken) {
        return res.status(401).json({
          error: 'Token expired',
          new_access_token: newToken
        });
      }
    }
    console.error('Subscriptions API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
