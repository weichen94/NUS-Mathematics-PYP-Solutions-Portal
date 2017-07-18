'use strict';

exports = module.exports = function(app, mongoose) {
  var moduleSchema = new mongoose.Schema({
    pivot: { type: String, default: '' },
    module_name: { type: String, required:true},
    module_code: {type: String, required: true},
    is_active: {type: Boolean, required: true, default: true},
    description: {type: String},
    active_semesters: {type: Array, default: []}
  });
  moduleSchema.plugin(require('./plugins/pagedFind'));
  moduleSchema.index({ pivot: 1 });
  moduleSchema.index({ module_name: 1 });
  moduleSchema.index({ module_code: 1 });
  moduleSchema.index({ search: 1 });
  moduleSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Module', moduleSchema);
};
