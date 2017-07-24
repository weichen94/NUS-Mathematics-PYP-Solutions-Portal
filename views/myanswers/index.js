"use strict";

exports.find = function(req, res, next){
  req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 100;
  req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;

  var filters = {author_id: req.user._id};
  if (req.query.details) {
    filters.details = new RegExp('^.*?'+ req.query.details +'.*$', 'i');
  }

  req.app.db.models.Answer.pagedFind({
    filters: filters,
    keys: 'module_code _year_sem author author_id question_number details mainimage date',
    limit: req.query.limit,
    page: req.query.page,
    sort: {
      "date": -1
    }
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      results.filters = req.query;
      res.send(results);
    }
    else {
      results.filters = req.query;
      res.render('myanswers/index', {
        data: results.data
      });
    }
  });
};

exports.edit = function(req, res, next) {
  req.app.db.models.Answer.findById(req.params.id).exec(function(err, answer){
    if(err) {
      return next(err);
    }

    if(req.xhr){
      res.send(answer);
    } else {
      res.render('myanswers/edit', {
        answer: answer
      });
    }
  });
};

exports.update = function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
      if(!req.body.question_number) {
        workflow.outcome.errors.push('Please enter a question number');
        return workflow.emit('response');
      }
      if(!req.body.details) {
        workflow.outcome.errors.push('Please enter some details');
        return workflow.emit('response');
      }

      workflow.emit('updateAnswer');
  });

  workflow.on('updateAnswer', function() {

    var fieldsToSet = {
      module_code: req.body.module_code,
      _year_sem: req.body._year_sem,
      author: req.body.author,
      author_id: req.body.author_id,
      question_number: req.body.question_number,
      details: req.body.details
    };

    console.log(fieldsToSet);
    req.app.db.models.Answer.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, answer){
      if(err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = answer;
      req.flash('success', 'answer updated');
      res.location('/myanswers');
      res.redirect('/myanswers');
    });
  });
    workflow.emit('validate');
};

exports.delete = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if(req.params.imageid != "noimage") {
      var filepath = './public/images/' + req.params.imageid;
      req.app.fs.unlink(filepath, function(err) {
        if(err){
          return workflow.emit('exception', err);
        }
      });
    }

    workflow.emit('deleteAnswer_my');
  });

  workflow.on('deleteAnswer_my', function(){
    req.app.db.models.Answer.findByIdAndRemove(req.params.id, function(err){
      if(err){
        return workflow.emit('exception', err);
      }
        req.flash('success', 'Answer Deleted!');
        res.location('/myanswers/');
        res.redirect('/myanswers/');
    });
  });
  workflow.emit('validate');
};
