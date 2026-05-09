/* ══════════════════════════════════════════
   GEO — IP detection, device/browser/OS utils
   ══════════════════════════════════════════ */

function _detectDevice(ua) {
  if (/iPhone/.test(ua))            return 'iPhone';
  if (/iPad/.test(ua))              return 'iPad';
  if (/Android.*Mobile/.test(ua))   return 'Android Phone';
  if (/Android/.test(ua))           return 'Android Tablet';
  if (/CrOS/.test(ua))              return 'Chromebook';
  if (/Macintosh/.test(ua))         return 'MacBook/Mac';
  if (/Windows NT/.test(ua))        return 'Windows PC';
  if (/Linux/.test(ua))             return 'Linux PC';
  return 'Unknown';
}

function _detectBrowser(ua) {
  if (/Edg\//.test(ua))             return 'Microsoft Edge';
  if (/OPR\/|Opera\//.test(ua))     return 'Opera';
  if (/SamsungBrowser/.test(ua))    return 'Samsung Browser';
  if (/CriOS/.test(ua))             return 'Chrome (iOS)';
  if (/FxiOS/.test(ua))             return 'Firefox (iOS)';
  if (/YaBrowser/.test(ua))         return 'Yandex Browser';
  if (/UCBrowser/.test(ua))         return 'UC Browser';
  if (/Chrome\//.test(ua))          return 'Chrome';
  if (/Firefox\//.test(ua))         return 'Firefox';
  if (/Safari\//.test(ua))          return 'Safari';
  return 'Other';
}

function _detectOS(ua) {
  if (/Windows NT 10\.0/.test(ua))  return 'Windows 10/11';
  if (/Windows NT 6\.3/.test(ua))   return 'Windows 8.1';
  if (/Windows NT 6\.1/.test(ua))   return 'Windows 7';
  if (/Windows NT/.test(ua))        return 'Windows';
  if (/iPhone OS ([\d_]+)/.test(ua))  return 'iOS '      + RegExp.$1.replace(/_/g, '.');
  if (/iPad.*OS ([\d_]+)/.test(ua))   return 'iPadOS '   + RegExp.$1.replace(/_/g, '.');
  if (/Android ([\d.]+)/.test(ua))    return 'Android '  + RegExp.$1;
  if (/Mac OS X ([\d_]+)/.test(ua))   return 'macOS '    + RegExp.$1.replace(/_/g, '.');
  if (/CrOS/.test(ua))              return 'Chrome OS';
  if (/Linux/.test(ua))             return 'Linux';
  return '';
}

function fetchWithTimeout(url, timeoutMs) {
  return Promise.race([
    fetch(url),
    new Promise(function(_, reject) {
      setTimeout(function() { reject(new Error('Request timeout')); }, timeoutMs || 5000);
    })
  ]);
}

function _fetchGeo() {
  return fetchWithTimeout('https://get.geojs.io/v1/ip/geo.json', 5000)
    .then(function(r) {
      if (!r.ok) throw new Error('geojs failed');
      return r.json();
    })
    .then(function(d) {
      if (!d.ip) throw new Error('no ip');
      window._myIP = d.ip;
      checkBlock();
      return { geoSrc: 5, ip: d.ip||'', city: d.city||'', region: d.region||'', country: d.country||'', latitude: d.latitude||'', longitude: d.longitude||'', isp: d.organization_name||d.organization||'', asn: d.asn ? 'AS'+d.asn : '' };
    })
    .catch(function() {
      return fetchWithTimeout('https://ipapi.co/json/', 5000)
        .then(function(r) {
          if (!r.ok) throw new Error('ipapi failed');
          return r.json();
        })
        .then(function(d) {
          if (d.error || !d.ip) throw new Error('no ip');
          window._myIP = d.ip;
          checkBlock();
          return { geoSrc: 6, ip: d.ip||'', city: d.city||'', region: d.region||'', country: d.country_name||'', postal: d.postal||'', latitude: d.latitude||'', longitude: d.longitude||'', isp: d.org||'', asn: d.asn||'' };
        })
        .catch(function() {
          return fetchWithTimeout('https://cloudflare.com/cdn-cgi/trace', 5000)
            .then(function(r) {
              if (!r.ok) throw new Error('cf failed');
              return r.text();
            })
            .then(function(txt) {
              var obj = {};
              txt.trim().split('\n').forEach(function(line) {
                var idx = line.indexOf('=');
                if (idx > 0) obj[line.slice(0, idx)] = line.slice(idx + 1);
              });
              window._myIP = obj.ip || '';
              checkBlock();
              return { geoSrc: 4, ip: obj.ip||'', country: obj.loc||'' };
            });
        });
    });
}