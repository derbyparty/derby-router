var Route = require('./Route');
var Module = require('./Module');

var options = require('./utils/options');
var util = require('./utils/util');

var Router = function(app, options){
  this.options = options || {};

  this.app = app;

  this.routes = {};
  this.modules = {};

  app._router = this;

  app.route = this.route.bind(this);
  app.module = this.module.bind(this);
  app.proto.pathFor = this.pathFor.bind(this);
  app.go = this.go.bind(this);
};

Router.prototype.route = function(){
  var args = Array.prototype.slice.call(arguments, 0);
  var opts = options.handleRoute(args);
//  console.log('Router.prototype.route', opts);
  new Route(this, opts);
};

Router.prototype.module = function(name, moduleObj){
  new Module(this, name, moduleObj);
};


Router.prototype.pathFor = function(name, opts){
  var args = Array.prototype.slice.call(arguments, 0);
};

Router.prototype.go = function(name, opts){
  var args = Array.prototype.slice.call(arguments, 0);
};


module.exports = Router;