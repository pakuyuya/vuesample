(function($,W){
  
  var timeinterval = 1000;
  
	$(function(){
    
    $('#app').on('contextmenu', function(e){
        return false;
    });
		
		var app = new Vue({
      el : '#app',
      data : {
        mines     : 30,
        linenum   : 15,
        colnum    : 20,
        running   :false,
        remain    :'000',
        time      :'000',
        lines     :[],
        timerid   :undefined,
        hidetiles :0,
        gameovered   :false,
      },
      
      created : function() {
        this.init();
      },
      
      methods: {
        
        /**
         * init game.
         */
        init: function() {
          this.running   = false;
          this.remain    = this.mines;
          this.time      = '000';
          this.hidetiles = this.linenum * this.colnum;
          this.gameovered   = false;
          
          // init lines
          var lines = [];
          
          for(var i=0; i<this.linenum; ++i) {
            var tiles = [];
            for(var j=0; j<this.colnum; ++j) {
              var tile = {
                state :'hide',
                mine  :false,
                open  :false,
                flag  :false,
                label :'',
                mines :0,
              }
              tiles[j] = tile;
            }
            lines[i] = {tiles :tiles};
          }
          this.lines = lines;
        },
        
        reset : function() {
          this.timerStop();
          this.init();
        },
        
        
        hitTile : function(e, click_i, click_j) {
          
          if (this.gameovered) {
            return;
          }
          
          if (!this.running) {
            this.setMines(click_i, click_j);
            this.gameRun();
          }
          
          var isRightMB = false;
          e = e || window.event;

          if ("which" in e)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
              isRightMB = e.which == 3; 
          else if ("button" in e)  // IE, Opera 
              isRightMB = e.button == 2; 
          
          if (!isRightMB) {
            if (this.lines[click_i].tiles[click_j].mine) {
              this.bomb(click_i, click_j);
            } else {
              this.openTileAndChain(click_i, click_j);
            }
          } else {
            this.toggleFlag(click_i, click_j);
          }
        },
          
        gameRun : function() {
          this.timerStart();
          this.running = true;
        },
        
        gameStop : function() {
          this.timerStop();
          this.running = false;
        },
        
        gameClear : function() {
          this.timerStop();
          this.gameovered = true;
          this.running = false;
          
          for(var i=0; i<this.linenum; ++i) {
            for(var j=0; j<this.colnum; ++j) {
              if (!this.lines[i].tiles[j].open) {
                this.lines[i].tiles[j].flag = true;
              }
            }
          }
          
          alert('おめでとう！すべての爆弾を見つけた！');
        },
        
        gameOver : function() {
          this.timerStop();
          this.gameovered = true;
          this.running = false;
        },
        
        
        /**
         * setMines.
         */
        setMines : function(click_i, click_j) {
          if(click_i === undefined) click_i = -1;
          if(click_j === undefined) click_j = -1;
          
          for(var i=0; i<this.mines; ++i) {
            while(true) {
              var l = ~~(Math.random()*this.linenum);
              var t = ~~(Math.random()*this.colnum);
              if (l !== click_i && t !== click_j && !this.lines[l].tiles[t].mine) { 
                this.lines[l].tiles[t].mine = true;
                break;
              }
            }
          }
          
          // pre compute label
          
          var iadj = [ 1, 1, 1, 0, 0,-1,-1,-1];
          var jadj = [ 1, 0,-1, 1,-1, 1, 0,-1];
          
          for(var i=0; i<this.linenum; ++i) {
            for(var j=0; j<this.colnum; ++j) {
              if (!this.lines[i].tiles[j].mine) {
                var aroundmines = 0;
                for (var n=0; n<8; ++n) {
                  var test_i = i + iadj[n];
                  var test_j = j + jadj[n];
                  if (0 <= test_i && this.linenum > test_i
                      && 0 <= test_j && this.colnum > test_j
                      && this.lines[test_i].tiles[test_j].mine) {
                    ++aroundmines;
                  }
                }
                this.lines[i].tiles[j].mines = aroundmines;
              }
            }
          }
        },
        
        bomb : function(i, j) {
          for (var l=0; l<this.linenum; ++l) {
            for (var t=0; t<this.colnum; ++t) {
              this.openTile(l, t);
            }
          }
          
          this.lines[i].tiles[j].state = 'bomb';
          this.gameOver();
        },
        
        openTileAndChain : function(i, j) {
          var iadj = [ 1, 1, 1, 0, 0,-1,-1,-1];
          var jadj = [ 1, 0,-1, 1,-1, 1, 0,-1];
          
          this.openTile(i, j);

          if (this.lines[i].tiles[j].mines === 0 && !this.lines[i].tiles[j].mine) {
            for (var n=0; n<8; ++n) {
              var test_i = i + iadj[n];
              var test_j = j + jadj[n];
              if (0 <= test_i && this.linenum > test_i
                  && 0 <= test_j && this.colnum > test_j
                  && !this.lines[test_i].tiles[test_j].open) {
                this.openTileAndChain(test_i, test_j);
              }
            }
          }
          if (this.hidetiles <= this.mines) {
            // clear
            this.gameClear();
          }
        },
        
        openTile :function(i, j) {
          var tile = this.lines[i].tiles[j];
          
          if (tile.mine) {
            tile.label = '💣'
          } else if (tile.mines > 0) {
            tile.label = tile.mines;
          } else {
            tile.label = '';
          }
          
          tile.state = 'open';
          tile.open = true;
          this.lines[i].tiles[j] = tile;
          
          --this.hidetiles;
        },
        
        
        toggleFlag : function(i, j) {
          var pad = '000';
          var remain = Number(this.remain) + ((this.lines[i].tiles[j].flag) ? 1 : -1);
          this.remain = pad.substring(0, pad.length - String(remain).length) + remain;
          this.lines[i].tiles[j].flag ^= true;
        },
        
        timerStart : function() {
          this.timerStop();
          this.timerid = W.setTimeout(this.timeTick, timeinterval);
        },
        timerStop : function() {
          if (this.timerid) clearTimeout(this.timerid);
          this.timerid = undefined;
        },
          
        timeTick : function() {
          var time = Number(this.time) + 1;
          if (time > 999) time = 999;
          
          var pad = "000"
          this.time = pad.substring(0, pad.length - String(time).length) + time;
          this.timerid = W.setTimeout(this.timeTick, timeinterval);
        }
      }
    });
  });
})(jQuery, window);