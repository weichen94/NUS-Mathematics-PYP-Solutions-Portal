'use strict';

exports.init = function(req, res){
  res.render('contact/index', {
    recaptchaKey: req.app.get('recaptcha-key')
  });
};

exports.sendMessage = function(req, res){
  var workflow = req.app.utility.workflow(req, res);
  var Recaptcha = require('re-captcha');
  var recaptcha = new Recaptcha(req.app.get('recaptcha-key'), req.app.get('recaptcha-secret'));

  workflow.on('validateRecaptcha', function() {
    var data = {
      remoteip:  req.connection.remoteAddress,
      challenge: req.body.recaptcha_challenge_field,
      response:  req.body.recaptcha_response_field
    };

    recaptcha.verify(data, function(err) {
      if (err) {
        workflow.outcome.errfor.recaptcha = 'failed';
        return workflow.emit('response');
      }
      else {
        workflow.emit('validate');
      }
    });
  });

  workflow.on('validate', function() {
    if (!req.body.name) {
      workflow.outcome.errfor.name = 'required';
    }

    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
    }

    if (!req.body.message) {
      workflow.outcome.errfor.message = 'required';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('sendEmail');
  });

  workflow.on('sendEmail', function() {
    req.app.utility.sendmail(req, res, {
      from: req.app.get('smtp-from-name') +' <'+ req.app.get('smtp-from-address') +'>',
      replyTo: req.body.email,
      to: req.app.get('system-email'),
      subject: req.app.get('project-name') +' contact form',
      textPath: 'contact/email-text',
      htmlPath: 'contact/email-html',
      locals: {
        name: req.body.name,
        email: req.body.email,
        message: req.body.message,
        projectName: req.app.get('project-name')
      },
      success: function(message) {
        workflow.emit('response');
      },
      error: function(err) {
        workflow.outcome.errors.push('Error Sending: '+ err);
        workflow.emit('response');
      }
    });
  });

  workflow.emit('validateRecaptcha');
};
