$(function(){
    var l = window.localStorage;

    /* util */
    //这玩意是异步的，所以和ajax的方式类似，总是使用回调函数
   var util = {
       getIcon : function(url){
            var a = document.createElement('a');
            a.href = url;
            return a.protocol + "//"+a.hostname+"/favicon.ico";
        },
        openUrl: function (url) {
            chrome.windows.getCurrent(null, function(){ window.open(url); });
        }
    };
    var todo = {
        add: function(data, callback){
            todo.getAll(function(todos){    //此处没有用this,不然在回调函数中总是需要绑定this
                todos.push(data);
                chrome.storage.sync.set({"todos": todos}, function(){callback && callback(data)});
            });
        },
        remove: function(url, callback){
            todo.getAll(function(todos){
                var removed;
                for(var i=0;i<todos.length;i++) {
                    if(todos[i][0] === url) removed = todos.splice(i, 1);
                }
                chrome.storage.sync.set({"todos": todos}, function(){callback && callback(removed)});
            });
        },
        getAll: function(callback){
            var todos;
            chrome.storage.sync.get("todos", function(d) {
                todos = d["todos"];
                if(!todos) todos = [];
                callback && callback(todos);
            });
        },
        has: function(url, callback){
            todo.getAll(function(todos){
                for(var i=0;i<todos.length;i++) {
                    if(todos[i][0] === url) {
                        callback && callback(true);
                        return;
                    }
                }
                callback && callback(false);
            });
        },
        redraw: function(callback) {
            todo.getAll(function(todos){
                var t;
                var result = "";
                for(var i=0;i<todos.length;i++) {
                    t = todos[i];
                    result += "<li><a href='"+t[0]+"' class='item' name='item'><img class='icon' src='"+util.getIcon(t[0])+"'/>"+(t[1]?t[1]:t[0])+"</a><a class='close' name='close' data-url='"+t[0]+"'>x</a></li>";
                }
                $("#todos").html(result);
                callback && callback();
            });
        },
    };


    /* add current btn */
    function refreshAddCurrent(){
        chrome.tabs.getSelected(null,function(tab){
            todo.has(tab.url, function(b) {
                if(b){
                    $("#op").hide();
                    $("#added").show();
                }else{
                    $("#op").show();
                    $("#added").hide();
                }
                $("#current_title").val(tab.title);
            });
        });
    }
    $("#add").submit(function(e){
        e.preventDefault();
        chrome.tabs.getSelected(null,function(tab){
            todo.has(tab.url, function(b){
                if(b) return;
                var title = $("#current_title").val();
                if(!title) title = tab.title
                todo.add([tab.url, title], function(){todo.redraw();refreshAddCurrent();});
            });
        });
    });
    
    $("#todos").click(function(e) {
        btn = e.target
        if(btn && btn.name) {
            switch(btn.name) {
                case "close":
                    todo.remove(btn.getAttribute("data-url"), function(){todo.redraw(refreshAddCurrent);});
                    break;
                case "item":
                    util.openUrl(btn.href);
                    break;
            }

        }
    });

    /*init*/
    refreshAddCurrent();
    todo.redraw();
});

