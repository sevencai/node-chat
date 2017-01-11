var http = require('http');
var sio = require('socket.io');
var express = require('express');

var app = express();
var server = http.createServer(app);
var io = sio.listen(server);

app.get('/',function(req,res){
	res.sendFile(__dirname+'/index.html');
})

server.listen('3000',function(){
	console.log('listening on port 3000');
})

var onlineUsers = {};
var onlineCount = 0;
var userSockets = {};

io.on('connection',function(socket){
	//当客户端有用户登陆的时候
	socket.on('login',function(userObj){
		socket.uid = userObj.uid;
		userSockets[userObj.uid] = socket;

		//检查是否在当前的用户列表中，如果不在count++
		if(!onlineUsers.hasOwnProperty(userObj.uid)){
			onlineUsers[userObj.uid] = userObj.username;
			onlineCount++;
		}

		//向客户端发送用户登陆的信息
		io.emit('login',{onlineUsers:onlineUsers,onlineCount:onlineCount,userObj:userObj});

		console.log(userObj.username + " 进入了聊天室");
	});

	//当服务器接收到消息时
	socket.on('message',function(data){
		if(data.to !== "所有人"){
			if(data.to in userSockets){
				userSockets[data.to].emit('to'+data.to,data);
				userSockets[data.uid].emit('to'+data.uid,data);
			}
		}else{
			io.emit('message',data);
			console.log(data.username+"对"+data.to+"说："+data.message);
		}			
	});

	//当客户端退出的时候
	socket.on('disconnect',function(){
		if(onlineUsers.hasOwnProperty(socket.uid)){
			//记录要退出用户的信息，发送给客户端
			var userObj = {uid:socket.uid,username:onlineUsers.uid};

			delete onlineUsers[socket.uid];
			delete userSockets[socket.uid];
			onlineCount--;

			io.emit('logout',{onlineUsers:onlineUsers,onlineCount:onlineCount,userObj:userObj});
			console.log(userObj.username+" 退出了聊天室");
		}
	})
})
