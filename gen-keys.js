import webpush from 'web-push';
const keys = webpush.generateVAPIDKeys();
console.log('---VAPID_START---');
console.log(JSON.stringify(keys, null, 2));
console.log('---VAPID_END---');
