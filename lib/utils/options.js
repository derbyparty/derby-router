var errors = require('./errors');
var util = require('./util');

exports.handleRoute = function(args){
  var opts = handleOptions(args);

  handleMethod(args, opts);

  handleNamePath(args, opts);
  handleNamePath(args, opts);

  handleAction(args, opts);

  if (!opts.name && !opts.path) {
    throw new Error(errors['noNamePath']);
  }

  if (!opts.name) {
    opts.name = util.pathToName(opts.path);
  }

  if (!opts.path) {
    opts.path = util.nameToPath(opts.name);
  }

  return opts;
};

exports.handlePathFor = function(args){
  var opts = handleOptions(args);

  handleNamePath(args, opts);

  return opts;
};

function handleOptions(args){

  var opts, lastParam = args[args.length-1];

  if (util.isPlainObject(lastParam)){
    opts = lastParam;
    args.pop();
  } else {
    opts = {};
  }

  return opts;
}

function handleMethod(args, opts){
  opts.method = args.shift();
}

function handleNamePath(args, opts){
  var param;

  if (args.length !== 0) {
    if (typeof args[0] === 'string') {
      param = args.shift();

      if (util.isPath(param)) {
        opts.path = param;
      } else {
        opts.name = param;
      }
    }
  }

}

function handleAction(args, opts){
  opts.fns = [].concat(args);
}


