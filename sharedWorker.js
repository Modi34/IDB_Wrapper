importScripts('indexedDB.js', 'example.js')

let ports = []
onconnect = function(e) {
  var port = e.ports[0];
  ports.push(port)
  console.log('connect', e)

  port.onmessage = function(e) {
  	console.log('message', e)
  	let {cmd, params} = e.data;
  	actions[cmd]?.(params, port)
  };
  port.start()

  for(let port of ports){
  	port.postMessage('new tab connected');
  }
}

const actions = {
	async get(params, port){
		let {table, range, key} = params;
		port.postMessage(
			await connection[ table ]?.get(range, key)
		)
	},
	set(params){
		let {table, data} = params;
		for(let record of data){
			connection[ table ]?.set( record )
		}
	},
	delete(params){
		let {table, id, key} = params
		connection[ table ]?.delete(id)
	}
}