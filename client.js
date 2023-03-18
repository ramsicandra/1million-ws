const ws = require('ws');
const dns = require('dns');

var t = `
Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
`;

var sockets = [];

var serverip = 'server';

dns.resolve4('server', (err, addr) => serverip = addr[0]);

setInterval(function() {

let tospawn = Math.min(20000 - sockets.length, 10);

for(var i=0;i<tospawn;i++) {
    const s = new ws.WebSocket(`ws://${serverip}:8080/path`);
    s.on('error', console.error);
    s.on('open', () => sockets.push(s));
    //s.on('message', (m) => console.log(m.toString()));
    s.on('close', () => sockets.splice(sockets.indexOf(s), 1));
}


}, 10);


setInterval(function() {
    //console.log(sockets.length);
    if(sockets.length === 0) return;
    var s = sockets[Math.floor(Math.random() * sockets.length)];
    s.send(t);
}, 1000);

