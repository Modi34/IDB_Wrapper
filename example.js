let connection = new DATA('mydb', {
    tasks: {
	title: {default: ''},
	isFinished: {default: 0},
	created: {type: 'date'}
    },
    calendar: {
	created: {type: 'date'},
	title: {unique: true},
	note: {required: true}
    }
});