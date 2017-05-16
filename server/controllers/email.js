var nodemailer = require('nodemailer');
var bluebird = require("bluebird");

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://'+process.env.GMAIL_USER.replace("@","%40")+':'+process.env.GMAIL_PASS.replace("@","%40")+'@smtp.gmail.com');

// setup e-mail data with unicode symbols
var mailOptions = {
    from: '"Milvus" <contact@milvus.com>', // sender address
    to: '', // list of receivers
    subject: 'Hello ✔', // Subject line
    html: '' // html body
};

bluebird.promisifyAll(transporter);

exports.sendEmail = (email,token) => {
	mailOptions.to = email;
	mailOptions.html = "Hi, please <b>verify</b> your email clicking this link: <br/><br/><br/><br/> <a href=\"\">"+process.env.URL+"/verify/"+token+"</a>";
	return transporter.sendMailAsync(mailOptions);
}

exports.resetPassword = (email,token) => {
	mailOptions.to = email;
	mailOptions.html = "Bonjour, veuillez cliquer ici pour définir un nouveau mot de passe: <br/><br/><br/><br/> <a href=\"\">"+process.env.URL+"/reset?token="+token+"</a>";
	return transporter.sendMailAsync(mailOptions);
}