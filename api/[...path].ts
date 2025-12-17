import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Backend URL'i
  const backendUrl = 'http://77.245.151.173:3000';
  
  // Path'i al (örnek: /api/dashboard/stats -> dashboard/stats)
  const pathArray = Array.isArray(req.query.path) 
    ? req.query.path 
    : req.query.path 
    ? [req.query.path] 
    : [];
  
  const path = pathArray.join('/');
  
  // Query parametrelerini filtrele (path'i hariç tut)
  const queryParams: Record<string, string> = {};
  Object.keys(req.query).forEach(key => {
    if (key !== 'path') {
      const value = req.query[key];
      if (typeof value === 'string') {
        queryParams[key] = value;
      } else if (Array.isArray(value)) {
        queryParams[key] = value.join(',');
      }
    }
  });
  
  // Query string oluştur
  const queryString = new URLSearchParams(queryParams).toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;
  
  // Backend'e istek yap
  const targetUrl = `${backendUrl}/${fullPath}`;
  
  try {
    // Request headers'ı hazırla
    const headers: Record<string, string> = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };
    
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    
    // Request body'yi hazırla
    let body: string | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });
    
    const data = await response.text();
    
    // Response headers'ı kopyala
    response.headers.forEach((value, key) => {
      // CORS headers'ı override etme
      if (!key.toLowerCase().startsWith('access-control')) {
        res.setHeader(key, value);
      }
    });
    
    // CORS headers ekle
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

