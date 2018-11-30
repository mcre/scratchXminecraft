
(function (ext) {

    var mcSocket = null;
    var MCPI = {}; //Object.create(null);
    var hostname = "localhost";

    function mc_init(host) {
        hostname = host;
        if(mcSocket == null) {
            mcSocket = new WebSocket("ws://"+host+":14711");
            mcSocket.onopen    = onOpen;
            mcSocket.onmessage = onMessage;
            mcSocket.onclose   = onClose;
            mcSocket.onerror   = onError;
            mcSocket.IsConnect = false;
        }
    }

    function onOpen(event) { 
      //console.log("onOpen");
        mcSocket.IsConnect = true;
        getPlayerPos();
    }

    function onMessage(event) {
        if (event && event.data) {
            console.log("onMessage: " + event.data);
        }
    }

    function onError(event) {
        //if(event && event.data) {
        //    console.log("onError: " + event.data);
        //} else {
        //    console.log("onError");
        //}
        mcSocket = null;
    }

    function onClose(event) {
        mcSocket = null;
    }
    
    function mcSend(text) {
        if(mcSocket!=null) {
            mcSocket.send(text);
        }
    }
    
    function mcSendWCB(text, func) {
        if(mcSocket!=null) {
            mcSocket.onmessage = function(event) {
                if( typeof func != "undefined" && func!=null ) {
                    func(text);
                }
                mcSocket.onmessage = onMessage;
            };
            mcSocket.send(text);
        }
    }

    //
    // Minecraft Control function
    //
    function connect(target) {
        if(mcSocket!=null) {
            mcSocket.close();
            mcSocket = null;
        }
        mc_init(target);
    }
    
    function connect_url() {
        if(mcSocket!=null && mcSocket.IsConnect) {
            return mcSocket.url;
        }
        return "no connection";
    }

    function postToChat(msg) {
        mcSend("chat.post(" + msg + ")");
    }

    function getBlock(x,y,z,callback) {
        var opt = [x,y,z].join();
        var msg = "world.getBlock(" + opt + ")";
        function getb_cb(txt) {
            //console.log("getBlock : " + txt);
            if( typeof callback != "undefined" && callback!=null) {
                callback( Number(event.data.trim()) );
            }
        }
        mcSendWCB(msg, getb_cb);
    }

    function setBlock(x,y,z,block){
        var opt = [Math.round(x),Math.round(y),Math.round(z),block].join();
        mcSend("world.setBlock(" + opt + ")");
    }

    function setPlayer(x,y,z) {
        var opt = [Math.round(x),Math.round(y),Math.round(z)].join();
        mcSend("player.setPos(" + opt + ")");
    }

    function getPlayerPos(callback) {
        // PlayerPos
        mcSocket.onmessage = function (event) {
            if(event && event.data) {
              //console.log("PlayerPos : " + event.data);
            }
            var args = event.data.trim().split(",");
            MCPI.playerX = Math.floor(parseFloat(args[0]));
            MCPI.playerY = Math.floor(parseFloat(args[1]));
            MCPI.playerZ = Math.floor(parseFloat(args[2]));
            MCPI.curX = MCPI.playerX;
            MCPI.curY = MCPI.playerY;
            MCPI.curZ = MCPI.playerZ;
            MCPI.playerShiftedHeight = MCPI.playerY;
            
            function getrot_cb(txt) {
              //console.log("Rotation : " + txt);
                if( typeof callback != "undefined" && callback!=null) {
                    MCPI.yaw = parseFloat(event.data.trim());
                    callback();
                }
            }
            mcSendWCB("player.getRotation()", getrot_cb);
        }
        mcSend("player.getPos()");
    }

    function getPlayerYXZ(posCoord) {
        var val = 0;
        switch (posCoord) {
          case 'x':  val = MCPI.playerX;  break;
          case 'y':  val = MCPI.playerY;  break;
          case 'z':  val = MCPI.playerZ;  break;
        }
        return Math.round(val);
    }
    
    function sendRawMsg(msg) {
        mcSend(msg);
    }
    
    function getPlayerId() {
        mcSend("world.getPlayerId()");
    }
    
    ext.connect      = connect;
    ext.connect_url  = connect_url;
    ext.postToChat   = postToChat;
    ext.getBlock     = getBlock;
    ext.setBlock     = setBlock;
    ext.setBlocks    = setBlocks;
    ext.setPlayer    = setPlayer;
    ext.getPlayerPos = getPlayerPos;
    ext.playerXYZ    = getPlayerYXZ;
    ext.sendRawMsg   = sendRawMsg;

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
          [' ', '%s にせつぞく ', 'connect', 'localhost' ],
          ['r', 'せつぞくさき', 'connect_url'  ],
          [' ', '%s とチャットでいう', 'postToChat', 'こんにちは' ],
          ['R', 'ざひょう X %n Y %n Z %n のブロックばんごう', 'getBlock', 0,0,0 ],
          [' ', 'ざひょう X %n Y %n Z %n をばんごう %n のブロックにする', 'setBlock', 0,0,0,0 ],
          [' ', 'プレイヤーをX %n Y %n Z %n にうごかす', 'setPlayer', 0,0,0,0 ],
          ['w', 'プレイヤーのざひょうデータをあたらしくする', 'getPlayerPos'],
          ['r', 'プレイヤーの %m.pos ざひょうデータ', 'playerXYZ', 'x'],
          [' ', '(DBG)RawMsg %s', 'sendRawMsg', '' ], // for Extension Developper
        ],
        menus: {
            pos: ['x', 'y', 'z'],
            blockPos: ['abs', 'rel'],
        }
    };

    ext._getStatus = function() {
        if( mcSocket!=null && mcSocket.IsConnect==true ) {
            return { status:2, msg:'じゅんびできてる' };
        }
        if(mcSocket==null) {
            mc_init(hostname);
        }
        return { status:1, msg:'じゅんびできてない' };
    };
    
    ext._shutdown = function() {
        console.log("_shutdown");
    };

    // Register the extension
    ScratchExtensions.register('MinecraftWebSocket-Scratch', descriptor, ext);

    mc_init( "localhost" );


})({});