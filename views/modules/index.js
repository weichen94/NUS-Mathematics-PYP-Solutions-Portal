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
    keys: 'module_code module_name level description is_active active_semesters',
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
      res.render('modules/index', { data: results.data});
    }
  });
};

exports.add = function(req, res){
  if(!req.isAuthenticated()){
    req.flash('error', 'You are not logged in!');
    res.location('/');
    res.redirect('/');
  }
  if(!req.user.roles.admin){
    req.flash('error', 'You are not Admin!');
    res.location('/');
    res.redirect('/');
  }
  res.render('modules/add');
};

exports.create = function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
      if(!req.body.module_code) {
        workflow.outcome.errors.push('Please enter a module code');
        return workflow.emit('response');
      }
      if(!req.body.module_name) {
        workflow.outcome.errors.push('Please enter a module name');
        return workflow.emit('response');
      }

      workflow.emit('createModule');
  });

  workflow.on('createModule', function() {
    var actives_sems = req.body.active_semesters.split(',');

    var fieldsToSet = {
      module_code: req.body.module_code,
      module_name: req.body.module_name,
      level: req.body.level,
      description: req.body.description,
      is_active: req.body.is_active,
      active_semesters: actives_sems
    };

    req.app.db.models.Module.create(fieldsToSet, function(err, Module){
      if(err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = module;
      req.flash('success', 'Module Added');
      res.location('/modules');
      res.redirect('/modules');
    });
  });
    workflow.emit('validate');
};

exports.edit = function(req, res, next) {
  if(!req.user.roles.admin){
    req.flash('error', 'You are not Admin!');
    res.location('/');
    res.redirect('/');
  }
  req.app.db.models.Module.findById(req.params.id).exec(function(err, module){
    if(err) {
      return next(err);
    }

    if(req.xhr){
      res.send(module);
    } else {
      res.render('modules/edit', {module: module});
    }
  });
};

exports.update = function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
      if(!req.body.module_code) {
        workflow.outcome.errors.push('Please enter a module code');
        return workflow.emit('response');
      }
      if(!req.body.module_name) {
        workflow.outcome.errors.push('Please enter a module code');
        return workflow.emit('response');
      }

      workflow.emit('updateModule');
  });

  workflow.on('updateModule', function() {
    var actives_sems = req.body.active_semesters.split(',');

    var fieldsToSet = {
      module_code: req.body.module_code,
      module_name: req.body.module_name,
      level: req.body.level,
      description: req.body.description,
      is_active: req.body.is_active,
      active_semesters: actives_sems
    };
    req.app.db.models.Module.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, module){
      if(err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = module;
      req.flash('success', 'Module Updated');
      res.location('/modules');
      res.redirect('/modules');
    });
  });
    workflow.emit('validate');
};

exports.delete = function(req, res){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    workflow.emit('deleteModule');
  });

  workflow.on('deleteModule', function(){
    req.app.db.models.Module.findOneAndRemove({_id: req.params.id}, function(err){
      if(err){
        return workflow.emit('exception', err);
      }
        req.flash('success', 'Module Deleted!');
        res.redirect('/modules/');
    });
  });
  workflow.emit('validate');
};
