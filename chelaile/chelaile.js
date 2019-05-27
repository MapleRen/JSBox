const version = 1.2; //版本号
var getCityCodeUrl;
var getNearStsUrl;
var getstationDetailUrl;
var getLineDetailUrl;
var lat;
var lng;
var datalist=[]
var direction=$cache.get("direction")||0;
var cityId="";
var cityName="";

//更新当前地理位置
function updateLoc(){
    //获得当前地理位置,设置url
    $location.fetch({
        handler: function(resp) {
            lat = resp.lat.toFixed(6);
            lng = resp.lng.toFixed(6);
            getCityCodeUrl="https://api.chelaile.net.cn/goocity/city!localCity.action?s=IOS&gpsAccuracy=65.000000&gpstype=wgs&push_open=1&vc=10554&lat="+lat+"&lng="+lng;
            $http.get({
                url: getCityCodeUrl,
                handler: function(resp) {
                    console.log(resp)
                    if(resp.response!=null){
                        var data = JSON.parse(resp.data.replace("**YGKJ","").replace("YGKJ##",""));
                        cityId=data.jsonr.data.localCity.cityId;
                        cityName=data.jsonr.data.localCity.cityName;
                        if(cityId==-1){
                            $ui.toast("暂不支持当前城市...")
                        }else{
                            getNearStsUrl="https://api.chelaile.net.cn/bus/stop!homePageInfo.action?type=1&act=2&gpstype=wgs&gpsAccuracy=65.000000&cityId="+cityId+"&hist=&s=IOS&sign=&dpi=3&push_open=1&v=5.50.4&lat="+lat+"&lng="+lng;
                            refreshNearSts();
                        }
                    }else{
                        $ui.toast("请求失败...")
                    }
                   
                    //$console.info(cityName+":"+cityId);
                    
                }
            })
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
              font: $font("bold", 18),
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
                      make.centerY.equalTo(preView.centerY)
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
                $ui.toast("加载中...",1)
                var stsName=data.nearSts_sn.text;
                var id=data.id.text;
                getstationDetailUrl="https://api.chelaile.net.cn/bus/stop!stationDetail.action?&destSId=-1&gpsAccuracy=65.000000&lorder=1&stats_act=refresh&stationId="+id+"&cityId="+cityId+"&sign=&stats_referer=nearby&s=IOS&dpi=3&push_open=1&v=5.50.4";
                $http.get({
                    url: encodeURI(getstationDetailUrl),
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

function makeStsData(jsondata){
    var lines=jsondata.jsonr.data.lines.filter(function(line){ return line.line.direction==direction});//正方向
    var stsname=jsondata.jsonr.data.sn;
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
            },
            endSn:{
                text:lines[i].line.endSn
            },
            targetOrder:{
                text:lines[i].targetStation.order//当前站点的order
            }
        }
        sdata.push(obj);
    }
    return sdata;
}

async function  getStsData(){
    $ui.loading(true);
    var resp=await $http.get(getstationDetailUrl)
    var data=JSON.parse(resp.data.replace("**YGKJ","").replace("YGKJ##",""));
    $("stnDetailList").data=makeStsData(data);
    $("stnDetailList").endFetchingMore();
    $("stnDetailList").endRefreshing();
    $ui.loading(false);
}


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
            //$console.info(resp.data.replace("**YGKJ","").replace("YGKJ##",""));
            var nearSts=data.jsonr.data.nearSts;
            //$console.info(nearSts);
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
            $("nearStsList").endRefreshing();
            $("nearStsList").data=datalist;
        }
    })
}

//获得站点明细
function getStsDetail(stsdata){
    var data = JSON.parse(stsdata.replace("**YGKJ","").replace("YGKJ##",""));
    renderStationDetail(makeStsData(data),data.jsonr.data.sn);
}
//渲染站点明细列表
function renderStationDetail(sdata,sname){
    $ui.push({
        props: {
            title: sname,
            id:"stnDeatilView"
        },
        views: [{
            type: "list",
            props: {
                id: "stnDetailList",
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
                            $("stnDetailList").endFetchingMore()
                            var direc = sender.index;//方向
                            direction=direc;
                            $cache.set("direction", direc);
                            getStsData();
                        }
                        }
                    }]
                },
            },
            layout:$layout.fill,
            events: {
                pulled: function(sender) {
                    getStsData();
                },
                didSelect:function(sender, indexPath, data){
                    var url=encodeURI("https://api.chelaile.net.cn/bus/line!lineDetail.action?mac=&userId=&vc=10555&cityState=0&gpsAccuracy=65.000000&stats_order=1-2&sign=&s=IOS&stats_referer=stationDetail&v=5.50.5&lineId="+data.lineId.text+"&cityId="+cityId+"&targetOrder="+data.targetOrder.text);
                    $ui.loading(true)
                    $http.get({
                        url: url,
                        handler: function(resp) {
                            var data = getJson(resp.data);
                            var msg="暂无信息！";
                            if(data.jsonr.data.buses.length>0){
                                var nextorder=data.jsonr.data.buses[0].order
                                var nextStation=data.jsonr.data.stations.filter(function(st){return st.order==nextorder})[0]
                                $console.info(nextStation);
                                msg="下一班车即将到达："+nextStation.sn;
                            }
                            $ui.loading(false)
                            $ui.alert({
                                title:"线路信息",
                                message:msg,
                                actions:[{
                                    title:"取消",
                                    handler:function(){

                                    }
                                }]
                            })
                        }
                      })
                }
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
function getJson(data){
    //$console.info(data)
    return JSON.parse(data.replace("**YGKJ","").replace("YGKJ##",""));
}
(async function checkUpdate() {
    const versionURL = 'https://raw.githubusercontent.com/MapleRen/JSBox/master/chelaile/versioninfo.json'
    let resp = await $http.get(versionURL)
    const jsURL='https://raw.githubusercontent.com/MapleRen/JSBox/master/chelaile/chelaile.js&icon=icon_087.png&types=1&version='+resp.data.version+'&name=车来了&author=Ren'
    const updateURL = `jsbox://install?url=${encodeURI(jsURL)}`
    console.log(resp)
    if (version >= resp.data.version || resp.response==null) return
    $ui.action({
      title: '更新提示',
      message: '发现新版本'+resp.data.version+', \n(是否更新 ?更新完请重新启动新版本。)\n'+resp.data.msg,
      actions: [{
          title: '更新',
          handler: () => {
            $app.openURL(updateURL)
            $ui.toast('正在安装更新...')
            $app.close();
          }
        },
        {
          title: '取消'
        }
      ]
    })
  })()

updateLoc();
