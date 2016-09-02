var assert = require('assert');
var RequireHtml = require("../index").RequireHtml;

describe('basics', function(){
  before(function(){
    var req = new RequireHtml().makeRequire;
    req.addResolver({
      test: /bad/,
      resolve: function(pth, src){
        return {};
      }
    });
    this.require = req(module);
  })

  it('works', function(){
    var widget = this.require('./tests/basics/widget.html');

    assert.equal(widget.foo, 'bar');
    assert.equal(widget.yay, 'it worked');
  });
});

describe('ignore', function(){
  before(function(){
    var req = new RequireHtml().makeRequire;
    req.ignore([
      /foo\.js/
    ]);
    this.require = req(module);
  });

  it('doesn\'t try to require an ignored file', function(){
    var exp = this.require('./foo\.js');
    assert.equal(Object.keys(exp).length, 0);
  });
});
