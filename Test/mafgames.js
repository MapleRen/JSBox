const isUpperVersion = $request.url.indexOf('UpperVersion') > -1;
const prefix = "tileRPG_";

function fileJudge(){
    if($request.url.indexOf('/language/') > -1){
        return "language";
    }else if($request.url.indexOf('/setting/') > -1){
        return "setting";
    }else if($request.url.indexOf('/character/') > -1){
        return "character";
    }else if($request.url.indexOf('/character_skill/')>-1){
        return "character_skill";
    }
}

function modifyData(data,mod,key){
    for(var i,item;item=mod[i++];){
        var obj = data.find(x=> x[key] == item[key]);
        if(obj == null) continue;
        Object.assign(item,obj)
    }
}

if(isUpperVersion){
   
    if($request.url.indexOf('9295') > -1){
        $notify("TileRPG", "", "文件重定向");
        var mStatus = "HTTP/1.1 302 Found";
        var mHeaders = {"Location": $request.url.replace(/9295/g,"0")};
        var mResponse = {
            status:mStatus,
            headers:mHeaders
        }
        $done(mResponse);
    }else{
        $done({});
    }
    
}else{
    var body = JSON.parse($response.body);
    var type = fileJudge();
    var config = JSON.parse($prefs.valueForKey(`${prefix}${type}`)||[]);
    switch(type){
        case "setting":
            modifyData(body,config,'idx');
            break;
        case "character":
            modifyData(body,config,'id');
            break;
        case "character_skill":
            modifyData(body,config,'idx');
            break;
    }
    $notify("TileRPG", "", `${type}文件修改完毕`);
    $done(JSON.stringify(body));
}