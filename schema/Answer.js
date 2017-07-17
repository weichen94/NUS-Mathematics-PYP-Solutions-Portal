'use strict';

exports = module.exports = function(app, mongoose) {
  var answerSchema = new mongoose.Schema({
    pivot: { type: String, default: '' },
    module_code: {type: String, required: true},
    _year_sem: {type: String, require: true},
    author: { type: String, required:true},
    author_id: {type: String, required: true},
    question_number: {type: String, required: true},
    details: {type: String, require: true},
    date: {type: Date, default: Date.now}
  });
  answerSchema.plugin(require('./plugins/pagedFind'));
  answerSchema.index({ pivot: 1 });
  answerSchema.index({ module_code: 1 });
  answerSchema.index({ _year_sem: 1 });
  answerSchema.index({ author: 1 });
  answerSchema.index({ author_id: 1 });
  answerSchema.index({ question_number: 1 });
  answerSchema.index({ date: 1 });
  answerSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Answer', answerSchema);
};
