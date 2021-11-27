importScripts('indexedDB.js', 'example.js')

let ports = []
onconnect = function(e) {
  var port = e.ports[0];
  ports.push(port)
  console.log('hey', e)

  port.addEventListener('message', function(e) {
    // var workerResult = 'Result: ' + (e.data[0] * e.data[1]);
    port.postMessage(ports);
  });

  for(let port of ports){
  	port.postMessage(['new tab connected']);
  }
}