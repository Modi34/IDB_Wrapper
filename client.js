var dbWorker = new SharedWorker('./sharedWorker.js?4');
dbWorker.port.onmessage = e=>{console.log(e)}
dbWorker.port.onerror = e=>{console.log(e)}
console.log(dbWorker)
dbWorker.port.start();
dbWorker.port.postMessage('hey')