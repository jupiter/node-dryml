var dryml = require('..');
  
dryml.cache = true;
dryml.root = __dirname + '/views';
dryml.encodeEntities = true;

var i = 100;

var startedAt = new Date();
console.log('Started...');

function renderNext() {  
  dryml.renderView('benchmark', { locals: { i: i } }, function(err, buffer) {    
    if (i == 0) return process.nextTick(completed);
    
    process.nextTick(renderNext);
    
    i--;
  });  
}

function completed() {
  var endedAt = new Date();
  console.log('Done:' + (endedAt - startedAt) + 'ms');
}

renderNext();