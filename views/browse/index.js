'use strict';

exports.find = function(req, res, next){
  req.query.module_name = req.query.module_name ? req.query.module_name : '';
  req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 50;
  req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
  req.query.sort = req.query.sort ? req.query.sort : 'module_code';

  var filters = {};
  if (req.query.module_name) {
    filters.module_name = new RegExp('^.*?'+ req.query.module_name +'.*$', 'i');
  }

  req.app.db.models.Module.pagedFind({
    filters: filters,
    keys: 'module_code module_name is_active active_semesters',
    limit: req.query.limit,
    page: req.query.page,
    sort: req.query.sort
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
      res.render('browse/index', { data: results.data});
    }
  });
};

exports.init = function(req, res, next){
  req.query.module_name = req.query.module_name ? req.query.module_name : '';
  req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 50;
  req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
  req.query.sort = req.query.sort ? req.query.sort : 'module_code';

  var filters = {module_code: req.params.module_code};
  if (req.query.module_name) {
    filters.module_name = new RegExp('^.*?'+ req.query.module_name +'.*$', 'i');
  }

  req.app.db.models.Module.pagedFind({
    filters: filters,
    keys: 'module_code module_name description is_active active_semesters',
    limit: req.query.limit,
    page: req.query.page,
    sort: req.query.sort
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
      res.render('browse/module_details', {
        data: results.data,
        module_code: req.params.module_code
      });
    }
  });
};

exports.answers = function(req, res, next){
  req.query.module_code = req.query.module_code ? req.query.module_code : '';
  req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 50;
  req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
  req.query.sort = req.query.sort ? req.query.sort : 'question_number';

  var filters = {module_code: req.params.module_code, _year_sem: req.params._year_sem};
  if (req.query.module_code) {
    filters.module_code = new RegExp('^.*?'+ req.query.module_code +'.*$', 'i');
  }

  req.app.db.models.Answer.pagedFind({
    filters: filters,
    keys: 'module_code _year_sem author author_id question_number details mainimage date',
    limit: req.query.limit,
    page: req.query.page,
    sort: req.query.sort
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
      if (req.user) {
        var user_id = req.user._id;
        results.filters = req.query;
        res.render('browse/answer', {
          module_code: req.params.module_code,
          _year_sem: req.params._year_sem,
          data: results.data,
          user_id: user_id
        });
      } else {
        res.render('browse/answer', {
          module_code: req.params.module_code,
          _year_sem: req.params._year_sem,
          data: results.data
        });
      }
    }
  });
};


exports.create = function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
      if(!req.body.question_number) {
        workflow.outcome.errors.push('Please enter a question number');
        return workflow.emit('response');
      }
      if(!req.body.details) {
        workflow.outcome.errors.push('Do not submit an empty answer');
        return workflow.emit('response');
      }

      workflow.emit('createAnswer');
  });

  workflow.on('createAnswer', function() {
    var mainimage;
    if(req.file){
      mainimage = req.file.filename;
    } else {
      mainimage = "noimage";
    }

    var fieldsToSet = {
      module_code: req.params.module_code,
      _year_sem: req.params._year_sem,
      author: req.user.username,
      author_id: req.user._id,
      question_number: req.body.question_number,
      details: req.body.details,
      mainimage: mainimage
    };

    req.app.db.models.Answer.create(fieldsToSet, function(err, answer){
      if(err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = answer;
      req.flash('success', 'Answer Added');
      res.location('/browse/' + req.params.module_code + '/' + req.params._year_sem);
      res.redirect('/browse/' + req.params.module_code + '/' + req.params._year_sem);
    });
  });
    workflow.emit('validate');
};

exports.answer_edit = function(req, res, next) {
  req.app.db.models.Answer.findById(req.params.id).exec(function(err, answer){
    if(err) {
      return next(err);
    }

    if(req.xhr){
      res.send(answer);
    } else {
      res.render('browse/edit', {
        answer: answer
      });
    }
  });
};

exports.answer_update = function(req, res, next) {
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
      module_code: req.params.module_code,
      _year_sem: req.params._year_sem,
      author: req.user.username,
      author_id: req.user._id,
      question_number: req.body.question_number,
      details: req.body.details
    };

    req.app.db.models.Answer.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, answer){
      if(err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = answer;
      req.flash('success', 'answer updated');
      res.location('/browse/' + req.params.module_code + '/' + req.params._year_sem);
      res.redirect('/browse/' + req.params.module_code + '/' + req.params._year_sem);
    });
  });
    workflow.emit('validate');
};

exports.answer_delete = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if(req.params.imageid != "noimage") {
      var filepath = './public/images/' + req.params.imageid;
      req.app.fs.unlink(filepath, function(err) {
        if(err){
          return workflow.emit('exception', err);
        }

        workflow.emit('deleteAnswer_browse');
      });
    }
  });

  workflow.on('deleteAnswer_browse', function(){
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
