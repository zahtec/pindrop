import { WebSocketServer, WebSocket } from 'ws';
import { default as Redis } from 'ioredis';
import { createHash } from 'crypto';
import express from 'express';

type User = { name: string; device: string; ip: string; id?: string; socket?: WebSocket };

const first = ['Exploratory', 'Fuzzy', 'Hypothetical', 'Inventive', 'Pseudo', 'Cool', 'Icy', 'Inevitable', 'Innovative', 'Playful', 'Proud', 'Silly', 'Spirited', 'Spontaneous', 'Goofy', 'Gorgeous', 'Flying', 'Funny', 'Fantastic', 'Sad'];
const last = ['Bunny', 'Cat', 'Dog', 'Horse', 'Mouse', 'Pig', 'Rabbit', 'Turtle', 'Bird', 'Cow', 'Elephant', 'Fish', 'Lion', 'Monkey', 'Panda', 'Penguin', 'Raccoon', 'Sheep', 'Tiger', 'Zebra'];

// Base Schema: IP, Network
// IP Room Schema: ID, User
const app = express();
const db = new Redis({
    host: process.env.FLY_APP_NAME ? 'pindrop-redis.internal' : 'redis',
    port: 6379,
    family: process.env.FLY_APP_NAME ? 6 : 4
});

db.flushall();

app.disable('x-powered-by');

app.use(express.static('dist/public'));

app.get('/robots.txt', (_, res) => res.status(404).send());

// Allow for certificate download on non-production servers
if (process.env.NODE_ENV !== 'production') app.get('/cert', (_, res) => res.sendFile('localhost.crt', { root: '/data/caddy/certificates/local/localhost' }));

app.get('/*', (req, res) => {
    if (req.path !== '/') return res.redirect('/');
    res.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    res.sendFile('index.html', { root: 'dist' });
});

const server = app.listen(8080, () => console.log('✨ Pindrop is now running on port 8080'));

// Generate ID for user and if it exists in given IP Room, regen ID
const genIPID = async (data: Record<string, string> | undefined): Promise<string> => {
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return data && id in data ? genIPID(data) : id;
};

// Generate ID for cross-network room
const genCNID = async (): Promise<string> => {
    const id = (Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6)).toUpperCase();
    return (await db.exists(id)) ? genCNID() : id;
};

// Get device based off of User Agent string
const getDevice = (ua: string | undefined): string => {
    if (!ua) return 'Unknown';

    const info = ua.split(') ')[0].split(';')[1];

    if (info.includes('Android')) return 'android';
    else if (info.includes('iPhone')) return 'iphone';
    else if (info.includes('CPU OS') && info.includes('like Mac OS X')) return 'iphone';
    else if (info.includes('Mac OS X')) return 'mac';
    else if (info.includes('Win64') || info.includes('Win32')) return 'windows';
    else if (ua.includes('CrOS')) return 'chrome';
    else if (info.includes('Linux')) return 'linux';

    return 'unknown';
};

new WebSocketServer({
    path: '/',
    server
}).on('connection', async (ws, req) => {
    // Created a hashed IP that may be reassigned to a cnid later on
    let ip = createHash('sha256').update(req.socket.remoteAddress!).digest('base64');
    // Generate ID for user and if it exists in given IP Room, regen ID
    const id = await genIPID(await db.hgetall(ip));
    // Generate a random semantic name
    const name = `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
    // Get the device name based of off user agent
    const device = getDevice(req.headers['user-agent']);
    // Create redis subscriber
    const sub = db.duplicate();

    ws.on('message', async e => {
        const msg = JSON.parse(e.toString());

        switch (msg.type) {
            case 'init': {
                // Either create new IP Room or append user to existing IP Room. Or, if a join code was provided on the client side, join cross-network room
                // IP's in this context can be either cross-network room ID's or actual IP's

                const isCnid = await db.exists(msg.cnid);

                // If IP/CN Room doesn't exist, create it. Otherwise append user to existing Room.
                if (isCnid) {
                    // Change IP to cnid for interoperability
                    ip = msg.cnid;

                    const room = await db.hgetall(ip);

                    // Append user to existing cnid room with their IP as a cnid instead
                    await db.hset(ip, id, JSON.stringify({ name, device, ip }));

                    // Send user who just joined every other user already in the room
                    for (const [oid, user] of Object.entries(room)) {
                        if (oid === id) continue;
                        const { name: oname, device: odevice, ip: ocnid } = JSON.parse(user);
                        ws.send(JSON.stringify({ type: 'new-user', name: oname, device: odevice, ip: ocnid, id: oid }));
                    }

                    // Send publish message so other users know a new user has joined
                    db.publish(ip, JSON.stringify({ type: 'new-user', name, device, ip, id }));
                } else if (await db.exists(ip)) {
                    const room = await db.hgetall(ip);

                    // Append user to existing IP room
                    await db.hset(ip, id, JSON.stringify({ name, device, ip }));

                    // Send user who just joined every other user already in the room
                    for (const [oid, user] of Object.entries(room)) {
                        if (oid === id) continue;
                        const { name: oname, device: odevice, ip: ocnid } = JSON.parse(user);
                        ws.send(JSON.stringify({ type: 'new-user', name: oname, device: odevice, ip: ocnid, id: oid }));
                    }

                    // Send publish message so other users know a new user has joined
                    db.publish(ip, JSON.stringify({ type: 'new-user', name, device, ip, id }));
                } else {
                    // Create new IP Room with user that just connected
                    await db.hmset(ip, [id, JSON.stringify({ name, device, ip })]);
                }

                // Send the user their own info, if they are in a cross-network room switch out their IP for the cross-network room ID
                ws.send(JSON.stringify({ type: 'init', name, cnid: isCnid && ip }));

                // Redis subscriptions
                sub.subscribe(ip, `${ip}:${id}`);

                sub.on('message', (_, message) => {
                    const msg = JSON.parse(message);
                    if (msg.ip === ip && msg.id === id) return;
                    ws.send(message);
                });

                break;
            }

            case 'create': {
                // Create new cross-network room

                const room = await db.hgetall(ip);
                if (!room) return;

                // Unscubscribe because IP is changing to cnid
                await sub.unsubscribe(ip, `${ip}:${id}`);

                // Delete old IP room/notify others still in that ip room of user leaving
                if (Object.keys(room).length === 1) db.del(ip);
                else {
                    db.publish(ip, JSON.stringify({ type: 'del-user', ip, id }));

                    // For each user in the room, tell this user that they have left
                    for (const [uid, user] of Object.entries(room)) {
                        if (uid === id) continue;
                        const { ip } = JSON.parse(user);
                        ws.send(JSON.stringify({ type: 'del-user', ip, id: uid }));
                    }

                    // Remove this user
                    await db.hdel(ip, id);
                }

                // Change users ip to a CNID
                ip = await genCNID();

                // Subscribe to new room
                await sub.subscribe(ip, `${ip}:${id}`);

                // Create new CNID room with user that just connected
                await db.hmset(ip, [id, JSON.stringify({ name, device, ip })]);
                ws.send(JSON.stringify({ type: 'create', ip }));
                break;
            }

            case 'verify': {
                // Verify user IP,ROOMCODE/ID exists

                const room = await db.hgetall(msg.ip);
                if (!room) return;
                const remote = JSON.parse(room[msg.id]) as User;
                if (!remote) return;

                remote ? ws.send(JSON.stringify({ type: 'verify', status: 1, id: msg.id, ip: msg.ip })) : ws.send(JSON.stringify({ type: 'verify', status: 0, id: msg.id, ip: msg.ip }));
                break;
            }

            case 'confirm': {
                // Confirmation to accept file

                db.publish(`${msg.ip}:${msg.id}`, JSON.stringify({ type: msg.type, status: msg.status, name, id, ip, file: msg.file }));
                break;
            }

            case 'offer':
            case 'answer': {
                // Offer/Answer WebRTC handshake

                db.publish(`${msg.ip}:${msg.id}`, JSON.stringify({ type: msg.type, id, ip, data: msg.data }));
                break;
            }
        }
    });

    ws.on('close', async () => {
        // Get the IP room the client is in
        const room = await db.hgetall(ip);
        if (!room) return;
        // If the room is just them, delete it & return
        if (Object.keys(room).length === 1) return db.del(ip);

        // Notify other users in the room that this user has left
        db.publish(ip, JSON.stringify({ type: 'del-user', ip, id }));

        // Otherwise, remove the client from the room
        db.hdel(ip, id);
    });
});
