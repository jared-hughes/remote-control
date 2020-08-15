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
  socket.on('key', data => {
    console.log(data);
  });
});
