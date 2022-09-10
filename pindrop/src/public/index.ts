import Icons from './icons.js';
import QR from './qr.js';
import Zip from './zip.js';

// PWA service worker
navigator.serviceWorker.register('sw.js', { type: 'module' });

let connections: Connection[] = [];
const code = new URLSearchParams(window.location.search).get('code');
const ws = new WebSocket(`wss://${window.location.host}`);
const usersWrap = document.getElementById('users') as HTMLDivElement;
const blur = document.getElementById('blur') as HTMLDivElement;
const createButton = document.querySelector('#create-wrap > button') as HTMLButtonElement;
const menu = document.getElementById('menu') as HTMLDivElement;

// Used for keeping track if focus is on anything
let isFocused = false;

// Used for keeping track of the current valid cross-network room code
let roomCode = '';

type WSMessage = { type: string; status?: number; cnid?: string; data: RTCSessionDescriptionInit; device?: string; name?: string; id?: string; ip?: string; file?: string };

// Update UI if cross-network code is present
const updateCode = () => {
    const text = menu.children[3].children[0].children[0] as HTMLParagraphElement;
    const qr = menu.children[2] as HTMLImageElement;
    text.classList.add('opacity-0');
    setTimeout(async () => {
        text.innerText = window.location.href;
        qr.src = await QR.toDataURL(window.location.href, { errorCorrectionLevel: 'L', color: { light: '#0000', dark: '#fff' }, type: 'image/webp', width: 350, margin: 0 });
        text.classList.remove('opacity-0');
        qr.classList.remove('opacity-0');
    }, 300);
};

// Event listener for copying code to clipboard
document.getElementById('copy')!.addEventListener('click', () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(window.location.href);
});

// Leave room
document.getElementById('leave')!.addEventListener('click', () => {
    menu.classList.remove('open');
    createButton.parentElement!.classList.remove('open');
    setTimeout(() => (window.location.href = `https://${window.location.host}`), 300);
});

createButton.addEventListener('click', () => {
    const has = menu.classList.contains('open');
    (menu.children[4] as HTMLButtonElement).tabIndex = has ? -1 : 0;
    (menu.children[3].children[1] as HTMLButtonElement).tabIndex = has ? -1 : 0;
    (menu.children[5] as HTMLAnchorElement).tabIndex = has ? -1 : 0;
    menu.classList.toggle('open');
    createButton.parentElement!.classList.toggle('open');

    // Send message to server requestig to make a room, if already in a room, do nothing
    if (!roomCode) ws.send(JSON.stringify({ type: 'create' }));
});

const focus = (user: HTMLDivElement, fileName: string, type: string) => {
    isFocused = true;
    user.classList.add(type, 'z-40');
    (user.children[0] as HTMLLabelElement).tabIndex = -1;
    blur.classList.add('active');
    user.parentElement!.classList.add('overflow-hidden');
    user.parentElement!.scrollTo({ top: user.offsetTop - user.clientHeight, behavior: 'smooth' });

    const status = type === 'focus-send';

    (user.children[status ? 1 : 2].children[1].children[0] as HTMLButtonElement).tabIndex = 0;
    (user.children[status ? 1 : 2].children[1].children[1] as HTMLButtonElement).tabIndex = 0;

    const name = user.children[status ? 1 : 2].children[0] as HTMLParagraphElement;

    name.innerText = name.innerText.replace('{FILE}', fileName.length > 20 ? `${fileName.slice(0, 20)}...` : fileName);
};

const unFocus = (user: HTMLDivElement, type: string) => {
    isFocused = false;
    user.classList.remove(type);
    (user.children[0] as HTMLLabelElement).tabIndex = 0;
    (user.children[1].children[1].children[0] as HTMLButtonElement).tabIndex = -1;
    (user.children[1].children[1].children[1] as HTMLButtonElement).tabIndex = -1;
    (user.children[2].children[1].children[0] as HTMLButtonElement).tabIndex = -1;
    (user.children[2].children[1].children[1] as HTMLButtonElement).tabIndex = -1;
    blur.classList.remove('active');
    user.parentElement!.classList.remove('overflow-hidden');
    setTimeout(() => {
        if (isFocused) return;
        user.classList.remove('z-40');
    }, 500);
};

// connect to remote peer
const startConnection = (id: string, ip: string): Promise<RTCDataChannel> | undefined => {
    // Check if conenction already exists, if not, first verify IP & ID
    if (connections.find(c => c.id === id && c.ip === ip)) return;
    ws.send(JSON.stringify({ type: 'verify', id, ip }));

    return new Promise((resolve, reject) => {
        // Check if IP and ID match in database to prevent arbitrary false instances being made
        const verification = (e: MessageEvent) => {
            const msg: WSMessage = JSON.parse(e.data);

            // Make sure this is the correct verification message for us
            if (!(msg.type === 'verify' && msg.id === id && msg.ip === ip)) return;
            if (!msg.status!) reject();
            const newConnection = new Connection(msg.id!, msg.ip!);
            connections.push(newConnection);

            // Once verification response has been received, remove listener
            ws.removeEventListener('message', verification);

            // create data channel and resolve once datachannel has been opened
            newConnection.connectFrom(resolve);
        };

        // listen for verification response
        ws.addEventListener('message', verification);
    });
};

class Connection {
    rtc: RTCPeerConnection;
    dc?: RTCDataChannel;
    buffer: ArrayBuffer[];
    state: 'offer' | 'answer';
    id: string;
    ip: string;

    constructor(id: string, ip: string) {
        this.rtc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: ['stun:stun.l.google.com:19302', 'stun:stun2.l.google.com:19302']
                }
            ]
        });
        this.state = 'offer';
        this.id = id;
        this.ip = ip;
        this.buffer = [];

        // Find all ice candidates then send offer. If we do it without all ice candidates the connection will fail
        this.rtc.onicecandidate = e => {
            if (this.rtc.iceGatheringState === 'complete' || !e.candidate) {
                ws.send(JSON.stringify({ type: this.state, data: this.rtc.localDescription, id: this.id, ip: this.ip }));
            }
        };

        // When a data channel is opened automatically set dc to it
        this.rtc.ondatachannel = e => {
            this.dc = e.channel;

            this.message();
        };
    }

    // call on outgoing conenction
    async connectFrom(func: (v: RTCDataChannel) => void) {
        this.dc = this.rtc.createDataChannel('data');

        this.message();

        this.dc!.onopen = () => {
            func(this.dc!);
        };

        await this.getOffer();
    }

    // call on incoming connection
    async connectTo(offer: RTCSessionDescriptionInit) {
        this.state = 'answer';
        await this.rtc.setRemoteDescription(offer);
        await this.getAnswer();
    }

    async getOffer() {
        await this.rtc.createOffer().then(offer => this.rtc.setLocalDescription(offer));
    }

    async getAnswer() {
        await this.rtc.createAnswer().then(answer => this.rtc.setLocalDescription(answer));
    }

    async setAnswer(answer: RTCSessionDescriptionInit) {
        await this.rtc.setRemoteDescription(answer);
    }

    message() {
        let stage = 0;
        let info: [string, number];

        // Reference to current elements
        const user = document.getElementById(`${this.ip}:${this.id}`) as HTMLLabelElement;
        const fileSelect = user.querySelector('input') as HTMLInputElement;
        const progressBar = user.children[0].children[1].children[1] as HTMLDivElement;

        this.dc!.onmessage = async ({ data }) => {
            if (data === 'done') return;

            switch (stage) {
                // Receive file info (init message)
                case 0: {
                    // Split init message 0 is filename, 1 is chunk amount
                    const split = data.split(':');
                    info = [split[0], Number.parseInt(split[1])];

                    // Show progress bar
                    progressBar.classList.remove('opacity-0');

                    // Change name back to normal
                    const name = user.children[0].children[2] as HTMLParagraphElement;
                    name.innerText = name.innerText.split('.')[0].split('to ')[1];
                    break;
                }

                // Check if buffer is file size, if yes, send confirmation message and download
                case info[1]: {
                    // Add last chunk to buffer
                    this.buffer.push(data);

                    // Send done message so peer can re-enable file sending
                    this.dc!.send('done');

                    // download and reset all information for next file
                    this.download(info[0] as string);
                    info = ['', 0];
                    stage = 0;
                    user.children[0].classList.remove('cursor-auto');
                    fileSelect.disabled = false;
                    fileSelect.value = '';
                    progressBar.classList.add('opacity-0');
                    setTimeout(() => progressBar.style.setProperty('--percent', '0'), 300);

                    return;
                }

                // Default, receive a chunk
                default: {
                    // Append buffer to Uint8Array by keeping track of byte length and setting the offset to all previous bytelengths combined
                    this.buffer.push(data);

                    // Update progress bar
                    progressBar.style.setProperty('--percent', Math.round((stage / info[1]) * 100).toString());
                }
            }

            stage++;
        };
    }

    download(filename: string) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(this.buffer!));
        a.download = filename;
        a.click();

        this.buffer = [];
    }
}

const upload = (fileSelect: HTMLInputElement, user: HTMLDivElement, msg: WSMessage, f?: FileList) => {
    let file = fileSelect.files![0] ?? f?.item(0);
    const label = user.children[0] as HTMLLabelElement;
    const progressBar = label.children[1].children[1] as HTMLDivElement;
    const name = label.children[2] as HTMLHeadingElement;

    // Schema is popup message, pos button, neg button
    const sendPopup = [user.children[1].children[0], user.children[1].children[1].children[0], user.children[1].children[1].children[1]] as [HTMLParagraphElement, HTMLButtonElement, HTMLButtonElement];

    if (!file) return;

    // Reset popup text
    sendPopup[0].innerText = `Are you sure you want to send "{FILE}" to ${msg.name}?`;

    // Send Confirmation
    focus(user, fileSelect.files!.length > 1 ? 'pindrop-files.zip' : file.name, 'focus-send');
    fileSelect.disabled = true;

    // Check for user confirmation, if cancel, revert animaions and cancel
    new Promise((resolve, reject) => {
        sendPopup[1].addEventListener('click', resolve, { once: true });
        sendPopup[2].addEventListener('click', reject, { once: true });
    })
        .then(async () => {
            // If user confirms, ask other user for confirmation

            // revert animations
            unFocus(user, 'focus-send');
            label.classList.add('cursor-auto');
            label.tabIndex = -1;

            // If there is more than 1 file, zip it and change the file variable
            if ((fileSelect.files && fileSelect.files!.length > 1) || (f && f.length > 1)) {
                // let user know files are zipping
                name.innerText = 'Zipping files...';
                progressBar.style.setProperty('--percent', '50');
                progressBar.classList.remove('opacity-0');

                const zip = new Zip();

                Array.from((fileSelect.files ?? f)!).forEach(async file => zip.file(file.name, file));

                const result = await zip.generateAsync({ type: 'blob' });

                progressBar.style.setProperty('--percent', '100');
                progressBar.classList.add('opacity-0');
                file = new File([result], 'pindrop-files.zip');
            }

            name.innerText = `Waiting for ${msg.name} to accept...`;

            ws.send(JSON.stringify({ type: 'confirm', id: msg.id, ip: msg.ip, file: file.name }));

            // Ask other user for confirmation
            new Promise((resolve, reject) => {
                const confirmation = (e: MessageEvent) => {
                    const message: WSMessage = JSON.parse(e.data);

                    // Make sure its meant for this event listener
                    if (!(message.type === 'confirm' && message.id === msg.id && message.ip === msg.ip)) return;

                    ws.removeEventListener('message', confirmation);

                    if (!message.status) reject();
                    else resolve(undefined);
                };

                ws.addEventListener('message', confirmation);
            })
                .then(async () => {
                    // Start connection

                    const existing = connections.find(c => c.id === msg.id && c.ip === msg.ip);

                    // Set name to indicate connection
                    name.innerText = `Connecting to ${msg.name}...`;

                    // Find existing connection, otherwise start connection with peer, if peer isnt verified or no existing connection was found return
                    const dc = existing ? existing.dc : await startConnection(msg.id!, msg.ip!);
                    if (!dc) return;

                    // Set name back to normal
                    name.innerText = msg.name!;

                    // start send

                    // Get amount of chunks file has been split up into and track them
                    const chunks = Math.ceil(file.size / 250000);
                    const reader = new FileReader();
                    let chunk = 0;

                    // Chunk generator
                    async function* readChunks() {
                        while (chunk < chunks) {
                            reader.readAsArrayBuffer(file.slice(chunk * 250000, (chunk + 1) * 250000));

                            // Wait for file to read
                            await new Promise(resolve => (reader.onload = resolve));

                            yield reader.result;

                            chunk++;
                        }
                    }

                    // Read chunks of file
                    const data = readChunks();

                    // Each time the buffer amount is low enough, send the next chunk
                    const sender = async () => {
                        const chunkData = (await data.next()).value as ArrayBuffer;

                        // Once all chunks have been sent, stop event listener and wait for a confirmation message
                        if (!chunkData) {
                            dc!.removeEventListener('bufferedamountlow', sender);
                            return;
                        }

                        // Update progress status
                        progressBar.style.setProperty('--percent', Math.round((chunk / chunks) * 100).toString());

                        dc.send(chunkData);
                    };

                    // Send first chunk with name and file size
                    dc!.send(`${file.name}:${chunks}`);

                    // Add event listener to repeatadly send chunks once the buffer is free
                    dc!.addEventListener('bufferedamountlow', sender);

                    // Check for a confirmation message to allow other files to be sent
                    const confirmation = ({ data }: MessageEvent) => {
                        if (data !== 'done') return;
                        dc!.removeEventListener('message', confirmation);
                        fileSelect.disabled = false;
                        fileSelect.value = '';
                        label.classList.remove('cursor-auto');
                        label.tabIndex = 0;
                        progressBar.classList.add('opacity-0');
                        setTimeout(() => progressBar.style.setProperty('--percent', '0'), 300);
                    };

                    dc!.addEventListener('message', confirmation);

                    // show progress bar
                    progressBar.classList.remove('opacity-0');

                    sender();
                })
                .catch(() => {
                    // If other user declines, revert animations and cancel
                    name.innerText = `${msg.name} Declined`;
                    fileSelect.value = '';

                    // reset file select, but dont re-enable it if you got a decline message from someone sending a file at the same time. We check this by checking if the progress bar is active after getting a decline message
                    if (progressBar.style.getPropertyValue('--color') !== '#72eb54') {
                        fileSelect.disabled = false;
                        label.classList.remove('cursor-auto');
                        label.tabIndex = 0;
                        setTimeout(() => {
                            name.innerText = msg.name!;
                        }, 1000);
                    } else {
                        setTimeout(() => {
                            name.innerText = `${msg.name} is pending approval...`;
                        }, 1000);
                    }
                });
        })
        .catch(() => {
            // If user cancels, revert animations and cancel
            unFocus(user, 'focus-send');

            label.classList.remove('cursor-auto');
            label.tabIndex = 0;

            // reset file select
            fileSelect.disabled = false;
            fileSelect.value = '';
        });
};

ws.onmessage = e => {
    const msg: WSMessage = JSON.parse(e.data);

    switch (msg.type) {
        case 'init': {
            const name = document.getElementById('name') as HTMLDivElement;
            name.classList.add('opacity-0');
            setTimeout(() => {
                name.innerText = `You are now discoverable as ${msg.name!}`;
                name.classList.remove('opacity-0');
            }, 300);

            // If a code was provided in the URL, but its not valid, remove it. Otherwise if it is valid, set it
            if (code) {
                if (!msg.cnid) window.history.replaceState({}, '', window.location.origin);
                else {
                    roomCode = code;
                    updateCode();
                }
            }
            break;
        }

        case 'new-user': {
            if (document.getElementById(`${msg.ip}:${msg.id}`)) return;
            usersWrap.insertAdjacentHTML(
                'beforeend',
                `<div id="${msg.ip}:${msg.id}" class="h-40 w-full mb-10 md:mb-5 flex items-center md:items-start flex-col duration-500 transition-user opacity-0 translate-y-3 relative overflow-hidden">
                    <label class="flex items-center flex-col md:flex-row cursor-pointer mt-2 md:ml-[33%]" tabindex="0">
                        <input type="file" class="hidden" multiple>
                        <div class="relative">
                            <div class="bg-accent-light dark:bg-accent text-white p-4 rounded-xl drop-shadow-lg w-min">
                                ${Icons[msg.device!]}
                            </div>
                            <div class="progress absolute opacity-0 transition-opacity duration-300 -top-2 -left-2 -right-2 -bottom-2 rounded-2xl -z-10"></div>
                        </div>
                        <h1 class="mt-4 text-center md:ml-6 md:mt-0">${msg.name}</h1>
                    </label>
                    <div class="text-center absolute md:justify-center md:flex md:flex-col md:h-full top-40 md:top-12 opacity-0 duration-500 transition-tropacity pointer-events-none md:ml-[33%]">
                        <p class="px-4">Are you sure you want to send "{FILE}" to ${msg.name}?</p>
                        <div class="text-white md:flex">
                            <button class="flex justify-center items-center p-4 rounded-md bg-blue w-48 mt-8 mx-auto md:h-12 md:mt-4" tabindex="-1">Send</button>
                            <button class="flex justify-center items-center p-4 rounded-md bg-accent-light dark:bg-accent w-48 mt-4 mx-auto md:h-12 md:ml-4" tabindex="-1">Cancel</button>
                        </div>
                    </div>
                    <div class="text-center absolute md:justify-center md:flex md:flex-col md:h-full top-40 md:top-12 opacity-0 duration-500 transition-tropacity pointer-events-none md:ml-[33%]">
                        <p class="px-4">${msg.name} wants to send you "{FILE}"</p>
                        <div class="text-white md:flex">
                            <button class="flex justify-center items-center p-4 rounded-md bg-blue w-48 mt-8 mx-auto md:h-12 md:mt-4" tabindex="-1">Accept</button>
                            <button class="flex justify-center items-center p-4 rounded-md bg-accent-light dark:bg-accent w-48 mt-4 mx-auto md:h-12 md:ml-4" tabindex="-1">Decline</button>
                        </div>
                    </div>
                </div>`
            );
            const user = document.getElementById(`${msg.ip}:${msg.id}`) as HTMLDivElement;
            const fileSelect = user.querySelector('input') as HTMLInputElement;
            const label = user.children[0] as HTMLLabelElement;
            const progressBar = label.children[1].children[1] as HTMLDivElement;

            // Add event listener for accesibility
            label.addEventListener('keydown', e => (e.key === 'Enter' ? label.click() : undefined));

            // when the user clicks the label and selects a file, this event fires
            fileSelect.addEventListener('change', () => upload(fileSelect, user, msg));

            // drag and drop
            user.addEventListener('dragover', e => e.preventDefault());

            // use a counter to prevent event bubbling from occuring
            let bubble = 0;

            // Drag and drop event listeners
            user.addEventListener('dragenter', () => {
                e.preventDefault();
                bubble++;
                if (fileSelect.disabled || bubble > 1) return;
                progressBar.classList.remove('opacity-0');
                progressBar.style.setProperty('--percent', '100');
            });

            user.addEventListener('dragleave', () => {
                e.preventDefault();
                bubble--;
                if (fileSelect.disabled || bubble) return;
                progressBar.classList.add('opacity-0');
                setTimeout(() => {
                    // check if hover is occuring again as to not change percent weirdly
                    if (!progressBar.classList.contains('opacity-0')) return;
                    progressBar.style.setProperty('--percent', '0');
                }, 300);
            });

            user.addEventListener('drop', e => {
                e.preventDefault();
                bubble = 0;
                if (fileSelect.disabled || !e.dataTransfer || !e.dataTransfer.files.length) return;
                progressBar.classList.add('opacity-0');
                progressBar.style.setProperty('--percent', '0');
                upload(fileSelect, user, msg, e.dataTransfer.files);
            });

            setTimeout(() => {
                // New user animation
                user.classList.remove('opacity-0');
                user.classList.remove('translate-y-3');
            }, 1);
            break;
        }

        case 'del-user': {
            // If user disconnectes, remove all current animations on them and close the connection
            const connection = connections.find(c => c.id === msg.id && c.ip === msg.ip);
            if (connection) {
                connection.rtc.close();
                connections = connections.filter(c => c.id !== msg.id && c.ip !== msg.ip);
            }

            const user = document.getElementById(`${msg.ip}:${msg.id}`) as HTMLLabelElement;
            user.classList.add('h-0', 'mb-0', 'md:mb-0', 'opacity-0');
            if (user.classList.contains('focus-send') || user.classList.contains('focus-recieve')) blur.classList.remove('active');
            user.classList.remove('focus-send');
            user.parentElement!.classList.remove('overflow-hidden');
            setTimeout(() => {
                user.remove();
            }, 500);
            break;
        }

        // incoming connection
        case 'offer': {
            if (connections.find(c => c.id === msg.id! && c.ip === msg.ip!)) return;
            const connection = new Connection(msg.id!, msg.ip!);
            connections.push(connection);
            connection.connectTo(msg.data!);
            break;
        }

        case 'answer': {
            const connection = connections.find(c => c.id === msg.id! && c.ip === msg.ip);
            if (!connection) return;
            connection.setAnswer(msg.data!);
            break;
        }

        case 'confirm': {
            // if it has a status, it was a confirmation response, not request, so ignore it
            if (msg.status !== undefined) return;

            const user = document.getElementById(`${msg.ip}:${msg.id}`) as HTMLDivElement;
            const fileSelect = user.querySelector('input') as HTMLInputElement;
            const label = user.children[0] as HTMLLabelElement;
            const name = label.children[2] as HTMLHeadingElement;
            const progressBar = label.children[1].children[1] as HTMLDivElement;

            // Schema is popup message, pos button, neg button
            const confirmPopup = [user.children[2].children[0], user.children[2].children[1].children[0], user.children[2].children[1].children[1]] as [HTMLParagraphElement, HTMLButtonElement, HTMLButtonElement];

            // Reset popup text
            confirmPopup[0].innerText = `${msg.name} wants to send you "{FILE}"`;

            // check If user already has this person focused, if so, wait until theyre unfocused
            new Promise((resolve, reject) => {
                if (user.classList.contains('focus-send')) {
                    new MutationObserver(() => {
                        if (user.classList.contains('focus-send')) return;
                        // Check if user has sent a file or not, to prevent double file sending, if yes, then send a confirmation code of 0 (declined)
                        if (fileSelect.files!.length !== 0) reject();
                        else resolve(undefined);
                    }).observe(user, { attributes: true });
                } else resolve(undefined);
            })
                .then(() => {
                    const revertAnimations = () => {
                        unFocus(user, 'focus-receive');
                        progressBar.style.setProperty('--percent', '0');
                        progressBar.style.setProperty('--color', '#38acff');
                        name.innerText = msg.name!;
                    };

                    // Disable file select, but make it clear its clickable
                    fileSelect.disabled = true;
                    label.classList.remove('cursor-auto');
                    label.tabIndex = 0;

                    // Change users name to indicate they are receiving a file
                    name.innerText = `${msg.name} is pending approval...`;

                    // Change progress bar to green
                    progressBar.style.setProperty('--percent', '100');
                    progressBar.style.setProperty('--color', '#72eb54');
                    progressBar.classList.remove('opacity-0');

                    // Wait for user to click on other user asking for approval
                    setTimeout(() => {
                        user.addEventListener(
                            'click',
                            () => {
                                // Confirmation to accept file
                                focus(user, msg.file!, 'focus-receive');

                                // Check for user confirmation, if cancel, revert animaions and cancel
                                new Promise((resolve, reject) => {
                                    confirmPopup[1].addEventListener('click', resolve, { once: true });
                                    confirmPopup[2].addEventListener('click', reject, { once: true });
                                })
                                    .then(() => {
                                        revertAnimations();
                                        label.classList.add('cursor-auto');
                                        label.tabIndex = -1;
                                        name.innerText = `Connecting to ${msg.name}...`;
                                        ws.send(JSON.stringify({ type: 'confirm', status: 1, id: msg.id, ip: msg.ip }));
                                    })
                                    .catch(() => {
                                        revertAnimations();
                                        fileSelect.disabled = false;
                                        ws.send(JSON.stringify({ type: 'confirm', status: 0, id: msg.id, ip: msg.ip }));
                                    });
                            },
                            { once: true }
                        );
                    }, 1);
                })
                .catch(() => ws.send(JSON.stringify({ type: 'confirm', status: 0, id: msg.id, ip: msg.ip })));
            break;
        }

        case 'create': {
            roomCode = msg.ip!;

            window.history.replaceState({}, '', `${window.location.origin}/?code=${roomCode}`);

            updateCode();
        }
    }
};

// Interval ID for clearing on close
let intID: NodeJS.Timer;

// Send init message to server and start heartbeat
ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'init', cnid: code }));

    intID = setInterval(() => ws.send(JSON.stringify({ type: 'heartbeat' })), 5000);
};

// Cleanup once an erorr occurs of the websocket is close
const cleanup = () => {
    createButton.disabled = true;

    const name = document.getElementById('name') as HTMLDivElement;
    name.classList.add('opacity-0');

    usersWrap.classList.add('opacity-0');

    setTimeout(() => {
        usersWrap.innerHTML = '';
    }, 300);

    setTimeout(() => {
        name.innerText = 'You are offline, please connect to the internet';
        name.classList.remove('opacity-0');
    }, 300);

    intID && clearInterval(intID);
};

// On offline/close
ws.onerror = cleanup;
ws.onclose = cleanup;
