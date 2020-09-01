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
    for (let index = 0; index < mod.length; index++) {
        var item = mod[index];
        var obj = data.find(x=> x[key] == item[key]);
        if(obj == null) continue;
        Object.assign(obj,item)
    }

}
if(isUpperVersion){
    var version = $prefs.valueForKey('tileRPG_version') || '';
    var versions = version.split('|');
    var flag = false;
    for (let index = 0; index < versions.length; index++) {
        const element = versions[index];
        flag = flag || $request.url.indexOf(`${element}?`)>-1;
    }
    if(flag){
        $notify("TileRPG", "", "文件重定向");
        var mStatus = "HTTP/1.1 302 Found";
        var re = new RegExp(version,"g");
        var mHeaders = {"Location": $request.url.replace(re,"0")};
        var mResponse = {
            status:mStatus,
            headers:mHeaders
        }

        $done(mResponse);
    }
    // $notify("TileRPG", "",'正在加载文件列表1')
    // var versionRequest = {
    //     url:'https://tilerpglive.mafrpgserver.net/v0/gameData/table/getGameTableUpperVersion/0?version=1.15.69&&flatform=ios&&table_version=0&&useridx=0&&loginToken=0&&country=jp&&server=1'
    // }
    // $notify("TileRPG", "",'正在加载文件列表')
    // if($request.url.indexOf(`${version}?`) > -1){
    //     $task.fetch(versionRequest).then(response=>{
    //         $notify("TileRPG", "", "文件列表加载完毕");
    //         $done({body:response.body});
    //     }, reason => {
    //         $notify("TileRPG", "",reason.error)
    //         $done({});
    //     });
    // }else{
    //     $done({});
    // }
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