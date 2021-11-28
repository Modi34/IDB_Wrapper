importScripts('indexedDB.js', 'example.js')

let ports = []
onconnect = function(e) {
	if(!e.isTrusted){return}
	var port = e.ports[0];
	ports.push( port )
	console.log('connect', e)

	port.onmessage = function(e) {
		if(!e.isTrusted){return}
		console.log('message', e)
		let {cmd, params} = e.data;
		actions[ cmd ]?.(params, port)
	};
	port.start()

	notifyAllClients({type: 'create'})
}

const actions = {
	async get(params, port){
		let {table, range, key} = params;
		port.postMessage({type: 'get', record:
			await connection[ table ]?.get(range, key)
		})
	},
	async set(params){
		let {table, data, range, column} = params;
		await connection[ table ]?.set( data, range, column )
		notifyAllClients({type: 'set', table, range, data})
	},
	async delete(params){
		let {table, range} = params
		await connection[ table ]?.delete( range )
		notifyAllClients({type: 'delete', table, range})
	}
}

function notifyAllClients(message){
	for(let port of ports){
		port.postMessage( message )
	}
}