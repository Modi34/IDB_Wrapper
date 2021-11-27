class DATA{
    constructor(name, structure, version = 1){
	this.checkRequired({name, structure})

	this.structure = structure;

	let scope = this;
	let openRequest = indexedDB.open(name, version);
	openRequest.onsuccess = result => {
	    this.DB = openRequest.result;
	    let tables = connection.DB.objectStoreNames;
	    for(let table of tables){
		this[table] = {
		    set: data => this.set(table, data),
		    get: (range, key) => this.get(table, range, key),
		    delete: id => this.delete(table, id)
		}
	    }
	}
	openRequest.onerror = error => console.error( error.target.errorCode )
	openRequest.onupgradeneeded = event => {
	    this.DB = event.currentTarget.result;
	    for(let table in structure){
		this.create(table, structure[table], true)
	    }
	}
    }

    create(name, structure, isUpgrade){
	this.checkRequired({name, structure})

	// this.checkRequired({name, structure})

	let store = this.DB.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
	for(let column in structure){
	    store.createIndex(column, column, { unique: !!structure[column].unique });
	}
    }

    promise(transaction){
	this.checkRequired({transaction})

	return new Promise( (resolve, reject) => {
	    transaction.onsuccess = event => {
		console.log(event)
		resolve( event.target.result || true )
	    }
	    transaction.onerror = event => {
		reject(event.target.error)
	    }
	})
    }

    // range = [from, to] || from
    get(table, range, key){
	var {range, isSingle, request} = this.transaction(table, range, key)
	request = request[isSingle & range ? 'get' : 'getAll'](range)

	return this.promise(request)
    }

    set(table, data){
	this.checkRequired({table, data})

	let structure = this.structure[table];
	for(let column in data){
	    if(!( column in structure )){
		throw 'column "' + column + '" does not exist in table structure'
	    }
	}
	for(let column in structure){
	    if(!( column in data )){
		let config = structure[column]
		if('default' in config){
		    data[column] = config.default
		}else if(config){ // ! add required status
		    throw 'column "' + column + '" is required'
		}
	    }
	}
	let transaction = this.DB
	    .transaction(table, 'readwrite', {durability: 'strict'})
	    .objectStore(table)
	    .add(data)
	return this.promise(transaction)
    }

    transaction(table, range, key, type = 'readonly'){
	this.checkRequired({table})

	let request = this.DB
	    .transaction(table, type, {durability: 'strict'})
	    .objectStore(table)

	if(key && type == 'readonly'){
	    if(!this.structure[table][key]){
		throw 'column "' + key + '" does not exist in table structure'
	    }
	    request = request.index(key)
	}

	console.log(key)
	let isSingle = (!key && range && !range.push) ||
			(key ? this.structure[table][key].unique : false);

	if(range){
	    range = (range && range.push) ?
		IDBKeyRange.bound(range[0], range[1]) :
		IDBKeyRange.only(range)
	}

	return {range, isSingle, request}
    }

    delete(table, id){
	var {range, isSingle, request} = this.transaction(table, id, false, 'readwrite')
	request = request[isSingle ? 'delete' : 'deleteIndex'](range)
	return this.promise(request)
    }

    last(startFrom, sortBy, isForward){

    }

    subscribe(table){

    }

    checkRequired(values){
	for(let key in values){
	    if(!values[key]){ throw 'parameter "' + key + '" is required' }
	}
    }
}