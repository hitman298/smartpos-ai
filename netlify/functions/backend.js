// Netlify function to handle backend API requests
const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb+srv://hitmanacc001_db_user:Rlyq0PNiOyglNASp@cluster0.8otfoya.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  
  const client = new MongoClient(MONGODB_URL);
  await client.connect();
  cachedClient = client;
  return client;
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('smartpos_ai');
    
    const { httpMethod, path, body } = event;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Route handling
    if (httpMethod === 'GET') {
      if (path === '/api/health') {
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() })
        };
      }
      
      if (path === '/api/items') {
        const items = await db.collection('items').find({}).toArray();
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: items })
        };
      }
      
      if (path === '/api/transactions') {
        const transactions = await db.collection('transactions').find({}).toArray();
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: transactions })
        };
      }
      
      if (path === '/api/sessions') {
        const sessions = await db.collection('sessions').find({}).toArray();
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: sessions })
        };
      }
      
      if (path === '/api/customers') {
        const customers = await db.collection('customers').find({}).toArray();
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: customers })
        };
      }
    }
    
    if (httpMethod === 'POST') {
      if (path === '/api/transactions') {
        const transactionData = JSON.parse(body);
        transactionData.id = `txn_${Date.now()}`;
        transactionData.timestamp = new Date().toISOString();
        
        const result = await db.collection('transactions').insertOne(transactionData);
        
        // Update session
        await db.collection('sessions').updateOne(
          { is_active: true },
          {
            $inc: {
              total_sales: transactionData.total_amount,
              transaction_count: 1
            }
          }
        );
        
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: { ...transactionData, _id: result.insertedId } })
        };
      }
    }
    
    return {
      statusCode: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found' })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};