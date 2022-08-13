# PinDrop

PinDrop allows you to securely share files with either devices on your network, or people on the internet. It has no size limit and is completely free to use. It also has an option to self-host it using Docker with Caddy as a load balancing reverse proxy.

PinDrop uses webRTC to acheive a peer to peer connection which allows the file transfer to be done without server handling, PinDrop however does not have any TURN servers, meaning that if anyone is behind a symmetric NAT, PinDrop isn't an option.

[https://pindrop.zahtec.com](https://pindrop.zahtec.com)

## 🥪 Tech Stack

PinDrop utilizes the following technologies:

-   [WebRTC](https://webrtc.org)
-   [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
-   [Express.js](https://expressjs.com)
-   [PWA](https://web.dev/progressive-web-apps)
-   [Caddy](https://caddyserver.com/)
-   [Docker](https://docker.com)

## 🚀 Usage

If the devices you wish to connect are within the same network, simply go to [https://pindrop.zahtec.com](https://pindrop.zahtec.com) on both devices and tap on the device icons to select a file, if you are using a cross-network room then click/tap the plus in the top right and share the link that includes the code with others.

Before a webRTC connection is made, to protect peers IP addresses and respect privacy, PinDrop will not initialize a peer to peer connection until both users have confirmed they wish to do the file transfer, simply being in the same room as someone will not expose your information to them.

## 💻 Self hosting using Docker

First, clone this repo by running

```sh
git clone https://github.com/zahtec/pindrop
```

and then change directories to wherever you have cloned it to.

PinDrop uses [Caddy](https://caddyserver.com/) as a reverse proxy to load balance between 2 containers both running PinDrop and to have proper HTTP/2 and HTTPS support. If you don't want to have 2 consecutive servers, please go to the [❌ Disabling load balancing](#-disabling-load-balancing) section. If you wish to do the exact opposite, checkout [💫 Increasing the PinDrop container count](#-increasing-the-pindrop-container-count). Otherwise, you might want to do a bit of configuration first so that your computer will recognize Caddy's SSL certificate.

Some might want to host PinDrop on their own domain, if that's you, please go to the [⛓ Hosting PinDrop on your own domain](#-hosting-pindrop-on-your-own-domain) section.

Firstly, go to `pindrop/Dockerfile` and comment out this `ENV` line for now

```dockerfile
# Remove the NODE_ENV variable for getting the CA Certificate
# ENV NODE_ENV production
```

then, spin up the server by going back to the root directory in your terminal, and running

```sh
./deploy.sh
```

If you get a permissions error, make sure this script has permissions to run

```sh
chmod +x ./deploy.sh
```

Then, once Docker has finished deploying and running the proper crates including Caddy, Redis, and PinDrop. You should be able to navigate to `https://localhost/cert`, if you see a HTTPS certificate invalid error, dont worry and just click continue, that's what we're fixing. Once you navigate here it will download Caddy's certificate file for HTTPS, this also allows it to be a PWA.

You must now install this certificate and have your preferred browser honor it, there is many different ways you can do this and it depends on the browser and platform, so I wont put it all in this readme, just remember if you are using FireFox then the certificate registry is built into the browser and isn't based off of your OS.

After installing your the certificate succesfully, you probably want to disable that certificate download. Simply just uncomment the line you commented out in the `Dockerfile` earlier

```dockerfile
# Remove the NODE_ENV variable for getting the CA Certificate
ENV NODE_ENV production
```

Now you can run the deploy script again and you should be good to go locally. If you want to host PinDrop on your own domain on the other hand, that's a bit different.

## ⛓ Hosting PinDrop on your own domain

PinDrop is able to be hosted on whatever domain you would like, as long as you have a server with docker to run it. SSL is easy too, since Caddy takes care of most of the work for us.

To get started, simply go to root directory and edit the `Caddyfile`

```py
# Change this to your domain/local address
localhost {
    encode gzip
    reverse_proxy pindrop:8080 {
        header_down Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    }
}
```

The comments make it pretty self explanitory, but just change localhost to your domain and point whatever DNS provider you are using to your servers IP address, should be good to go from there. With this route there is no need to uncomment that enviorment variable like we did earlier.

Although, some people might not want 2 instances of PinDrop running for load balancing, good thing that's easy to disable.

## ❌ Disabling load balancing

Disabling load balancing is very simple, just edit the `docker-compose.yml` in the root directory and change the deploy section under PinDrop

```yml
# -- snip --
pindrop:
    image: pindrop
    build: ./pindrop
    deploy: # Delete line
        mode: replicated # Delete line
        replicas: 2 # Delete line
    restart: unless-stopped
    volumes:
        - caddy_data:/data
    depends_on:
        - redis
# -- snip --
```

Docker makes this yml quite semantic and pretty easy to understand.

Now we'll discuss the opposite, increasing the container amount.

## 💫 Increasing the PinDrop container count

Increasing the count is insanely simple, edit the docker-compose.yml` in the root directory and change the deploy section under PinDrop

```yml
# -- snip --
pindrop:
    image: pindrop
    build: ./pindrop
    deploy:
        mode: replicated
        replicas: 2 # Change this to the number of containers
    restart: unless-stopped
    volumes:
        - caddy_data:/data
    depends_on:
        - redis
# -- snip --
```

Thanks to Docker's networking, we can make as many containers as we want and caddy will automatically be able to load balance between them by just using the container name `pindrop`.

## 📢 Contributing/Issues

Currently I do not have a format for PR's and/or issues. If you would like contribute or report an issues, please do.
