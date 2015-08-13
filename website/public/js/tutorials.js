var app = angular.module('myApp', []);


// SERVICES

app.factory('messages', function(){
    var messages = {}
    messages.list = [];
    messages.add = function(message){
    messages.list.push({id: messages.list.length, text: message});
    };
    return messages;
});


// CONTORLLERS

app.controller('ListCtrl', function (messages){
    var self = this;
    self.messages = messages.list;
});

app.controller('PostCtrl', function (messages){
    var self = this;
    self.newMessage = 'Hello World!';
    self.addMessage = function(message){
    messages.add(message);
    self.newMessage = '';
    };
});

app.controller('AddCtrl', function(messages){
	this.getElementById('file').files[0]
})
