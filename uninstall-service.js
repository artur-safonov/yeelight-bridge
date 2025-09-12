const Service = require('node-windows').Service;

const svc = new Service({
  name: 'Yeelight Bridge Server',
  script: require('path').join(__dirname, 'server.js')
});

svc.on('uninstall', function(){
  console.log('Yeelight Bridge Server service uninstalled!');
});

svc.uninstall();
