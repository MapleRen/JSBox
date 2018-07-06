var getCityCodeUrl;
var getNearStsUrl;
var lat;
var lng;
var datalist=[]
var direction=$cache.get("direction")||0;
$console.info(direction)

//更新当前地理位置
function updateLoc(){
    //获得当前地理位置,设置url
    $location.fetch({
        handler: function(resp) {
            lat = resp.lat.toFixed(6);
            lng = resp.lng.toFixed(6);
            setUrl(lat,lng);
            //$console.info("lat:"+lat+";lng:"+lng);
            refreshNearSts();
        }
        })
}

$ui.render({
    type:"view",
    props: {
        navBarHidden: false,
    },
    views: [{
        type:"view",
        props:{
            id:"toolBar",
            bgcolor:$color("#f3f4f4")
        },
        views:[{
            type: "label",
            props: {
              id: 'pageTitle', //标题
              text: '附近站点',
              font: $font("bold", 20),
              textColor: $color('black'),
              align: $align.center
            },
            layout: function (make, view) {
              make.left.right.equalTo(0);
              make.top.equalTo(10);
              make.height.equalTo(20);
            },
        }],
        layout:function (make, view) {
            make.left.right.equalTo(0);
            make.height.equalTo(40);
        },   
    },{
        type:"matrix",
        props:{
            id:"nearStsList",
            columns:1,
            itemHeight: 90, //每行高度
            square: false,
            spacing: 10, //间隔
            bgcolor: $color("#f3f4f4"),
            template:{
                type:"view",
                props:{
                    bgcolor: $color("#FFFFFF"),
                    textColor: $color("black"),
                    radius: 10,
                },
                views:[{
                    type:"label",
                    props:{
                        id:"nearSts_sn",//附近站点名
                        font:$font("bold", 20),
                        autoFontSize: true
                    },
                    layout: function (make, view) {
                        make.top.left.equalTo(15);
                      }
                },{
                    type:"label",
                    props:{
                        id:"nearSts_lineNames",//公交线路名
                        font:$font("bold", 15),
                        autoFontSize: false
                    },
                    layout: function (make, view) {
                        var preView = $("nearSts_sn")
                        make.top.equalTo(preView.bottom).inset(13)
                        make.left.equalTo(preView.left)
                        make.right.inset(5)
                      }
                },{
                    type: "label",
                    props: {
                      id: "nearSts_distance",
                      font: $font(13),
                      bgcolor: $color("#F5F5F5"),
                      textColor: $color("#666666"),
                      radius: 2
                    },
                    layout: function(make,view) {
                      var preView = $("nearSts_sn")
                      //make.bottom.equalTo(preView.top)
                      make.centerY.equalTo(preView.centerY)
                      //make.height.equalTo(20)
                      make.right.equalTo(0).inset(20)
                    }
                  }]
            }
        },
        events:{
            pulled: function(sender) {
                updateLoc();
            },
            didSelect:function(sender, indexPath, data){
                $ui.loading(true);
                var stsName=data.nearSts_sn.text;
                var id=data.id.text;
                var url=encodeURI("https://api.chelaile.net.cn/bus/stop!stationDetail.action?&destSId=-1&gpsAccuracy=65.000000&lorder=1&stats_act=refresh&stationId="+id+"&cityId=008&sign=&stats_referer=nearby&s=IOS&dpi=3&push_open=1&v=5.50.4");
                $http.get({
                    url: url,
                    handler: function(resp) {
                        $ui.loading(false);
                        var data = resp.data
                        getStsDetail(data)
                    }
                })
            }
        },
        layout:function(make, view){
            make.top.equalTo(30);
            make.left.right.equalTo(0);
            make.bottom.equalTo(0);
        }
    }]
})



//刷新附近站点
function refreshNearSts(){
    $ui.loading(true)
    $http.get({
        url: encodeURI(getNearStsUrl),
        handler: function(resp) {
            $ui.loading(false)
            $("nearStsList").endFetchingMore()
            var data = JSON.parse(resp.data.replace("**YGKJ","").replace("YGKJ##",""));
            var datalist=[];
            //$console.info(data);
            $console.info(resp.data.replace("**YGKJ","").replace("YGKJ##",""));
            var nearSts=data.jsonr.data.nearSts;
            $console.info(nearSts);
            for (let i = 0; i < nearSts.length; i++) {
                var obj={
                    nearSts_sn:{
                        text:nearSts[i].sn
                    },
                    nearSts_lineNames:{
                        text:nearSts[i].lineNames
                    },
                    nearSts_distance:{
                        text:nearSts[i].distance<100?"<100m":nearSts[i].distance+"m"
                    },
                    id:{
                        text:nearSts[i].sId
                    },
                    sortPolicy:{
                        text:nearSts[i].sortPolicy
                    }
                }
                datalist.push(obj);
            }
            //renderView(datalist);
            $("nearStsList").endRefreshing();
            $("nearStsList").data=datalist;
        }
    })
}

//获得站点明细
function getStsDetail(stsdata){
    var data = JSON.parse(stsdata.replace("**YGKJ","").replace("YGKJ##",""));
    var lines=data.jsonr.data.lines.filter(function(line){ return line.line.direction==direction});//正方向
    var stsname=data.jsonr.data.sn;
    var sdata=[];
    for(let i = 0; i < lines.length ; i++){
        var stnStates=lines[i].stnStates;//下一班车集合
        var arrivalTime="";
        var otherTime="下一班时间";
        
        if(stnStates.length>0){
            arrivalTime=getArrivalTime(stnStates[0].arrivalTime);
        }else{
            arrivalTime=lines[i].line.desc;
        }
        $console.info(arrivalTime+"分钟")
        //生成下一班时间数据
        // if(stnStates.length>1){
        //     for(let j=0;j<stnStates.length;j++){
        //         if(j=0){
        //             arrivalTime=getArrivalTime(stnStates[j].arrivalTime);
        //         } else if(j=1){
        //             otherTime+=getArrivalTime(stnStates[j].arrivalTime);
        //         }else{
        //             otherTime+=";"+getArrivalTime(stnStates[j].arrivalTime);
        //         }
        //     }
        // }else if(stnStates.length==0){
        //     arrivalTime=lines[i].line.desc;
        // }else{
        //     arrivalTime=getArrivalTime(stnStates[0].arrivalTime);
        //     otherTime="下一班时间";
        // }
        var obj={
            lineName:{
                text:lines[i].line.name+"路"
            },
            lineId:{
                text:lines[i].line.lineId
            },
            wokingtime:{
                text:"首 "+lines[i].line.firstTime + " 末 "+lines[i].line.lastTime
            },
            nextStName:{
                text:"> 下一站·"+lines[i].nextStation.sn
            },
            nextStid:{
                text:lines[i].nextStation.sId
            },
            ariTime:{
                text:arrivalTime+""
            },
            otTime:{
                text:otherTime
            }
        }
        sdata.push(obj);
    }
    stationDetail(sdata,stsname);
}
//渲染站点明细列表
function stationDetail(sdata,sname){
    $ui.push({
        props: {
            title: sname,
            id:"stnDeatil"
        },
        views: [{
            type: "list",
            props: {
                id: "stationDetail",
                rowHeight:80,
                data:sdata,
                bgcolor:$color("#f3f4f4"),
                template:[{
                    type:"label",
                    props:{
                        id:"lineName",
                        font: $font("bold",17),
                        autoFontSize: true
                    },
                    layout:function(make,view){
                        make.top.left.inset(15)
                    }
                },{
                    type:"label",
                    props:{
                        id:"nextStName",
                        font:$font(13),
                        textColor:$color("darkGray"),
                        autoFontSize:false
                    },
                    layout:function(make,view){
                        var preView=$("lineName");
                        make.top.equalTo(preView.bottom).inset(10);
                        make.left.equalTo(preView.left)
                    }
                },{
                    type:"label",
                    props:{
                        id:"wokingtime",
                        font:$font(10),
                        textColor:$color("lightGray"),
                        autoFontSize:false
                    },
                    layout:function(make,view){
                        var preView=$("nextStName");
                        //make.top.equalTo(preView.bottom).inset(10);
                        make.left.equalTo(preView.left)
                        make.top.equalTo(preView.bottom).inset(2)
                    }
                },{
                    type:"label",
                    props:{
                        id:"ariTime",
                        font:$font(15),
                    },
                    layout:function(make,view){
                        var preView=$("lineName");
                        //make.left.equalTo(preView.right);
                        make.right.inset(25)
                        make.centerY.equalTo(preView.centerY);
                    }
                },{
                    type:"label",
                    props:{
                        id:"otTime",
                        font:$font(13),
                        textColor:$color("darkGray"),
                    },
                    layout:function(make,view){
                        var preView=$("ariTime");
                        //make.left.equalTo(preView.right);
                        make.right.equalTo(preView.right);
                        make.centerY.equalTo($("nextStName").centerY);
                    }
                }],
                //list的头，放置搜索框和tab按钮
                header: {
                    type: "view",
                    props: {
                        height: 50,
                        //bgcolor: $color("white")
                    },
                    views: [{
                        type: "tab",
                        props: {
                        id: "direcTab",
                        index: direction,
                        items: ["正方向", "反方向"],
                        tintColor: $color("#666666")
                        },
                        layout: function(make,view) {
                        make.center.equalTo(view.center);
                        },
                        events: {
                        changed: function(sender) {
                            $("stnDeatil").endFetchingMore()
                            var direc = sender.index
                            $cache.set("direction", direc);
                        }
                        }
                    }]
                },
            },
            layout:$layout.fill,
            events: {
                
            }
        }]
    })
}

function getArrivalTime(unixtime){
    var ariDate=new Date(unixtime);
    var ariHours=ariDate.getHours();
    var ariMinute=ariDate.getMinutes();
    var now=new Date().getTime();
    var minute = 1000 * 60;
    var diffminute=Math.round((unixtime-now)/minute);
    
    if(diffminute<0){
        return "已到达";
    }else if(diffminute>=60){
        return (ariHours<10?'0'+ariHours:ariHours)+":"+(ariMinute<10?'0'+ariMinute:ariMinute)
    }else{
        return diffminute+"分";
    }
    
}
function setUrl(lat,lng){
    getCityCodeUrl="https://api.chelaile.net.cn/goocity/city!localCity.action?s=IOS&gpsAccuracy=65.000000&gpstype=wgs&push_open=1&vc=10554&lat="+lat+"&lng="+lng;
    getNearStsUrl="https://api.chelaile.net.cn/bus/stop!homePageInfo.action?type=1&act=2&gpstype=wgs&gpsAccuracy=65.000000&cityId=008&hist=&s=IOS&sign=&dpi=3&push_open=1&v=5.50.4&lat="+lat+"&lng="+lng;
}
updateLoc();
