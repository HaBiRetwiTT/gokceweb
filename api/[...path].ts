import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Backend URL'i
  const backendUrl = 'http://77.245.151.173:3000';
  
  // Path'i al - Vercel'de [...path] için req.query.path array olur
  // Örnek: /api/auth/login -> req.query.path = ['auth', 'login']
  let path = '';
  if (req.query.path) {
    if (Array.isArray(req.query.path)) {
      path = req.query.path.join('/');
    } else if (typeof req.query.path === 'string') {
      path = req.query.path;
    }
  }
  
  // Eğer path boşsa, URL'den parse et (fallback)
  if (!path && req.url) {
    const urlPath = req.url.split('?')[0]; // Query string'i kaldır
    if (urlPath.startsWith('/api/')) {
      path = urlPath.substring(5); // '/api/' kısmını kaldır
    }
  }
  
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
  
  // Debug için log (production'da kaldırılabilir)
  console.log('Proxy request:', {
    method: req.method,
    originalUrl: req.url,
    path,
    fullPath,
    targetUrl,
  });
  
  // CORS preflight (OPTIONS) istekleri için
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
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

