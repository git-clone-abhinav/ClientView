Vue.component('client-card', {
  props: ['client'],
  methods: {
    getImageSource(base64String) {
      return `data:image/png;base64, ${base64String}`;
    }  ,
    openEnlarged() {
      const enlargedWindow = window.open('', 'enlargedWindow', 'width=1200,height=800');
      enlargedWindow.document.write(`
        <html>
          <head>
            <title>${this.client.username}</title>
            <style>
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: #000;
              }
              img {
                max-width: 100%;
                max-height: 100vh;
              }
            </style>
          </head>
          <body>
            <img src="${this.getImageSource(this.client.screenshot)}" />
          </body>
        </html>
      `);
    },
  },
  template: `
    <div class="card dark" @click="openEnlarged">
      <img :src="getImageSource(client.screenshot)" class="card-img-top">
      <div class="card-body p-1">
        <center>
          <h6 class="card-subtitle m-2 white-text">{{ client.username }}</h6>
        </center>
      </div>
    </div>
  `
});





var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue! ',
    socket: null,
    clients: []
  },
  methods: {
    reverseMessage() {
      this.message = this.message.split('').reverse().join('');
    },
    connectSocket() {
      const serverHost = '192.168.1.72'; // Replace with your server host
      const serverPort = 5000; // Replace with your server port

      console.log('Connecting to server...');

      try {
        this.socket = io.connect(`http://${serverHost}:${serverPort}`);
        this.socket.on('connect', () => {
          this.socket.emit('server-connect');
          console.log('Connected to server!');
          new Noty({
            text: 'Connected to Backend Server!',
            type: 'success',
            timeout: 3000,
            progressBar: true,
            layout: 'topRight', // Notification position
          }).show();
        });
        this.socket.on('disconnect', () => {
          this.socket.emit('server-disconnect');
          console.log('Disconnected from server!');
          new Noty({
            text: 'Disconnected from Backend Server!',
            type: 'error',
            timeout: 3000,
            progressBar: true,
            layout: 'topRight', // Notification position
          }).show();
        });
        this.socket.on('recieve-first-time-data', (data) => {
          console.log('Received first time data!');
          console.log("Updating value of clients");
          if (data === 0) {
            console.log('No clients connected');
            new Noty({
              text: 'No Clients Connected!',
              type: 'info',
              timeout: 3000,
              progressBar: true,
              layout: 'topRight', // Notification position
            }).show();
            this.clients = [];
          } else {
            this.clients = data.clients;
          }

        });
        this.socket.on('user-screenshot', (data) => {
          console.log('Screenshot received for ' + this.clients[data.client].username + ":" + data.client + ", Updating value");
          this.clients[data.client] = data.data;
          new Noty({
            text: 'Screenshot received for ' + this.clients[data.client].username ,
            type: 'alert',
            timeout: 1000,
            progressBar: true,
            layout: 'bottomRight', // Notification position
          }).show();
          console.log("Updated value of client", data.client, "to", data.data);
        });
        this.socket.on('client-disc-update', (data) => {
          console.log(data.client + ', ' + this.clients[data.client].username + ' gone offline');
          new Noty({
            text: data.client + ', ' + this.clients[data.client].username + ' went offline',
            type: 'warning',
            timeout: 3000,
            progressBar: true,
            layout: 'topRight', // Notification position
          }).show();
          // remove client from clients dictionary
          delete this.clients[data.client];

        });
        this.socket.on('client-connect-update', (data) => {
          console.log(data.data.username + ' came online');
          new Noty({
            text: data.data.username + ' came online',
            type: 'success',
            timeout: 3000,
            progressBar: true,
            layout: 'topRight', // Notification position
          }).show();s
          // add client to clients dictionary
          this.clients[data.client] = {};
          this.clients[data.client].username = data.data.username;
          this.clients[data.client].screenshot = data.data.screenshot;
          this.clients[data.client].location = data.data.location;
          this.clients[data.client].timeout = data.data.timeout;
          this.clients[data.client].thumbnail_mode = data.data.thumbnail_mode;
        });
      } catch (err) {
        console.log(err.message);
      }
    }
  },
  created() {
    this.connectSocket()
  },
  beforeDestroy() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  },
  computed: {
    sortedClients() {
      // Sort the clients array by usernames
      return Object.values(this.clients).sort((a, b) => {
        const numericPartA = parseInt(a.username.slice(4), 10);
        const numericPartB = parseInt(b.username.slice(4), 10);
        return numericPartA - numericPartB;
      });
    }
  },
});