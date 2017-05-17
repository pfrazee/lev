/*
 *
 * repl.js
 * Responsible for adding custom commands to the REPL context.
 *
 */
var REPL = require('repl');
var print = require('./print');
var xtend = require('xtend');
var Tabulate = require('tabulate');
var minimist = require('minimist')
var prettyoutput = require('prettyoutput')

var tabulate = Tabulate(process.stdout);

var replcfg = {
  prompt: '/>',
  input: process.stdin,
  output: process.stdout,
  ignoreUndefined: true
};

module.exports = function(db, config, cache) {

  config.query = config.query || {};

  var repl = REPL.start(replcfg);

  repl.context.ls =
  repl.context.LS = function(opts) {

    var argv = minimist(opts.rest.split(' '))

    opts = xtend(config.query, opts, argv);

    opts.keys = true
    opts.values = !!opts.values || opts.v

    if (opts._[0]) {
      opts.start = '!' + opts._[0] + '!'
      opts.end = '!' + opts._[0] + '!\xff'
    }

    cache.invalidate();
    cache.regenerate(db, opts, function(err) {
      if (err) {
        print(null, err);
      }
      if (cache.data.length > 0) {
        var data = cache.data
        if (opts.values) {
          data = cache.data.map(entry => ({
            key: entry.key,
            value: tryParse(entry.value)
          }))
        }
        process.stdout.write(prettyoutput(data))
      }
      else {
        print(null, 'no keys');
      }
      repl.displayPrompt();
    });
  };

  repl.context.get =
  repl.context.GET = function(opts, callback) {

    if (!opts) {
      return undefined;
    }

    callback = callback || print;
    key = opts.rest || opts;

    db.get(key, function() {
      callback.apply(this, arguments);
      repl.displayPrompt();
    });
  };

  repl.context.put =
  repl.context.PUT = function(opts, callback) {

    var args = opts.rest.split(/\s+/);
    var key = args[0];
    args.shift();
    var val = args.join(' ');

    if (!val || !key) {
      return 'key and value required';
    }

    if (config.keyEncoding == 'json')  {
      try {
        key = JSON.parse(key);
      }
      catch(ex) {
        return print(null, ex);
      }
    }

    if (!config.valueEncoding ||
        config.valueEncoding == 'json')  {
      try {
        val = JSON.parse(val);
      }
      catch(ex) {
        return print(null, ex);
      }
    }

    callback = callback || print;

    db.put(key, val, function() {
      cache.data.push(key);
      callback.apply(this, arguments);
      repl.displayPrompt();
    });
  };

  repl.context.rm =
  repl.context.del =
  repl.context.RM =
  repl.context.DEL = function(opts, callback) {

    callback = callback || print;
    var key = opts;

    if (opts.rest) {
      key = opts.rest;
    }

    db.del(key, function(err) {
      cache.data.splice(cache.data.indexOf(key), 1);
      callback.apply(this, arguments);
      repl.displayPrompt();
    });
  };

  repl.context.start =
  repl.context.START = function(opts) {
    config.query.start = opts.rest;
    console.log('SET START %s', config.query.start);
    repl.displayPrompt();
  };

  repl.context.gt =
  repl.context.GT = function(opts) {
    delete config.query.gte;
    config.query.gt = opts.rest;
    console.log('SET GT %s', config.query.gt);
    repl.displayPrompt();
  };

  repl.context.gte =
  repl.context.GTE = function(opts) {
    delete config.query.gt;
    config.query.gte = opts.rest;
    console.log('SET GTE %s', config.query.gte);
    repl.displayPrompt();
  };

  repl.context.lt =
  repl.context.LT = function(opts) {
    delete config.query.lte;
    config.query.lt = opts.rest;
    console.log('SET LT %s', config.query.lt);
    repl.displayPrompt();
  };

  repl.context.lte =
  repl.context.LTE = function(opts) {
    delete config.query.lt;
    config.query.lt = opts.rest;
    console.log('SET LTE %s', config.query.lte);
    repl.displayPrompt();
  };

  repl.context.end =
  repl.context.END = function(opts) {
    config.query.end = opts.rest;
    console.log('SET END %s', config.query.end);
    repl.displayPrompt();
  };

  repl.context.subs =
  repl.context.SUBS = function(opts) {
    var subs = {}
    db.createKeyStream()
      .on('data', key => {
        key = key.split('!')
        subs[key[1]] = true
      })
      .on('end', () => {
        Object.keys(subs).forEach(sub => console.log(sub))
        repl.displayPrompt();
      })
  };

  repl.context.sub =
  repl.context.SUB = function(opts) {
    if (!opts.rest) {
      config.query.start = config.query.end = ''
    } else {
      config.query.start = '!' + opts.rest + '!';
      config.query.end = '!' + opts.rest + '!\xff';
    }
    console.log('SET START %s', config.query.start);
    console.log('SET END %s', config.query.end);
    repl.displayPrompt();
  };

  repl.context.limit =
  repl.context.LIMIT = function(opts) {
    config.query.limit = Number(opts.rest || -1);
    console.log('SET LIMIT %s', config.query.limit);
    repl.displayPrompt();
  };

  repl.context.rev =
  repl.context.REV = function(opts) {
    config.query.reverse = !config.query.reverse;
    console.log('SET REVERSE %s', config.query.reverse);
    repl.displayPrompt();
  };

  onLine = repl.rli._onLine;
  var methods = Object.keys(repl.context);

  repl.rli._onLine = function(data) {

    var line = data.trim().split(' ');
    var method = line.splice(0, 1)[0];

    if (methods.indexOf(method) > -1) {

      repl.rli.emit('record', data);
      repl.context[method]({
        rest: line.join(' ')
      })
      return undefined;
    }
    return onLine.apply(repl.rli, arguments);
  };

  return repl;
};

function tryParse (str) {
  try { return JSON.parse(str) }
  catch (e) { return str }
}
