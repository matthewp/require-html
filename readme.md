# requirehtml

Allows you to require HTML files in Node. Implements the HTML Imports algorithm.

```html
<script>
module = { exports: {} };
</script>
<script>
(function() {
  class Foo {
    constructor() {
      console.log('You got a foo');
    }
  }

  module.exports = Foo;
})();
</script>
```

```js
var requireHTML = require('requirehtml')(module);

var Foo = requireHTML("./foo.html");

new Foo(); // -> "You got a foo"
```

## Install

```
npm install requirehtml --save
```

## API

### makeRequire(module)

To make a requirer function provide the module as the starting point.

```js
var makeRequire = require("requirehtml");
var requireHTML = makeRequire(module);
```

## License 

BSD 2-Clause
