const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'Yeelight Bridge Server',
  description: 'Yeelight Bridge Server for SignalRGB',
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [
    '--max_old_space_size=4096'
  ]
});

svc.on('install', function(){
  svc.start();
  console.log('Yeelight Bridge Server service installed and started!');
});

svc.install();
