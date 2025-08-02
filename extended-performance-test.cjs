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
          content: data
        });
      });
      
    }).on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runMultipleTests(url, count = 5) {
  const results = [];
  
  console.log(`🔄 Running ${count} performance tests...`);
  
  for (let i = 0; i < count; i++) {
    try {
      const result = await measureLoadTime(url);
      results.push({
        test: i + 1,
        totalTime: result.totalTime,
        firstByteTime: result.firstByteTime,
        contentLength: result.contentLength
      });
      process.stdout.write(`${i + 1} `);
    } catch (error) {
      console.error(`Test ${i + 1} failed:`, error.message);
    }
  }
  
  console.log('\n');
  return results;
}

function analyzeHTML(content) {
  const analysis = {
    hasMetaViewport: content.includes('name="viewport"'),
    hasMetaDescription: content.includes('name="description"'),
    hasTitle: /<title>.*<\/title>/.test(content),
    hasCanonical: content.includes('rel="canonical"'),
    scriptTags: (content.match(/<script/g) || []).length,
    linkTags: (content.match(/<link/g) || []).length,
    imgTags: (content.match(/<img/g) || []).length,
    hasServiceWorker: content.includes('serviceWorker') || content.includes('sw.js'),
    hasWebManifest: content.includes('manifest.json') || content.includes('webmanifest'),
    inlineStyles: (content.match(/<style/g) || []).length,
    inlineScripts: (content.match(/<script(?![^>]*src)/g) || []).length
  };
  
  return analysis;
}

async function runComprehensiveTest() {
  const url = 'https://bitcomm.email';
  
  console.log('🚀 BitComm Comprehensive Performance Analysis');
  console.log('='.repeat(55));
  console.log(`URL: ${url}`);
  console.log('');
  
  try {
    // Single detailed test
    const detailedResult = await measureLoadTime(url);
    
    console.log('📊 Initial Load Performance:');
    console.log('-'.repeat(35));
    console.log(`Status Code: ${detailedResult.statusCode}`);
    console.log(`Total Load Time: ${detailedResult.totalTime}ms`);
    console.log(`Time to First Byte: ${detailedResult.firstByteTime}ms`);
    console.log(`Content Size: ${(detailedResult.contentLength / 1024).toFixed(2)} KB`);
    console.log('');
    
    // Multiple tests for consistency
    const multipleResults = await runMultipleTests(url, 5);
    
    if (multipleResults.length > 0) {
      const avgTime = Math.round(multipleResults.reduce((sum, r) => sum + r.totalTime, 0) / multipleResults.length);
      const avgFTTB = Math.round(multipleResults.reduce((sum, r) => sum + r.firstByteTime, 0) / multipleResults.length);
      const minTime = Math.min(...multipleResults.map(r => r.totalTime));
      const maxTime = Math.max(...multipleResults.map(r => r.totalTime));
      
      console.log('📈 Performance Statistics (5 tests):');
      console.log('-'.repeat(35));
      console.log(`Average Load Time: ${avgTime}ms`);
      console.log(`Average TTFB: ${avgFTTB}ms`);
      console.log(`Best Time: ${minTime}ms`);
      console.log(`Worst Time: ${maxTime}ms`);
      console.log(`Consistency: ${maxTime - minTime}ms variance`);
      console.log('');
    }
    
    // HTML Analysis
    const htmlAnalysis = analyzeHTML(detailedResult.content);
    
    console.log('🔍 HTML & SEO Analysis:');
    console.log('-'.repeat(35));
    console.log(`✅ Title Tag: ${htmlAnalysis.hasTitle ? 'Present' : 'Missing'}`);
    console.log(`${htmlAnalysis.hasMetaDescription ? '✅' : '❌'} Meta Description: ${htmlAnalysis.hasMetaDescription ? 'Present' : 'Missing'}`);
    console.log(`${htmlAnalysis.hasMetaViewport ? '✅' : '❌'} Viewport Meta: ${htmlAnalysis.hasMetaViewport ? 'Present' : 'Missing'}`);
    console.log(`${htmlAnalysis.hasCanonical ? '✅' : '🟡'} Canonical URL: ${htmlAnalysis.hasCanonical ? 'Present' : 'Not set'}`);
    console.log(`Script Tags: ${htmlAnalysis.scriptTags}`);
    console.log(`Link Tags: ${htmlAnalysis.linkTags}`);
    console.log(`Image Tags: ${htmlAnalysis.imgTags}`);
    console.log(`Inline Styles: ${htmlAnalysis.inlineStyles}`);
    console.log(`Inline Scripts: ${htmlAnalysis.inlineScripts}`);
    console.log('');
    
    console.log('⚡ Progressive Web App Features:');
    console.log('-'.repeat(35));
    console.log(`${htmlAnalysis.hasServiceWorker ? '✅' : '❌'} Service Worker: ${htmlAnalysis.hasServiceWorker ? 'Detected' : 'Not found'}`);
    console.log(`${htmlAnalysis.hasWebManifest ? '✅' : '❌'} Web Manifest: ${htmlAnalysis.hasWebManifest ? 'Detected' : 'Not found'}`);
    console.log('');
    
    // Security Headers Analysis
    console.log('🛡️ Security Headers Analysis:');
    console.log('-'.repeat(35));
    
    const securityScore = {
      csp: detailedResult.headers['content-security-policy'] ? 10 : 0,
      hsts: detailedResult.headers['strict-transport-security'] ? 10 : 0,
      xframe: detailedResult.headers['x-frame-options'] ? 10 : 0,
      xcto: detailedResult.headers['x-content-type-options'] ? 10 : 0,
      referrer: detailedResult.headers['referrer-policy'] ? 5 : 0,
      xss: detailedResult.headers['x-xss-protection'] ? 5 : 0
    };
    
    const totalSecurityScore = Object.values(securityScore).reduce((a, b) => a + b, 0);
    
    Object.entries(securityScore).forEach(([header, score]) => {
      const icon = score > 0 ? '✅' : '❌';
      const headerName = header.toUpperCase().replace(/([A-Z])/g, ' $1').trim();
      console.log(`${icon} ${headerName}: ${score > 0 ? score + ' points' : 'Missing'}`);
    });
    
    console.log(`\nSecurity Score: ${totalSecurityScore}/50`);
    console.log('');
    
    // Performance Grade
    console.log('🏆 Overall Performance Grade:');
    console.log('-'.repeat(35));
    
    let grade = 'F';
    let gradeColor = '🔴';
    
    const avgTime = multipleResults.length > 0 ? Math.round(multipleResults.reduce((sum, r) => sum + r.totalTime, 0) / multipleResults.length) : null;
    if (avgTime || detailedResult.totalTime) {
      const time = avgTime || detailedResult.totalTime;
      if (time < 200) { grade = 'A+'; gradeColor = '🟢'; }
      else if (time < 500) { grade = 'A'; gradeColor = '🟢'; }
      else if (time < 1000) { grade = 'B'; gradeColor = '🟡'; }
      else if (time < 2000) { grade = 'C'; gradeColor = '🟠'; }
      else if (time < 3000) { grade = 'D'; gradeColor = '🔴'; }
    }
    
    console.log(`${gradeColor} Performance Grade: ${grade}`);
    console.log(`${totalSecurityScore >= 40 ? '🟢' : totalSecurityScore >= 25 ? '🟡' : '🔴'} Security Score: ${totalSecurityScore}/50`);
    
  } catch (error) {
    console.error('❌ Error running comprehensive test:', error.message);
  }
}

runComprehensiveTest();
