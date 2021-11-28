class DATA{
    constructor(name, structure, version = 1){
	this.checkRequired({name, structure})

	this.structure = structure;

	let openRequest = indexedDB.open(name, version);
	openRequest.onsuccess = result => {
	    this.DB = openRequest.result;
	    let tables = connection.DB.objectStoreNames;
	    for(let table of tables){
		this[table] = {
		    set: (data, range, column) => this.set(table, data, range, column),
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

	let store = this.DB.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
	for(let column in structure){
	    store.createIndex(column, column, { unique: !!structure[column].unique });
	}
    }

    promise(transaction){
	this.checkRequired({transaction})

	return new Promise( (resolve, reject) => {
	    transaction.onsuccess = event => {
		resolve( event.target.result || true )
	    }
	    transaction.onerror = event => {
		reject(event.target.error)
	    }
	})
    }

    // range = [from, to] || from
    get(table, range, column, transaction = this.transaction( table )){
    	this.checkRequired({table, range})

    	transaction = transaction.getAll( this.range(range) )
    	if( column&& this.checkColumn(this.structure[ table ], column) ){
		transaction = transaction.index( column )
    	}
	return this.promise( transaction )
    }

    async set(table, data, range, column){
	this.checkRequired({table, data})
	let transaction = this.transaction(table, true)

	if(range){ // update existing
		this.checkStructure(table, data)
		let records = await this.get(table, range, column, transaction);

		for(let record of records){
			for(let column in data){
				record[ column ] = data[ column ]
			}
			this.promise( transaction.put( record ) )
		}
	}else{ // create new
		for(let record of data){
			let structure = this.checkStructure(table, record)
			for(let column in structure){
				if(!(column in record)){
					record[ column ] = this.setDefaults(column, structure[ column ])
				}
			}
			await this.promise( transaction.add( record ) )
		}
	}
	return true
    }

    delete(table, range){
    	this.checkRequired({table, range})
    	return this.promise( this.transaction(table, true).delete( this.range(range) ) )
    }

    transaction = (table, isRW) => this.DB.transaction(table, isRW ? 'readwrite' : 'readonly' , {durability: 'strict'}).objectStore( table )
    range = range => range[0] ? IDBKeyRange.bound(range[0], range[1]) : IDBKeyRange.only(range)

    checkRequired(values){
	for(let key in values){
	    if(!values[key]){ throw 'parameter "' + key + '" is required' }
	}
    }
    checkStructure(table, data){
    	let structure = this.structure[table];
	for(let column in data){
	    this.checkColumn(structure, column)
	}
	return structure
    }
    checkColumn(structure, column){
    	if(!( column in structure )){
		throw 'column "' + column + '" does not exist in table structure'
	}
	return structure[ column ]
    }
    setDefaults(column, config){
    	let result = false
    	if('default' in config){
		result = config.default
	}else if(config.type == 'date'){
		result = new Date().getTime()
	}else if(config.required){
		throw 'column "' + column + '" is required'
	}
	return result
    }
}