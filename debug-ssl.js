const https = require('https');

const targets = [
    'https://upland.zendesk.com/api/v2/views/39809102501787/tickets.json'
];

console.log('--- SSL CONNECTIVITY TEST ---');
console.log(`Node Version: ${process.version}`);
console.log(`TLS Reject Unauthorized: ${process.env.NODE_TLS_REJECT_UNAUTHORIZED || 'default'}`);

targets.forEach(url => {
    console.log(`\nTesting: ${url}`);
    const req = https.get(url, (res) => {
        console.log(`✅ [HTTPS] ${url}: Status ${res.statusCode}`);
        res.resume();
    }).on('error', (e) => {
        console.error(`❌ [HTTPS] ${url}: ERROR`, e.message);
    });

    fetch(url).then(res => {
        console.log(`✅ [FETCH] ${url}: Status ${res.status}`);
    }).catch(e => {
        console.error(`❌ [FETCH] ${url}: ERROR`, e.message);
        if (e.cause) console.error(e.cause);
    });
});
