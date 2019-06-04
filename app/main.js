const {app, Tray, Menu, BrowserWindow,ipcMain,protocol,globalShortcut,dialog,shell} = require('electron');
//app.setName('务联网桌面');
app.commandLine.appendSwitch('ignore-certificate-errors');//忽略相关证书。
var path = require('path');//解析需要遍历的文件夹。
var fs = require("fs");

var fag=false;
var window = null;
var appIcon = null;
var browserWindow=null;
var icont;
var iconover;
var iconout;
var isF = true;
var isShow = true;
var isIn = true;
var isStep = false;
var timeP,ict;
var isIStep = true;

var shouLdQuit= app.makeSingleInstance(function (argv,work) {

        if(argv.length<=1){
            window.show();
            window.focus();
        }

		if(argv[1]){
			if(argv[1].indexOf('http')==-1){
			 window.show();
		    }else{
		     window.hide();
		     
		   }
		}

        icon.hide();
        window.center();
        
        window.webContents.send('msg',app.getPath('desktop'),argv[1]);
        return true;
});

if (shouLdQuit){ //如果程序已经运行，用户再次点击，不在激活程序。
    return
}

app.commandLine.appendSwitch("--disable-http-cache");
app.on('ready', function() {
   
    const electronScreen = require('electron').screen ;//屏幕
    const swidth = electronScreen.getPrimaryDisplay().size.width; //获取屏幕宽
    const sheight = electronScreen.getPrimaryDisplay().size.height; //获取屏幕高

    //务联网桌面窗口（主窗口）
    Menu.setApplicationMenu(null);
    window = new BrowserWindow({width: 1250, height: 750, frame:false,minWidth:860,minHeight:600,show:true });
    window.on('closed', () => {window = null;});
    window.loadURL('file://' + __dirname +'./html/main.html');
    //window.openDevTools();
    loopPonint();

    //侧边隐藏窗口
 
    icon = new BrowserWindow({width: 40, height: 40, frame:false,transparent:true,resizable:false,show:false});
    icon.loadURL('file://' + __dirname +'./html/icon.html');
    //icon.openDevTools();
    icon.setSkipTaskbar(true);

    //中亚浏览器窗口
   
   

    let msg;
    process.argv.forEach(function(val, index) {//获取命令行参数
        window.show();
       if (index==1) {
                msg=val;
            if(msg.indexOf('http')==-1){
                window.show()
            }else  {
               window.hide();
               console.log(msg);
               browserWindow.show()
            }
        }
    });

 
    window.webContents.on('did-finish-load', function() {

        window.webContents.send('msg',app.getPath('desktop'),msg);//获取桌面路径，把路径信息发送个渲染进程 main.html.

        //判断窗口是否处于全屏状态，给渲染进程发送信息，设置对应按钮图标。

        ipcMain.on('master-close', (e, msg) => { //关闭master进程.
            window.setSkipTaskbar(true);//使窗口不显示在任务栏中。
            window.minimize();
        });

        ipcMain.on('master-minimize', (e, msg) => {//最小化master进程
            let speed = 0;
            window.hide();
            icon.center()
            icon.show();
            let distance = swidth/2;
            istep(distance,true,true,500);
        });
        
        ipcMain.on('click',()=>{
            icon.hide();
            window.show();
        });

        window.on('show',()=>{
            isShow = true;
            isF =true;
             icon.hide()
             
        });

        window.on('hide',()=>{
            isShow = false;
            isIn = false;
            isF = false;
             
        })


        var userWindow=null 
        ipcMain.on('userPass',(event,mg)=>{
            if(!userWindow){
                userWindow=new BrowserWindow({ width:1020,height:640,resizable:false,frame:false,show:false});
                //userWindow.openDevTools();
               
                userWindow.loadURL('file://' + __dirname +'./html/personal.html');
                userWindow.webContents.on('did-finish-load', function() {
                    userWindow.webContents.send('userPass',mg);
                    userWindow.show();
                });

                userWindowHideClose();
            }else{
                userWindow.webContents.send('userPass',mg);
                userWindow.show();
            } 

        });

    function userWindowHideClose(){
        ipcMain.on('minimize',()=>{

            userWindow.minimize();
        });     

        ipcMain.on('exit',()=>{

            userWindow.hide();
        });
    }



        ipcMain.on('master-maximize', (e, msg) => { //接收到信息，
            if(window.isFullScreen()){
                window.setFullScreen(false);
                window.webContents.send('false');
              
                loopPonint() 
             
            }else{
                clearInterval(timeP);
                window.setFullScreen(true);
             
                window.webContents.send('true');
               
            }      
        });

       

       
     
 		ipcMain.on('guest', (event, msg) => { 
             window.setResizable(false);
        });
        ipcMain.on('NO', (event, msg) => { 
            window.setResizable(true);
        });

        ipcMain.on('disflag',(e,msg)=>{
            if(msg==true){
                window.setFullScreen(true);
                window.webContents.send('true');
            }else{
                window.setFullScreen(false);
                 window.webContents.send('false');
            }
        })

    });


    var flg=true;
    ipcMain.on('Fail', (e, msg) => { //接收到加载失败的信息。
       window.hide();
        flg=false;
    });

   

   

    let ctrlT = globalShortcut.register('ctrl+t', ()=> {//注册快ctrl+t捷键，实现打开控制台调试功能。

        window.toggleDevTools() 
    });

    let ctrlR = globalShortcut.register('ctrl+r', ()=> {//注册ctrl+r快捷键 实现桌面刷新功能。
        window.webContents.send('reload','reload');
       
    });


    let f11 = globalShortcut.register('f11', ()=> {//注册F11快捷键 实现全屏切换功能。
       if(window.isFullScreen()){
        window.webContents.send('false');
        window.setFullScreen(false);
       }else{
        window.webContents.send('true');
        window.setFullScreen(true);
       }
    });

    //开启定时器判断鼠标位置 设置导航条是否下拉。
    let toggnavbar = setInterval(()=>{
        ponintY = electronScreen.getCursorScreenPoint().y;
        if(window.isFullScreen() && ponintY<45){
            window.webContents.send('falses');
            
        }else if(window.isFullScreen() && !ponintY<45){
            window.webContents.send('trues');
           
        }else{
            return;
        }
    },10)
   let svdesktop_control= path.resolve(__dirname, '../../svdesktop_control.ini');
    let ctra='[control]\r\n\control=1';
    let ctrb='[control]\r\n\control=2';
    fs.watchFile(svdesktop_control, (curr, prev) => {
        fs.readFile(svdesktop_control, function (err, data) {
            if (err) {
                return console.error(err);
            }
           
            if(data.toString()==ctra){
                window.setSkipTaskbar(false);
                window.show();
               // console.log(ctra);
            }else if(data.toString()==ctrb){
                fag=true;
                clearInterval(timeP);
                clearInterval(ict);
                clearInterval(toggnavbar);
                app.quit();
            }else{
                return;
            }
           
         });
      });


  //实现托盘功能，设置托盘图标，创建托盘菜单栏。
    // const iconPath = path.join(__dirname, './images/long2.ico');
    // appIcon = new Tray(iconPath);
    // var contextMenu;
    // contextMenu = Menu.buildFromTemplate([
    //     {
    //         label: '显示主面板',
    //         click: function (e) {
    //             if (flg){
    //                 window.setSkipTaskbar(false);
    //                 window.show();
    //             } 

    //         }
    //     },
    //     {
    //         label: '关于',
    //         click: function () {
    //             window.webContents.send('about','务联网桌面2.0.1版本');
    //         }
    //     },
    //     {
    //         label: '退出',
    //         click: function () {
    //             fag=true;
    //             clearInterval(timeP);
    //             clearInterval(ict);
    //             clearInterval(toggnavbar);
    //             app.quit();
    //         }
    //     }

    // ]);
    // appIcon.setToolTip('务联网桌面');
    // appIcon.setContextMenu(contextMenu);

    // appIcon.on('double-click',()=>{
    //     if (flg){
    //         window.setSkipTaskbar(false);
    //         window.show();
    //     } 
    // });

    window.on('close', (event)=> {
        if (!fag) {
            event.preventDefault();
            window.hide()
        }
    });

   
    window.on('maximize',(e)=>{
        window.unmaximize();
        //e.returnValue = false
        e.preventDefault();
    });

   

    var exec = require('child_process').exec;// 引入子进程模块 判断系统盘符数量。
    exec('wmic logicaldisk get caption', function(err, stdout, stderr) {
        if(err || stderr) {
            console.log("root path open failed" + err + stderr);
            return;
        }
        let a = stdout.split("\n").join("").split("  ").join("");
        let reg = new RegExp("Caption","g");
        let b = a.replace(reg,"");
        let diskArray = b.split(" "); diskArray.pop();// 在每个空格处进行分解  [" C:", "D:", "E:","F:","Z:",""],删除最后一个空元素。

    });



    function loopPonint(){
            clearInterval(timeP)
            timeP= setInterval(()=> {
                ponintX = electronScreen.getCursorScreenPoint().x;
                ponintY = electronScreen.getCursorScreenPoint().y;
                windowX = window.getPosition()[0];
                windowY = window.getPosition()[1];
                windowW = window.getSize()[0];
                windowH = window.getSize()[1];
                if(isShow){
                    if(ponintX>= windowX && ponintX<=(windowX+windowW) && ponintY>=windowY && ponintY<=(windowY+windowH)){
                        isF = true;
                        isIn = true;
                    }else{
                        if(isIn){
                            isF = false
                            isIn = false;
                        }
                    }
                    if(windowX<0 && windowX>=-windowW){
                        if(!isStep){
                         window.setPosition(0,windowY)
                        }
                    }else if(windowX>(swidth-windowW) && windowX<=swidth){
                        if(!isStep){
                         window.setPosition(swidth-windowW,windowY)
                        }
                    }else if(ponintX>= windowX && ponintX<=(windowX+windowW) && ponintY>=windowY && ponintY<=(windowY+windowH)){
                         if(!isStep){
                            window.setPosition(windowX,windowY)
                        }
                    
                    }else if((ponintY==0 && ponintX>= windowX && ponintX<=(windowX+windowW)) || (windowY == (-windowH-1) && isF == true)){
                        if(windowY==(-windowH-1)){
                           step(false,true,true,100)
                        }
                    }else if(windowY == 0 && isF == false){
                         step(false,false,true,100)
                    }else if((ponintX==0 && ponintY>= windowY && ponintY<=(windowY+windowH)) || (windowX == (-windowW-1) && isF == true)){
                        if(windowX==(-windowW-1)){
                           step(true,true,true,100)
                        }
                    }else if(windowX == 0 && windowY!=(-windowH-1) && isF == false){
                         step(true,false,true,100)
                    }else if((ponintX>=(swidth-1) && ponintY>= windowY && ponintY<=(windowY+windowH)) || (windowX == (swidth+1) && isF == true)){
                        if(windowX == swidth+1){
                            step(true,true,false,100)
                        }
                    }else if(windowX == (swidth-windowW) && windowY!=(-windowH-1) && isF == false){
                          step(true,true,true,100)
                    }
                }
            },10);
    }

    function step(isX,isP,isLeft,time){
        clearInterval(timeP)
        isStep = true;
        var wwidth = window.getSize()[0];
        var whegint = window.getSize()[1];
        var positionX = window.getPosition()[0];
        var positionY = window.getPosition()[1];
        var startTime = Date.now(),duration = time;
        var distance = isX  ? wwidth+1 : whegint+1;
        var original = isX ? positionX : positionY;
        clearInterval(t)
        var t = setInterval(()=>{
            var p = Math.min(1.0, (Date.now() - startTime) / duration);
            var step = isLeft ? Math.ceil(original+(p*p)*distance) : Math.ceil(original-(p*p)*distance)
            var step = isP ? step : -step;
            isX ? window.setPosition(step,positionY) : window.setPosition(positionX,step)
            if(p==1.0){
                loopPonint()
                isStep = false;
                clearInterval(t)
            }
        },10)
    }

    function bstep(isX,isP,isLeft,time){
      
        var startTime = Date.now(),duration = time;
        var distance = isX  ? wwidth+(swidth-wwidth)/2 : whegint+1;
        var original = isX ? positionX : positionY;
        clearInterval(bt)
        var bt = setInterval(()=>{
            var p = Math.min(1.0, (Date.now() - startTime) / duration);
            var step = isLeft ? Math.ceil(original+(p*p)*distance) : Math.ceil(original-(p*p)*distance)
            var step = isP ? step : -step;
            isX ? browserWindow.setPosition(step,positionY) : browserWindow.setPosition(positionX,step)
            if(p==1.0){
                clearInterval(bt)
            }
        },10)
    }

    function istep(distance,isP,isLeft,time){
            var wwidth = icon.getSize()[0];
            var whegint = icon.getSize()[1];
            var positionX = icon.getPosition()[0];
            var positionY = icon.getPosition()[1];
            var startTime = Date.now(),duration = time;
            var original = positionX ;
            clearInterval(it)
            var it = setInterval(()=>{
                var p = Math.min(1.0, (Date.now() - startTime) / duration);
                var step = isLeft ? Math.ceil(original+(p*p)*distance) : Math.ceil(original-(p*p)*distance)
                var step = isP ? step : -step;
                icon.setPosition(step,positionY) 
                if(p==1.0){
                    isIStep = true
                    clearInterval(it)
                }
            },10)
        
    }
    
});


