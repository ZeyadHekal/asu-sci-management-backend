import * as bcrypt from 'bcrypt';
bcrypt.genSalt().then((salt) => {
	console.log(salt);
});
