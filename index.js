const ws = require('ws');

const wss = new ws.WebSocketServer({
  port: 8080,
  perMessageDeflate: false
});

let nconn = 0;

wss.on('connection', function connection(ws) {
  nconn += 1;
  ws.on('close', () => { nconn-- });
  ws.on('error', console.error);

  ws.on('message', function message(data) {
//    console.log(data);
    ws.send(data);
  });

  ws.send("OK!");
});

setInterval(() => {
   console.log(`${nconn}, ${process.memoryUsage().rss / nconn}`);
}, 1000);

