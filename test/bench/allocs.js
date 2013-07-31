var _ = require('underscore');

var BenchMark = require('benchmark');
var suite = new BenchMark.Suite();

var MyAllocatedClass = function MyClass() {
  this.arr = [];
}
MyAllocatedClass.prototype.push = function(val){
  this.arr.push(val);
}

var MyUnallocatedClass = function MyClass() {
  this.arr = null;
}
MyUnallocatedClass.prototype.push = function(val) {
  (this.arr || (this.arr = [])).push(val);
}

suite
.add('Pre-allocated', function() {
  var a = new MyAllocatedClass(),
      b = new MyAllocatedClass(),
      c = new MyAllocatedClass(),
      d = new MyAllocatedClass(),
      e = new MyAllocatedClass();

  c.push('value 1');
  c.push('value 2');
  c.push('value 3');
  c.push('value 4');
})
.add('Lazy', function() {
  var a = new MyUnallocatedClass(),
      b = new MyUnallocatedClass(),
      c = new MyUnallocatedClass(),
      d = new MyUnallocatedClass(),
      e = new MyUnallocatedClass();

  c.push('value 1');
  c.push('value 2');
  c.push('value 3');
  c.push('value 4');
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));  
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
// run async
.run();
