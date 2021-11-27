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
    get(table, range, column){
    	this.checkRequired({table, range})

    	let transaction = this.transaction( table )[range[0] ? 'getAll':'get']( this.range( range[0] || range, range[1] ) )
    	if(column){
    		this.checkColumn(this.structure[ table ], column)
		transaction = transaction.index( column )
    	}
	return this.promise( transaction )
    }

    set(table, data){
	this.checkRequired({table, data})

	data = this.checkStructure(table, data)
	return this.promise( this.transaction(table, true).add( data ) )
    }
    delete = (table, id) => table&& id&& this.promise( this.transaction(table, true).delete( this.range(id) ) )

    transaction = (table, isRW) => this.DB.transaction(table, isRW ? 'readwrite' : 'readonly' , {durability: 'strict'}).objectStore( table )
    range = (range_from, range_to) => range_to ? IDBKeyRange.bound(range_from, range_to) : IDBKeyRange.only(range_from)

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
	for(let column in structure){
		if(!(column in data)){
			data[ column ] = this.setDefaults(column, structure[ column ])
		}
	}
	return data
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