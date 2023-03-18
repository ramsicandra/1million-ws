# 1 Million Websockets with Node.JS

Purpose: It's fun to do.

See
- [Beyond 1million websockets](#conclusion--beyond-1000000-websockets)
- [Eren Yanay - 1 million websockets with go](https://www.youtube.com/watch?v=LI1YTFMi8W4)
    - [Code snipet](https://github.com/eranyanay/1m-go-websockets)

## 10,000 websockets
Using ws code sample
https://github.com/websockets/ws#sending-and-receiving-text-data works

Simple Server
```javascript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});
```

Client
```javascript
import WebSocket from 'ws';

const sockets = [];

for(i=0;i<10000;i++) {
    const ws = new WebSocket('ws://localhost:8080/path');

    ws.on('error', console.error);

    ws.on('open', function open() {
    ws.send('something');
    });

    ws.on('message', function message(data) {
      console.log('received: %s', data);
      ws.send(data);
    });
    sockets.push(ws);
}
```

## 100,000 Websockets
Around this scale, I hit 2 issues also encountered by Eren Yanay video in the references.

### Number of ports
The server only uses 1 port for all connections in this case port 8080. However, the clients need 1 port per connections. There are roughly 65,000 ports per IP of which around 30,000 are not reserved & usable.

Solution: Docker network.

Docker offer a private internal network giving each container a unique IP. This allow us to have 10 client container each initiating 10,000 connections.

```bash
docker network create net1

for i in `seq 1 10`
do
  docker run --name client$i \
    -v `pwd`:/app/ \
    --net net1 \
    -d \
    node  \
    bash -c 'cd app && node client.js'

  sleep 20
done
```

### nfconntrack
At some point, client start to have both DNS timeout and connection timeout. The reason is because the kernel will start dropping network packet because it ran out of space for nfconntrack table. This is stated in the Eren Yanay video and also visible in the kernel logs. 

```bash
dmesg
# you'll see nfconntrack errors
```

Solution: Increase nf_conntrack limit
```bash
echo 2262440 > /proc/sys/net/nf_conntrack_max
```

## 700,000 Websockets
2 new issues: CPU and memory limits.

### CPU
I modified the client to send message to a random connections it holds.
1 client = 10,000 connections = 100message/s. This translates to 0.1 message/connection/s. 10,000msg/s for 100,000 websockets.

Node.JS is a single threaded application and could only process so many data. 

Solution: tone down client

I tuned the message frequency down in order for the server to be able to initialise new connections.

### Memory
I attempted this test in a 16GB 6CPU VPS instance in Linode/DigitalOcean. At around 700,000 websockets, the system will hit the memory limit and kill process with the biggest usage of RAM (the websocket server).

Websocket server: 3.5GB RAM or 5kb/connections
Websocket 10,000 ws client: 150MB

Solution: Scale up the server!

After scaling up the server to 32GB 8CPU, I manage to hit 1,000,000 connections.

## 1,000,000 Websockets :tada:

The Websocket server will be running but slows down a lot in initialising new connections.

However, the last limit is number of file descriptor. At this point, the server will crash with error that it couldn't generate a new file descriptor.

The linux default hard limit of number of file descriptor is around 1,000,000 as well.

## Conclusion & beyond 1,000,000 Websockets
1. Linux & Node.JS & ws has come a long way and made handling 1,000,000 connections more straight forward.
2. A lot of the lesson from Eren Yanay video has ease this process. See his video.
3. Although Node.JS could do this, this is a toy webserver that only echos back messages. Node.JS application will be very limited by CPU due to it's single threaded nature
   - A real application will probably be more limited by CPU & Memory first than Node.JS & ws library.
4. There needs to be a way to increase linux file descriptor hard limit to beyond 1 million connections.
