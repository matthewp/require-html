var path = require('path');
var fs = require('fs');
var cheerio = require('cheerio');
var vm = require('vm');

var forEach = Array.prototype.forEach;

class Require {
  constructor(base, inst, type) {
    this.base = base;
    this.dir = path.dirname(base);
    this.inst = inst;
    this.type = type || 'html';
  }

  resolveLinks($, pth) {
    var links = $('link[rel=import]');

    forEach.call(links, link => {
      var href = $(link).attr('href');
      new Require(pth, this.inst).require(href);
    });
  }

  resolveScripts($, pth) {
    var scripts = $('script');

    forEach.call(scripts, script => {
      script = $(script);

      var href = script.attr('src');
      if(href) {
        new Require(pth, this.inst, 'js').require(href);
      } else {
        for(let resolver of this.inst.resolvers) {
          if(resolver.test(pth) && resolver.resolve) {
            vm.runInThisContext(script.text());
          }
        }
      }
    })
  }

  require(rel) {
    var pth = path.join(this.dir, rel);

    var value;
    if((value = this.inst.lookup(pth))) {
      return value;
    }

    var src;
    for(let resolver of this.inst.resolvers) {
      if(resolver.test(pth)) {
        if(resolver.ignore) {
          value = {};
          this.inst.save(pth, value);
          return value;
        }
        if(resolver.fetch) {
          src = resolver.fetch(pth);
        }
      }

      if(src) {
        break;
      }
    }

    if(!src) {
      throw new Error('Unable to lookup', pth);
    }

    if(this.type === 'html') {
      var $ = cheerio.load(src);

      this.resolveLinks($, pth);
      this.resolveScripts($, pth);
    } else {
      for(let resolver of this.inst.resolvers) {
        if(resolver.test(pth) && resolver.resolve) {
          value = resolver.resolve(pth, src);
          break;
        }
      }
    }

    if(!value && global.module) {
      value = global.module.exports || {};
    }

    this.inst.save(pth, value);
    return value;
  }
}

class RequireHtml {
  constructor() {
    this.store = {};
    this.resolvers = [];

    this.makeRequire = this.makeRequire.bind(this);
    this.makeRequire.addResolver = this.addResolver.bind(this);
    this.makeRequire.ignore = this.ignore.bind(this);

    this.addResolver({
      test: () => true,
      fetch(pth){
        return fs.readFileSync(pth, 'utf8');
      },
      resolve(pth, src){
        vm.runInThisContext(src);
        var res = {};
        if(global.module) {
          res = global.module.exports;
          global.module.exports = {};
        }
        return res;
      }
    });
  }

  makeRequire({ filename }) {
    var req = new Require(filename, this);
    return req.require.bind(req);
  }

  lookup(pth) {
    return this.store[pth];
  }

  save(pth, value) {
    this.store[pth] = value;
  }

  addResolver(resolver) {
    if(resolver.test instanceof RegExp) {
      var exp = resolver.test;
      resolver.test = function(p){
        return exp.test(p);
      };
    }

    this.resolvers.unshift(resolver);
  }

  ignore(ignores) {
    ignores.forEach(exp => {
      this.addResolver({
        test: exp,
        ignore: true
      });
    });
  }
}

module.exports = new RequireHtml().makeRequire;
module.exports.RequireHtml = RequireHtml;
