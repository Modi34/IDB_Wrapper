// {required: true, default: null, unique: false}
// ? add type check
// * add Date type
let connection = new DATA('mydb', {
    tasks: {
	title: {default: ''},
	isFinished: {default: 0},
	date: {}
    },
    calendar: {
	date: {},
	title: {unique: true},
	note: {}
    }
});