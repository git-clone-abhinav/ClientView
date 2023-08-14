Vue.component('client-card', {
  props: ['client'],
  template: `
    <div class="card dark">
      <img :src="getImageSource(client.screenshot)" class="card-img-top">
      <div class="card-body p-1">
        <center>
          <h6 class="card-subtitle m-2 white-text">{{ client.username }}</h6>
        </center>
      </div>`,
  methods: {
    getImageSource(base64String) {
      return `data:image/png;base64, ${base64String}`;
    },
  }
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
        });
        this.socket.on('disconnect', () => {
          this.socket.emit('server-disconnect');
          console.log('Disconnected from server!');
        });
        this.socket.on('recieve-first-time-data', (data) => {
          console.log('Received first time data!');
          console.log("Updating value of clients");
          if (data === 0) {
            console.log('No clients connected');
            this.clients = [];
          } else {
            this.clients = data.clients;
          }

        });
        this.socket.on('user-screenshot', (data) => {
          console.log('Screenshot received for ' + this.clients[data.client].username + ":" + data.client + ", Updating value");
          this.clients[data.client] = data.data;
          console.log("Updated value of client", data.client, "to", data.data);
        });
        this.socket.on('client-disc-update', (data) => {
          console.log(data.client + ', ' + this.clients[data.client].username + ' gone offline');
          // remove client from clients dictionary
          this.$delete(this.clients, data.client);
        });
        
        this.socket.on('client-connect-update', (data) => {
          console.log(data.client + ', ' + data.data.username + ' came online');
          // add client to clients dictionary
          this.$set(this.clients, data.client, {
            username: data.data.username,
            screenshot: data.data.screenshot,
            location: data.data.location,
            timeout: data.data.timeout,
            thumbnail_mode: data.data.thumbnail_mode
          });
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
  }
});