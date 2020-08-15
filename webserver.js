let http = require('http').createServer(handler);
let fs = require('fs');
let io = require('socket.io')(http);

http.listen(8000);

function handler(req, res) {
  // always give index.html regardless of the path
  fs.readFile(__dirname + '/public/index.html', (err, data) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data); // write data from index.html
    return res.end();
  });
}

io.sockets.on('connection', socket => {
  let pressed = [];

  function keyDown(key) {
    console.log("v", key, pressed);
  }

  function keyUp(key) {
    console.log("^", key, pressed);
  }

  function keyRepeat(key) {
    console.log(".", key, pressed);
  }

  socket.on('keydown', key => {
    pressed.push(key);
    keyDown(key);
  });

  socket.on('keyrepeat', key => {
    keyRepeat(key)
  })

  socket.on('keyup', key => {
    pressed.splice(pressed.indexOf(key), 1)
    keyUp(key);
  });
});
