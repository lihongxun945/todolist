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
        },
        tabs: function(titleCon, bodyCon, hiliteClass) {
            var titles = $(titleCon).children();
            var bodys = $(bodyCon).children();
            titles.each(function(i, e){
                $(e).attr("data-index", i);
            });
            titles.click(function(e){
                titles.removeClass(hiliteClass);
                $(e.target).addClass(hiliteClass);
                bodys.hide();
                $(bodys.get($(e.target).attr("data-index"))).show();
            });
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
                    if(todos[i][0] === url) removed = todos.splice(i, 1)[0];
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
                    result += "<li><a href='"+t[0]+"' class='item' name='item'><img class='icon' src='"+util.getIcon(t[0])+"'/>"+(t[1]?t[1]:t[0])+"</a><a class='close' name='close' data-url='"+t[0]+"' title='done'>x</a></li>";
                }
                !result && (result = "<div class='empty-msg'>you have nothing todo</div>");
                $("#todos").html(result);
                callback && callback();
            });
        },
    };

    var done = {
        add: function(data, callback){
            done.getAll(function(datas){    //此处没有用this,不然在回调函数中总是需要绑定this
                datas.push(data);
                chrome.storage.sync.set({"dones": datas}, function(){callback && callback(data)});
            });
        },
        getAll: function(callback) {
            chrome.storage.sync.get("dones", function(d) {
                var dones = d["dones"];
                if(!dones) dones = [];
                callback && callback(dones);
            });
        },
        has: function(url, callback){
            done.getAll(function(dones){
                for(var i=0;i<dones.length;i++) {
                    if(dones[i][0] === url) {
                        callback && callback(true);
                        return;
                    }
                }
                callback && callback(false);
            });
        },
        remove: function(url, callback) {
            done.getAll(function(dones){
                var removed;
                for(var i=0;i<dones.length;i++) {
                    if(dones[i][0] === url) removed = dones.splice(i, 1);
                }
                chrome.storage.sync.set({"dones": dones}, function(){callback && callback(removed)});
            });

        },
        clear: function(callback){
            chrome.storage.sync.set({"dones": []}, function(){callback && callback()});
        },
        redraw: function(callback) {
            done.getAll(function(dones){
                var t;
                var result = "";
                for(var i=0;i<dones.length;i++) {
                    t = dones[i];
                    result += "<li><a href='"+t[0]+"' class='item' name='item'><img class='icon' src='"+util.getIcon(t[0])+"'/>"+(t[1]?t[1]:t[0])+"</a><a class='close' name='close' data-url='"+t[0]+"'>x</a></li>";
                }
                !result && (result = "<div class='empty-msg'>you have done nothing</div>");
                $("#dones").html(result);
                callback && $.isFunction(callback) && callback();
            });
        },
    }


    /* add current btn */
    function refreshState(){
        chrome.tabs.getSelected(null,function(tab){
            $("#current_title").val(tab.title);
            todo.has(tab.url, function(b) {
                if(b){
                    $("#op").hide();
                    $("#added").show().html("It's already in TODOS");
                }else{
                    done.has(tab.url, function(b) {
                        if(b){
                            $("#op").hide();
                            $("#added").show().html("It's already done");
                        }else{
                            $("#op").show();
                            $("#added").hide();
                        }
                    });
                }
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
                todo.add([tab.url, title], function(){todo.redraw();refreshState();});
            });
        });
    });
    
    $("#todos").click(function(e) {
        btn = e.target
        if(btn && btn.name) {
            switch(btn.name) {
                case "close":
                    todo.remove(btn.getAttribute("data-url"), function(d){
                        todo.redraw(refreshState);
                        if(!done.has(d[0])) {
                            done.add(d, done.redraw);
                        }
                        });
                    break;
                case "item":
                    util.openUrl(btn.href);
                    break;
            }

        }
    });
    $("#dones").click(function(e) {
        btn = e.target
        if(btn && btn.name) {
            switch(btn.name) {
                case "close":
                    done.remove(btn.getAttribute("data-url"), function(){
                        done.redraw();
                        refreshState();
                        }); 
                    break;
                case "item":
                    util.openUrl(btn.href);
                    break;
            }

        }
    });


    /*init*/
    refreshState();
    todo.redraw();
    done.redraw();
    util.tabs($("#tab-titles"), $("#tab-bodys"), "current");
});

