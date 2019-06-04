var mainGes = null;
window.onload = function() {
    const {shell} = require('electron'); 
    const remote = require('electron').remote;
    const BrowserWindow = remote.BrowserWindow;
    document.addEventListener('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
    }, false);

    document.addEventListener('drop', function(e) {
        e.stopPropagation();
        e.preventDefault();
        //sendFiles(e.dataTransfer.files);
    }, false);
    document.addEventListener('onclick',function(){
        console.log(0);
    })

    var path = require('path');//解析需要遍历的文件夹。
    var fs = require("fs");
    var deskData;//声明空数组保存文件路径。
    var desk = 'desk/';
    var deskPath = '';
    const {ipcRenderer}=require('electron');
    ipcRenderer.on('msg', function(event, filePath,Msg) {
		//console.log(filePath)
        deskPath = filePath.replace(/\\/g,'/')+'/';
        mainGes =Msg;
        if ( Msg && Msg.indexOf('http')!=0){
            document.querySelector('#foo').src="http://s.etclij.cn/index.php?user/loginSubmit&type=auto&name="+Msg+"&password="+Msg
        }
       deskDisk =path.resolve(deskPath.substring(0,deskPath.indexOf('\\')));
        deskDisplay(deskPath,deskPath,desk,desk);
    });
    function getExt(filename){
        return filename.toLowerCase().split('.').splice(-1).toString();
    }

    ipcRenderer.on('about', function(event, msg) {
        alert(msg)
    });
   

    var flag;//声明变量保存主进程发来的信息。
    require('electron').ipcRenderer.on('flag', function(event, msg) {
        flag=msg
    });


    var  disks=[];//声明数组保存磁盘数量。
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
        for (let i in diskArray){
            let thisPath = 'disk'+$.trim(diskArray[i])+'/';
            let truePath = $.trim(diskArray[i]).toLowerCase()+'/';
            fileDisplay(truePath,truePath,thisPath,thisPath,i)
        }
    });



    var webview = document.getElementById("foo");


     ipcRenderer.on('reload', function(event, msg) {
            webview.reload();

        });
    webview.addEventListener("dom-ready", function() {
        webview.clearHistory();//清除缓存、

        //webview.openDevTools(); // 这里打开 webview的控制台.

        webview.send('rootPath',deskPath,deskData,disks,mainGes);//把主进程接收到的消息传达给webview所加载的子页面.

        webview.addEventListener('new-window', (event,url) => {
            //event.preventDefault();
            webview.src=event.url;
        });

        ipcRenderer.on('flag', function(event, msg) {
            webview.send('flag',msg);
            
        });

    });

    
    ipcRenderer.on('true', function(event, msg) {//监听窗口状态提换最大化图标及还原图标。
        Maximization.src="../images/dahua.png";
        $('#max_button').attr('title','还原'); 
        $('#frame_button').slideUp("fast");
       
    });
    ipcRenderer.on('false', function(event, msg) {
        Maximization.src="../images/dhua.png";
        $('#max_button').attr('title','最大化');
        $('#frame_button').slideDown("fast");
        
    });

    ipcRenderer.on('trues', function(event, msg) {//监听鼠标位置，上拉下滑顶部导航条。
       
        let loglistdisplay=$('.loglist').css('display');
        if(loglistdisplay=='none'){
            $('#frame_button').slideUp("fast");
        }else{
            $('#frame_button').slideDown("fast").stop();
        }
    });

    ipcRenderer.on('falses', function(event, msg) {
        $('#frame_button').slideDown("fast");
       
    });

    

    var userPass;
    webview.addEventListener('ipc-message', (event) => {
        let reURL = /^(http|https):\/\/.+$/;
        if(!reURL.test(event.channel) && !/^account=/g.test(event.channel)){
             $('#login').attr("title",event.channel);
        }
        if (event.channel=='guest') {
            ipcRenderer.send('guest', event.channel);
            $("#max_button").unbind("click");
        }
        else if(reURL.test(event.channel)) {
            shell.openExternal(event.channel);
        }else if(/^account=/g.test(event.channel)){
            userPass=event.channel;
        }else{
           return;
        }; 
        
        if(typeof event.channel=='boolean'){
            ipcRenderer.send('disflag',event.channel);
        }
          
    })

    $("#max_button").click(()=>{
        ipcRenderer.send('master-maximize','maximize');
     });


    function deskDisplay(filePath,from,to,thisPath){
        if(!from || !to || !thisPath ){
            from = '';
            to = '';
            thisPath = '';
        }

        deskData = {folderList:[],fileList:[],thisPath};
        //根据文件路径读取文件，返回文件列表
        fs.readdir(filePath,function(err,files){
            if(err){
                console.warn(err)
            }else{
                //遍历读取到的文件列表
                files.forEach(function(filename){
                    //获取当前文件的绝对路径
                    var filedir = path.join(filePath, filename);
                    //根据文件路径获取文件信息，返回一个fs.Stats对象
                    fs.stat(filedir,function(eror, info){
                        if(eror){
                            console.warn('获取文件stats失败');
                        }else{
                            var lPath = filedir.replace(/\\/g,'/').replace(from,to)+'/';
                            var name = filename;
                            var mode = info.mode;
                            var atime = Date.parse(info.atime)/1000;
                            var ctime = Date.parse(info.ctime)/1000;
                            var mtime = Date.parse(info.mtime)/1000;
                            var isReadable = true;
                            var isWriteable = true;
                            var size = info.size;
                            var isFile = info.isFile();
                            if(isFile){
                                var type = 'file';
                                var ext = getExt(name);
                                var isParent = false;
                                deskData.fileList.push({
                                    name,
                                    path:lPath,
                                    type,
                                    mode,
                                    atime,
                                    ctime,
                                    mtime,
                                    isWriteable,
                                    isReadable,
                                    isParent,
                                    size,
                                    ext
                                });
                            }else{
                                var children =  readDirSync(filedir);
                                var isParent = children.folderList.length == 0? false : true;
                                var type = 'folder';
                                deskData.folderList.push({
                                    name,
                                    path:lPath,
                                    type,
                                    mode,
                                    atime,
                                    ctime,
                                    mtime,
                                    isWriteable,
                                    isReadable,
                                    isParent
                                });
                                //递归，如果是文件夹，就继续遍历该文件夹下面的文件
                            }
                        }
                    })

                });
            }
        });
    }


    function fileDisplay(filePath,from,to,thisPath,i){
        if(!from || !to || !thisPath ){
            from = '';
            to = '';
            thisPath = '';
        }
        if(!i){
            i = 0;
        }
        disks[i] = {folderList:[],fileList:[],thisPath};
        //根据文件路径读取文件，返回文件列表
        fs.readdir(filePath,function(err,files){
            if(err){
                console.warn(err)
            }else{
                //遍历读取到的文件列表
                files.forEach(function(filename){
                    //获取当前文件的绝对路径
                    var filedir = path.join(filePath, filename);
                    //根据文件路径获取文件信息，返回一个fs.Stats对象
                    fs.stat(filedir,function(eror, info){
                        if(eror){
                            console.warn('获取文件stats失败');
                        }else{
                            var lPath = filedir.replace(/\\/g,'/').replace(from,to)+'/';
                            var name = filename;
                            var mode = info.mode;
                            var atime = Date.parse(info.atime)/1000;
                            var ctime = Date.parse(info.ctime)/1000;
                            var mtime = Date.parse(info.mtime)/1000;
                            var isReadable = true;
                            var isWriteable = true;
                            var size = info.size;
                            var isFile = info.isFile();
                            if(isFile){
                                var type = 'file';
                                var ext = getExt(name);
                                var isParent = false;
                                disks[i].fileList.push({
                                    name,
                                    path:lPath,
                                    type,
                                    mode,
                                    atime,
                                    ctime,
                                    mtime,
                                    isWriteable,
                                    isReadable,
                                    isParent,
                                    size,
                                    ext
                                });
                            }else{
                                var children =  readDirSync(filedir);
                                var isParent = children.folderList.length == 0? false : true;
                                var type = 'folder';

                                disks[i].folderList.push({
                                    name,
                                    path:lPath,
                                    type,
                                    mode,
                                    atime,
                                    ctime,
                                    mtime,
                                    isWriteable,
                                    isReadable,
                                    isParent
                                });

                                //递归，如果是文件夹，就继续遍历该文件夹下面的文件
                            }
                        }
                    })

                });
            }
        });
    }

    function readDirSync(root,from,to,thisPath){
        if(!from || !to || !thisPath){
            from = '';
            to = '';
            thisPath = '';
        }
        var arr = {folderList:[],fileList:[],thisPath};
        var pa = fs.readdirSync(root);

        pa.forEach(function(ele,index){
            try{
                var filedir = path.join(root, ele);
                var lPath = filedir.replace(/\\/g,'/').replace(from,to)+'/';
                var info = fs.statSync(filedir);
                var name = ele;
                var mode = info.mode;
                var atime = Date.parse(info.atime)/1000;
                var ctime = Date.parse(info.ctime)/1000;
                var mtime = Date.parse(info.mtime)/1000;
                var isReadable = true;
                var isWriteable = true;
                var size = info.size;
                if(info.isDirectory()){
                    var children =  thisPath ? readDirSync(filedir) : arr ;
                    var isParent = children.folderList.length == 0? false : true;
                    var type = 'folder';
                    arr.folderList.push({
                        name,
                        path:lPath,
                        type,
                        mode,
                        atime,
                        ctime,
                        mtime,
                        isWriteable,
                        isReadable,
                        isParent
                    });
                }else{
                    var type = 'file';
                    var ext = getExt(name);
                    var isParent = false;
                    arr.fileList.push({
                        name,
                        path:lPath,
                        type,
                        mode,
                        atime,
                        ctime,
                        mtime,
                        isWriteable,
                        isReadable,
                        isParent,
                        size,
                        ext
                    });
                }
            }catch(err){
                console.log(err)
            }
        });

        return arr;
    }
   
    let myNotification = new Notification('通知', {
        body: '尊敬的用户，您好！务联云桌面已经启动，请勿重复点击！'
    });

    myNotification.onclick = () => {
        console.log('通知已关闭');
    };


    var flag=true;
    var loading=document.querySelector('#loading');
    const loadstart = () => {
        loading.style.display='block';
       
    };

    const loadstop  = () => {
        loading.style.display='none';
    };

    const loadFail=()=>{
        //webview.src='./CDesktopWindow.html';
        loading.style.display='none';
    };
    webview.addEventListener('did-start-loading', loadstart);
    webview.addEventListener('did-stop-loading', loadstop);
 
    //webview.addEventListener('did-fail-load', loadFail);


    //点击按钮 webview发送信息到子页面（服务器端）;

    $(".disktop-home").click(function(){
       webview.src='http://s.etclij.cn/index.php?';
      });

    $("#editor").click(function(){
       webview.src='http://s.etclij.cn/index.php?editor';
      });

    $("#CDOWebsite").click(function(){
       
        shell.openExternal('http://www.cherryfruif.cn/index1.html');
      });

    $("#explorer").click(function(){
         webview.src='http://s.etclij.cn/index.php?explorer';
      });


    $("#min_button").click(function(){
        ipcRenderer.send('master-minimize','minimize');
      });

    var Maximization=document.querySelector('#Maximization');
    $("#exit_button").click(function(){
        ipcRenderer.send('master-close','close');
      });

    $('.personal').click(function(){
       ipcRenderer.send('userPass',userPass);
    });

    $('.quit').click(function(){
        webview.src='http://s.etclij.cn/index.php?user/logout';
    })

    ipcRenderer.on('F11', function(event, msg) {
        $('#ca_top_div').css('display','none');
        $('.view').css('height','100%');
    });


};



    






