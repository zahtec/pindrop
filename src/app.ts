import express from 'express';
import { readFileSync } from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createHash } from 'crypto';

type User = { name: string; device: string; ip: string; id?: string; socket?: WebSocket };

const PORT = process.env.PORT ?? 3000;

const first = ['Exploratory', 'Fuzzy', 'Hypothetical', 'Inventive', 'Pseudo', 'Cool', 'Icy', 'Inevitable', 'Innovative', 'Playful', 'Proud', 'Silly', 'Spirited', 'Spontaneous', 'Goofy', 'Gorgeous', 'Flying', 'Funny', 'Fantastic', 'Sad'];
const last = ['Bunny', 'Cat', 'Dog', 'Horse', 'Mouse', 'Pig', 'Rabbit', 'Turtle', 'Bird', 'Cow', 'Elephant', 'Fish', 'Lion', 'Monkey', 'Panda', 'Penguin', 'Raccoon', 'Sheep', 'Tiger', 'Zebra'];

// Base Schema: IP, Network
// IP Room Schema: ID, User
const db = new Map<String, Map<string, User>>();

const app = express();

app.disable('x-powered-by');

app.use(express.static('dist/public'));

app.get('/robots.txt', (_, res) => res.status(404).send());

app.get('/', (req, res) => {
    if (req.path !== '/') return res.redirect('/');
    res.sendFile('index.html', { root: 'dist/public' });
});

const server = app.listen(PORT, () => console.log(`Running on provided port ${PORT}`));

// Generate ID for user and if it exists in given IP Room, regen ID
const genIPID = (data: Map<string, User> | undefined): string => {
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return data && data.has(id) ? genIPID(data) : id;
};

// Generate ID for cross-network room
const genCNID = (): string => {
    const id = (Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6)).toUpperCase();
    return db.has(id) ? genCNID() : id;
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
    else if (info.includes('Linux')) return 'linux';

    return 'Unknown';
};

new WebSocketServer({
    path: '/',
    server: server
}).on('connection', (ws, req) => {
    // Created a hashed IP that may be reassigned to a cnid later on
    let ip = createHash('sha256').update(req.socket.remoteAddress!).digest('base64');
    // Generate ID for user and if it exists in given IP Room, regen ID
    const id = genIPID(db.get(ip));
    // Generate a random semantic name
    const name = `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
    // Get the device name based of off user agent
    const device = getDevice(req.headers['user-agent']);

    ws.on('message', e => {
        const msg = JSON.parse(e.toString());

        // Check if remote peer actually exists
        const getRemote = () => {
            const room = db.get(msg.ip ?? msg.cnid);
            if (!room) return false;
            const remote = room!.get(msg.id);
            if (!remote) return false;

            return remote;
        };

        switch (msg.type) {
            case 'init': {
                // Either create new IP Room or append user to existing IP Room. Or, if a join code was provided on the client side, join cross-network room
                // IP's in this context can be either cross-network room ID's or actual IP's

                // If IP/CN Room doesn't exist, create it. Otherwise append user to existing Room.
                const cnidRoom = db.get(msg.cnid);
                const ipRoom = db.get(ip);

                // If there is a code room, join it
                if (cnidRoom) {
                    // set users cnid to just joined room
                    ip = msg.cnid;

                    // Append user to existing cnid room with their IP as a cnid instead
                    cnidRoom.set(id, { name, device, ip, socket: ws });

                    // For each user in room, exchange user information
                    cnidRoom.forEach(({ socket, name: oname, device: odevice, ip: ocnid }, uid) => {
                        if (uid === id) return;
                        // send other user copy of just added user
                        socket!.send(JSON.stringify({ type: 'new-user', name, device, ip: msg.cnid, id }));
                        // send just added user copy of other user
                        ws.send(JSON.stringify({ type: 'new-user', name: oname, device: odevice, ip: ocnid, id: uid }));
                    });
                } else if (ipRoom) {
                    // Append user to existing IP room
                    ipRoom.set(id, { name, device, ip, socket: ws });

                    // For each user in room, exchange user information
                    ipRoom.forEach(({ socket, name: oname, device: odevice, ip: oip }, uid) => {
                        if (uid === id) return;
                        // send other user copy of just added user
                        socket!.send(JSON.stringify({ type: 'new-user', name, device, ip, id }));
                        // send just added user copy of other user
                        ws.send(JSON.stringify({ type: 'new-user', name: oname, device: odevice, ip: oip, id: uid }));
                    });
                } else {
                    // Create new IP Room with user that just connected
                    db.set(ip, new Map<string, User>([[id, { name, device, ip, socket: ws }]]));
                }

                // Send the user their own info, if they are in a cross-network room switch out their IP for the cross-network room ID
                ws.send(JSON.stringify({ type: 'init', name, cnid: cnidRoom && ip }));

                break;
            }

            case 'create': {
                // Create new cross-network room

                const room = db.get(ip);
                if (!room) return;

                if (room.size === 1) db.delete(ip);
                else {
                    // For each user in room, including the one who created the room, delete eachother
                    room.forEach(({ socket, ip: oip }, uid) => {
                        if (uid === id) return;
                        // tell other user this user is leaving
                        socket!.send(JSON.stringify({ type: 'del-user', ip, id }));
                        // tell this user other user is leaving
                        ws.send(JSON.stringify({ type: 'del-user', ip: oip, id: uid }));
                    });

                    // Remove this user
                    room.delete(id);
                }

                // Change users ip to a CNID
                ip = genCNID();

                db.set(ip, new Map<string, User>([[id, { name, device, ip, socket: ws }]]));
                ws.send(JSON.stringify({ type: 'create', ip }));
                break;
            }

            case 'verify': {
                // Verify user IP,ROOMCODE/ID exists

                getRemote() ? ws.send(JSON.stringify({ type: 'verify', status: 1, id: msg.id, ip: msg.ip })) : ws.send(JSON.stringify({ type: 'verify', status: 0, id: msg.id, ip: msg.ip }));
                break;
            }

            case 'confirm': {
                // Confirmation to accept file

                const remote = getRemote();
                if (!remote) return;
                remote.socket!.send(JSON.stringify({ type: msg.type, status: msg.status, name, id, ip, file: msg.file }));
                break;
            }

            case 'offer':
            case 'answer': {
                // Offer/Answer WebRTC handshake

                const remote = getRemote();
                if (!remote) return;
                remote.socket!.send(JSON.stringify({ type: msg.type, data: msg.data, id, ip }));
                break;
            }
        }
    });

    ws.on('close', () => {
        // Get the IP room the client is in
        const room = db.get(ip);
        if (!room) return;
        // If the room is just them, delete it & return
        if (room.size === 1) return db.delete(ip);

        // Otherwise, remove the client from the room
        room.delete(id);

        // For each user in room, send them a message containing the just removed user
        room.forEach(({ socket }) => socket!.send(JSON.stringify({ type: 'del-user', ip, id })));
    });
});
