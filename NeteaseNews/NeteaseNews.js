/**
 * @Version 1.0
 * @author Ren
 */
// 参考：movie-list.js   @ryanfwy
//链接：https://github.com/cyanzhong/xTeko/blob/master/extension-scripts/movie-list.js
$app.strings = {
    "en": {
        "main_title":"163News",
        "war":"Military",
        "tech":"Science",
        "edu":"Education",
        "car":"Car",
        "ente":"Entertainment",
        "game":"Game",
        "mobile":"Mobilephone",
        "collect":"Collect",
        "news":"News",
        "share":"Share",
        "setting":"Setting"
    },
    "zh-Hans": {
        "main_title":"网易新闻-入门尝试",
        "war":"军事",
        "tech":"科学",
        "edu":"教育",
        "car":"汽车",
        "ente":"娱乐",
        "game":"游戏",
        "mobile":"手机",
        "collect":"收藏",
        "news":"新闻",
        "share":"分享",
        "setting":"设置"
    }
}

var categories=[
    {type:'BAI6RHDKwangning',name:$l10n("game")},
    {type:'D90S2KJMwangning',name:$l10n("tech")},
    {type:'BA8FF5PRwangning',name:$l10n("edu")},
    {type:'BAI6I0O5wangning',name:$l10n("mobile")},
    {type:'BA8DOPCSwangning',name:$l10n("car")},
    {type:'BA10TA81wangning',name:$l10n("ente")},
    {type:'BAI6JOD9wangning',name:$l10n("数码")},
    {type:'BDC4QSV3wangning',name:$l10n("健康")},
    {type:'CKKS0BOEwangning',name:$l10n("艺术")},
    {type:'BV5U6ON6wangning',name:$l10n("苹果")},
    {type:'BV5U5EOVwangning',name:$l10n("安卓")},
    {type:'BAI67OGGwangning',name:$l10n("war")},
]
var articleList=[]
var pcount=0
var ecount=10
var category=categories[0].type //默认类别
var getNewsUrl="http://3g.163.com/touch/reconstruct/article/list/"
Array.prototype.move = function(from, to) {
    var fromSec = from.section,
      fromRow = from.row,
      toSec = to.section,
      toRow = to.row
    var cellData = this[fromSec].rows[fromRow]
    this[fromSec].rows.splice(fromRow, 1)
    this[toSec].rows.splice(toRow, 0, cellData)
  }


//收藏文件
var COLLECTION_FILE=$file.read("Collection.conf")
var COLLECTION_DATA= typeof(COLLECTION_FILE) == "undefined" ? [] : JSON.parse(COLLECTION_FILE.string)
//新闻分类栏
var CATEGORIES_FILE=$file.read("Categories.conf")
var CATEGORIES_DATA= typeof(CATEGORIES_FILE) == "undefined" ? [] : JSON.parse(CATEGORIES_FILE.string)
//list模板
const template=[{
    type:"image",
    props:{
        id:"image-view",
        bgcolor:$color("clear")
    },
    layout:function(make,view){
        make.size.equalTo($size(100, 80))
        make.left.top.equalTo(16)
    }
},
{
    type:"label",
    props:{
        id:"title-label",
        font:$font("medium", 20),
        lines: 0
    },
    layout:function(make){
        var view=$("image-view")
        make.left.equalTo(view.right).offset(10)
        make.right.top.inset(16)
    }
},
{
    type:"label",
    props:{
        id:"date-label",
        textColor:$color("#666666"),
        font:$font(12),
    },
    layout:function(make){
        var view=$("title-label")
        make.bottom.right.equalTo(view.left.bottom).offset(-10)
    }
}]

//新闻列表视图
news={
    type:"view",
    props:{
        id:"news",
        info:"news",
        hidden:false
    },
    views:[{
        type: "menu",
        props: {
            items:categories.map(function(item){return item.name})
        },
        layout: function(make, view) {
            make.left.top.right.equalTo(0)
            make.height.equalTo(44)
        },
        events: {
            changed:function(sender){
                pcount=0
                var onType=categories[sender.index].type
                queryAddins(onType)
            }
        }
    },{
        type:"list",
        props:{
            rowHeight:114,
            template:template,
            footer:{
                type:"view",
                props:{
                    height:50
                },
                views:[{
                    type:"label",
                    props:{
                        id:"loading",
                        font:$font(12),
                        align: $align.center,
                        textColor: $color("lightGray")
                    },
                    layout:function(make,view){
                        make.height.equalTo(20)
                        make.centerX.equalTo(view.super)
                        make.top.inset(10)
                    }
                }]
            },
            actions:[{
                title:$l10n("collect"),
                handler:function(sender,indexPath){
                    var data=sender.object(indexPath)
                    collectNews(data)
                }
            }],
        },
        layout:function(make){
            make.left.bottom.right.equalTo(0)
            make.top.equalTo($("menu").bottom)
        },
        events:{
            didSelect:function(view,index){
                //openURL(view.object(index).url)
                $safari.open({ url: view.object(index).url })
            },
            pulled:function(){
                pcount=0
                queryAddins(category);
            },
            didReachBottom:function(sender){ 
                var onType=categories[$("menu").index].type
                $("loading").text="加载中..."
                $delay(1.5, function() {
                    var tempcount=pcount+10;
                    $http.get({ 
                        url: getNewsUrl+onType+"/"+tempcount+"-"+ecount+".html",
                        handler: function(resp) {
                            pcount+=10;
                            sender.endFetchingMore()
                            var query=str2json(resp.data);
                            render(query,true);
                            $("loading").text = ""
                        }
                    })
                })
            }
        }
    }],
    layout:$layout.fill
}

//收藏列表视图
collection={
    type:"list",
    props:{
        id:"collection",
        info:"collection",
        hidden:true,
        reorder:true,
        rowHeight:114,
        template:template,
        data:COLLECTION_DATA,
        actions:[{
            title:"delete",
            handler:function(sender,indexPath){
                saveCollectionFile(sender.data)
            }
        }]
    },
    layout:$layout.fill,
    events:{
        didSelect:function(view,index){
            //openURL(view.object(index).url)
            $safari.open({ url: view.object(index).url })
      },
        //长按拖动
        reorderMoved: function(from, to) {
            $("collection").data.move(from,to)
      },
        reorderFinished: function() {
            saveCollectionFile($("collection").data)
      }
    }
}


const settingtemplate=[{
    type:"label",
    props:{
        id:"oprname"
    },
    layout:function(make,view){
        make.centerY.equalTo(view.super)
        make.left.inset(15)
    }
},
{
    type:"label",
    props:{
        id:"value",
    },
    layout: function(make, view) {
        make.centerY.equalTo(view.super)
        make.right.inset(10)
      }
}
]
//设置中心视图
setting={
    type:"list",
    props:{
        id:"setting",
        info:"setting",
        hidden:true,
        data:[{
            title:"常用",
            rows:[
                {
                    oprname:{
                        text:"自定义新闻分类"
                    }
                },
                {
                    oprname:{
                        text:"测试"
                    }
                }
            ]
        }],
        template:settingtemplate
    },
    layout:$layout.fill,
    events:{
        didSelect:function(view,indexPath){
            activeSettingMenu(indexPath)
        }
    }
}
//底部按钮宽度
var btnwidth=$device.info.screen.width / 3

$ui.render({
    props: {
        title: $l10n("main_title")
    },
    views: [{
        type:"menu",
        props:{
            id:"bottm_menu"
        },
        layout:function(make){
            make.height.equalTo(50)
            make.left.bottom.right.inset(0)
        },
        views:[{
            type:"button",
            props:{
                bgcolor:$color("clear")
            },
            layout:function(make){
                make.width.equalTo(btnwidth)
                make.left.top.bottom.inset(0)
            },
            views:[{
                type:"image",
                props: {
                    id: "news_button",
                    icon: $icon("067", $color("clear"), $size(72, 72)),
                    bgcolor: $color("clear"),
                    tintColor: $color("#ff3333")
                  },
                  layout: function(make, view) {
                    make.centerX.equalTo(view.super)
                    make.width.height.equalTo(25)
                    make.top.inset(7)
                  }
            },
            {
                type: "label",
                props: {
                  id: "news_label",
                  text: $l10n("news"),
                  font: $font(10),
                  textColor: $color("darkGray")
                },
                layout: function(make, view) {
                  var preView = view.prev
                  make.centerX.equalTo(preView)
                  make.top.equalTo(preView.bottom).offset(1)
                }
              }
            ],
            events:{
                tapped: function(sender) {
                    activeMenu("news")
                  }
            }
        },
        {
            type:"button",
            props:{
                bgcolor:$color("clear")
            },
            layout:function(make,view){
                //上一个View
                var preView=view.prev
                make.left.equalTo(preView.right)
                make.width.equalTo(btnwidth)
                make.top.bottom.inset(0)
            },
            views:[{
                type:"image",
                props: {
                    id: "collection_button",
                    icon: $icon("061", $color("clear"), $size(72, 72)),
                    bgcolor: $color("clear"),
                    tintColor: $color("lightGray")
                  },
                  layout: function(make, view) {
                    make.centerX.equalTo(view.super)
                    make.width.height.equalTo(25)
                    make.top.inset(7)
                  }
            },
            {
                type: "label",
                props: {
                  id: "collection_label",
                  text: $l10n("collect"),
                  font: $font(10),
                  textColor: $color("lightGray")
                },
                layout: function(make, view) {
                  var preView = view.prev
                  make.centerX.equalTo(preView)
                  make.top.equalTo(preView.bottom).offset(1)
                }
              }
            ],
            events:{
                tapped: function(sender) {
                    activeMenu("collection")
                  }
            }
        },
        {
            type:"button",
            props:{
                bgcolor:$color("clear")
            },
            layout:function(make,view){
                var preView=view.prev
                make.left.equalTo(preView.right)
                make.width.equalTo(btnwidth)
                make.top.bottom.inset(0)
            },
            views:[{
                type:"image",
                props: {
                    id: "setting_button",
                    icon: $icon("002", $color("clear"), $size(72, 72)),
                    bgcolor: $color("clear"),
                    tintColor: $color("lightGray")
                  },
                  layout: function(make, view) {
                    make.centerX.equalTo(view.super)
                    make.width.height.equalTo(25)
                    make.top.inset(7)
                  }
            },
            {
                type: "label",
                props: {
                  id: "setting_label",
                  text: $l10n("setting"),
                  font: $font(10),
                  textColor: $color("lightGray")
                },
                layout: function(make, view) {
                  var preView = view.prev
                  make.centerX.equalTo(preView)
                  make.top.equalTo(preView.bottom).offset(1)
                }
              }
            ],
            events:{
                tapped: function(sender) {
                    activeMenu("setting")
                  }
            }
        }
    ]
    },{
        type:"view",
        props:{
            id:"content"
        },
        layout:function(make){
            var bmenu=$("bottm_menu")
            make.bottom.equalTo(bmenu.top)
            make.left.top.right.inset(0)
        },
        views:[news,collection,setting]
    }]
})

function queryAddins(typekey) {
    category = typekey
    var cacheKey = "cache-" + typekey
    var cache = $cache.get(cacheKey) || []
    if (cache.length > 0) {
      render(cache,false)
    }
    $http.get({
        url: getNewsUrl+typekey+"/"+pcount+"-"+ecount+".html",
        handler: function(resp) {
            var query=str2json(resp.data);
            render(query,false);
            $cache.set(cacheKey,query)
            $("list").endRefreshing()
            
        }
    })  
}
//渲染
function render(data,isBottom){
    if(isBottom){
        $("list").data=$("list").data.concat(data.map(function(item){
            return{
                "image-view":{
                    src:item.imgsrc
                },
                "title-label":{
                    text:item.title
                },
                "date-label":{
                    text:maketime(item.ptime)
                },
                "url":parseUrl(item)
            }
        }))
    }else{
        $("list").data=data.map(function(item){
            return{
                "image-view":{
                    src:item.imgsrc
                },
                "title-label":{
                    text:item.title
                },
                "date-label":{
                    text:maketime(item.ptime)
                },
                "url":parseUrl(item)
            }
        }) 
    }
    
}
//链接转换
function parseUrl(item){
    switch (category) {
        case "BAI6RHDKwangning":
            return "https://3g.163.com/game/article/"+item.docid+".html?clickfrom=channel2016_game_undefined_newslist#offset=2";
        default:
            return item.url || item.skipURL;
    }
}
function str2json(str){
    var starIndex=str.indexOf('[');
    var lastIndex=str.lastIndexOf('})');
    var jsonstr=str.substr(starIndex,lastIndex-29);
    return JSON.parse(jsonstr);
}

function activeMenu(viewId){
    var curViewId=$("content").views.filter(function(item) {
        return item.hidden == false
    })[0].info
    if(viewId!=curViewId){
        $(curViewId + "_button").tintColor = $color("lightGray")
        $(curViewId + "_label").textColor =$color("lightGray")
        $(viewId + "_button").tintColor = $color("#ff3333")
        $(viewId + "_label").textColor=$color("darkGray")
        $(curViewId).hidden = true
        $(viewId).hidden = false
    }
}

function collectNews(item){
    $("collection").insert({
        indexPath:$indexPath(0, 0),
        value:item
    })
    saveCollectionFile($("collection").data)
    $ui.toast("已收藏")
}
function saveCollectionFile(data){
    COLLECTION_DATA=data
    $file.write({
        data: $data({ string: JSON.stringify(data) }),
        path: "Collection.conf"
      })
}

function maketime(datestr){
    var str = datestr;
    //将字符串转换成时间格式
    var timePublish = Date.parse(str.replace(/-/gi,"/"));
    var timeNow = new Date();
    var minute = 1000 * 60;
    var hour = minute * 60;
    var day = hour * 24;
    var month = day * 30;
    var diffValue = timeNow - timePublish;
    var diffMonth = diffValue / month;
    var diffWeek = diffValue / (7 * day);
    var diffDay = diffValue / day;
    var diffHour = diffValue / hour;
    var diffMinute = diffValue / minute;

    if (diffValue < 0) {
        alert("错误时间");
    }
    else if (diffMonth > 3) {
        result = timePublish.getFullYear()+"-";
        result += timePublish.getMonth() + "-";
        result += timePublish.getDate();
        alert(result);
    }
    else if (diffMonth > 1) {
        result = parseInt(diffMonth) + "月前";
    }
    else if (diffWeek > 1) {
        result = parseInt(diffWeek) + "周前";
    }
    else if (diffDay > 1) {
        result = parseInt(diffDay) + "天前";
    }
    else if (diffHour > 1) {
        result = parseInt(diffHour) + "小时前";
    }
    else if (diffMinute > 1) {
        result = parseInt(diffMinute) + "分钟前";
    }
    else {
        result = "刚刚";
    }
    return result;
}

function activeSettingMenu(indexPath){
    var section = indexPath.section
    var row = indexPath.row
    if(section==0){
        if(row==0){
            $ui.push({
                props:{
                    id:"test",
                    title:"自定义"
                },
                views:[
                    {
                        type:"list",
                        props:{
                            id:"diyca",
                            data:[
                                {
                                    title:"展示",
                                    rows:categories.map(function(item){
                                        return item.name
                                    })
                                },
                                {
                                    title:"隐藏",
                                    rows:["5sdasd"]
                                }
                            ],
                            reorder:true
                        },
                        layout:$layout.fill,
                        events:{
                            reorderMoved:function(from,to){
                                categories.move(from.row,to.row)
                                $console.info(categories)
                                $("menu").items=categories.map(function(item){return item.name})

                            }
                        }
                    }
                ]
            })
        }
    }
}
queryAddins(category)
