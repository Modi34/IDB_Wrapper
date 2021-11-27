var dbWorker = new SharedWorker('./sharedWorker.js');
dbWorker.port.onmessage = e=>{
	if(!e.isTrusted){return}
	console.log(e.data)
}
dbWorker.port.onerror = e=>{console.log(e)}

setTimeout(e=>{
	/*
	dbWorker.port.postMessage({cmd: 'set', 
		params: {
			table: 'tasks',
			data: [{
				title: 'hey',
				isFinished: true,
				date: -1
			}]
		}
	})
	*/
	/*
	dbWorker.port.postMessage({
		cmd: 'get',
		params:{
			table: 'tasks',
			range: 5
		}
	})
	*/
	/*
	dbWorker.port.postMessage({
		cmd: 'delete',
		params:{
			table: 'tasks',
			id: 4
		}
	})
	*/
},100)
