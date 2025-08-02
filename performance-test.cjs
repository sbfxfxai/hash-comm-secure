const https = require('https');
const { performance } = require('perf_hooks');

function measureLoadTime(url) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const req = https.get(url, (res) => {
      let data = '';
      let firstByteTime = null;
      
      res.on('data', (chunk) => {
        if (!firstByteTime) {
          firstByteTime = performance.now() - startTime;
        }
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        resolve({
          url: url,
          statusCode: res.statusCode,
          totalTime: Math.round(totalTime),
          firstByteTime: Math.round(firstByteTime || 0),
          contentLength: Buffer.byteLength(data, 'utf8'),
          headers: res.headers,
          timing: {
            dns: 'N/A (using https module)',
            connect: 'N/A (using https module)', 
            firstByte: firstByteTime ? Math.round(firstByteTime) + 'ms' : 'N/A',
            total: Math.round(totalTime) + 'ms'
          }
        });
      });
      
    }).on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runPerformanceTest() {
  const url = 'https://bitcomm.email';
  
  console.log('🚀 Running Performance Test for BitComm');
  console.log('=' .repeat(50));
  console.log(`URL: ${url}`);
  console.log('');
  
  try {
    const result = await measureLoadTime(url);
    
    console.log('📊 Performance Metrics:');
    console.log('-'.repeat(30));
    console.log(`Status Code: ${result.statusCode}`);
    console.log(`Total Load Time: ${result.timing.total}`);
    console.log(`Time to First Byte: ${result.timing.firstByte}`);
    console.log(`Content Length: ${(result.contentLength / 1024).toFixed(2)} KB`);
    console.log('');
    
    console.log('🔍 Response Headers:');
    console.log('-'.repeat(30));
    Object.entries(result.headers).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
    console.log('');
    
    // Performance assessment
    const loadTime = result.totalTime;
    console.log('📈 Performance Assessment:');
    console.log('-'.repeat(30));
    
    if (loadTime < 1000) {
      console.log('✅ Excellent load time (< 1s)');
    } else if (loadTime < 2000) {
      console.log('🟡 Good load time (1-2s)');
    } else if (loadTime < 3000) {
      console.log('🟠 Average load time (2-3s)');
    } else {
      console.log('🔴 Slow load time (> 3s)');
    }
    
    // Check key headers
    console.log('');
    console.log('🛡️ Security & Optimization Headers:');
    console.log('-'.repeat(40));
    
    const securityHeaders = [
      'content-security-policy',
      'x-frame-options', 
      'x-content-type-options',
      'strict-transport-security',
      'cache-control',
      'content-encoding'
    ];
    
    securityHeaders.forEach(header => {
      const value = result.headers[header];
      if (value) {
        console.log(`✅ ${header}: ${value}`);
      } else {
        console.log(`❌ ${header}: Not set`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error running performance test:', error.message);
  }
}

runPerformanceTest();
