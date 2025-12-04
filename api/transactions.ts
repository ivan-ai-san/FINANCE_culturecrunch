import type { VercelRequest, VercelResponse } from '@vercel/node';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = 'Transactions!A:H'; // Adjust based on your sheet structure

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  hasGST: boolean;
  gstAmount: number;
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

async function getTransactions(accessToken: string): Promise<Transaction[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Sheets API error: ${response.status}`);
  }

  const data = await response.json();
  const rows = data.values || [];

  // Skip header row, map to Transaction objects
  return rows.slice(1).map((row: string[]) => ({
    id: row[0] || '',
    date: row[1] || '',
    description: row[2] || '',
    amount: parseFloat(row[3]) || 0,
    type: row[4] as 'INCOME' | 'EXPENSE',
    category: row[5] || '',
    hasGST: row[6]?.toLowerCase() === 'true',
    gstAmount: parseFloat(row[7]) || 0,
  }));
}

async function addTransaction(accessToken: string, transaction: Transaction): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}:append?valueInputOption=USER_ENTERED`;

  const row = [
    transaction.id,
    transaction.date,
    transaction.description,
    transaction.amount,
    transaction.type,
    transaction.category,
    transaction.hasGST,
    transaction.gstAmount,
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
    throw new Error(`Failed to add transaction: ${response.status}`);
  }
}

async function deleteTransaction(accessToken: string, id: string): Promise<void> {
  // First, find the row with this ID
  const transactions = await getTransactions(accessToken);
  const rowIndex = transactions.findIndex(t => t.id === id);

  if (rowIndex === -1) {
    throw new Error('Transaction not found');
  }

  // Row index in sheet (add 2: 1 for header, 1 for 0-based to 1-based)
  const sheetRowIndex = rowIndex + 2;

  // Get sheet ID (not spreadsheet ID)
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;
  const metaResponse = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const metaData = await metaResponse.json();
  const sheetGid = metaData.sheets?.find((s: any) => s.properties?.title === 'Transactions')?.properties?.sheetId || 0;

  // Delete the row
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
    throw new Error(`Failed to delete transaction: ${response.status}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get access token from Authorization header
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
        const transactions = await getTransactions(accessToken);
        return res.json(transactions);
      }

      case 'POST': {
        const transaction = req.body as Transaction;
        await addTransaction(accessToken, transaction);
        return res.json({ success: true });
      }

      case 'DELETE': {
        const { id } = req.query;
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Transaction ID required' });
        }
        await deleteTransaction(accessToken, id);
        return res.json({ success: true });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    // If token expired, try to refresh
    if (error.message?.includes('401') && refreshToken) {
      const newToken = await refreshAccessToken(refreshToken);
      if (newToken) {
        return res.status(401).json({
          error: 'Token expired',
          new_access_token: newToken
        });
      }
    }
    console.error('Transactions API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
