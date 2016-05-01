var STATE = {
    majorIDMap: null,
    majorList: [],
    majorFill: d3.scale.category20b(),
    majorLegend: null,
    terms: ["HighestLevel2","T1_Level2", "T2_Level2", "T3_Level2"],
    scores: ["1-15","16-19","20-23","24-27","28-32","33-36"],
    scoreID: [15,19,23,27,32,36],
    scoreIDMap: null,
    scoreMap:null,
    scoreMap_i:null,
    fitGrades: ["Poor", "Moderate", "Good"],
    // fitGradeIDMap: null,
    fits: ["T1_IMFIT", "T2_IMFIT", "T3_IMFIT"],
    // fitIDMap: null,
    gender:["Male","Female"],
    selectTerm:null,
    selectMajor:null,
    selectScore:23,
    clusters:null,
    majorSankey: null,
    fitParset: null,
    clusterBubble:null,
    sortBy:"bySize"
};

function extendAttr(data){
    STATE.majorList=_.uniq(_.pluck(data,"T1_Level2"))
    STATE.majorIDMap=_.object(STATE.majorList,_.range(STATE.majorList.length))
    STATE.scoreIDMap=_.object(STATE.scores,STATE.scoreID)

    _.each(data,function(d){
        d.fits = "";
        d.majors="";
        _.each(STATE.terms,function(i){
            d[i+"_id"]=STATE.majorIDMap[d[i]];
            d.majors += d[i+"_id"];
        });
        _.each(STATE.fits,function(i){
            d.fits += fitTextToInt(d[i]);
        });
        d.count=parseInt(d.count);
        d.scoreid=STATE.scoreIDMap[d.actcat];

        if(d["T1_Level2"]===d["T2_Level2"]) d.changeT2="0";
        if(d["T1_Level2"]!==d["T2_Level2"]) d.changeT2="1";
        if(d["T1_Level2"]===d["T2_Level2"] && d["T2_Level2"]===d["T3_Level2"]) d.changeT3="00";
        if(d["T1_Level2"]===d["T2_Level2"] && d["T2_Level2"]!==d["T3_Level2"]) d.changeT3="01";
        if(d["T1_Level2"]!==d["T2_Level2"] && d["T2_Level2"]===d["T3_Level2"]) d.changeT3="10";
        if(d["T1_Level2"]!==d["T2_Level2"] && d["T2_Level2"]!==d["T3_Level2"]) d.changeT3="11";
    });

    function fitTextToInt(a) {
        var c = a.charAt(0);
        switch(c) {
            case 'P':
                return 0;
            case 'M':
                return 1;
            case 'G':
                return 2;
        }
    } 
    // console.log(data);
}

function aggAttr(data) {
    STATE.cf = crossfilter(data);

    STATE.cf["HighestLevel2_id"] = STATE.cf.dimension(function(d) {return d["HighestLevel2_id"];})
    STATE.cf["T1_Level2_id"] = STATE.cf.dimension(function(d) {return d["T1_Level2_id"];})
    STATE.cf["T2_Level2_id"] = STATE.cf.dimension(function(d) {return d["T2_Level2_id"];})
    STATE.cf["T3_Level2_id"] = STATE.cf.dimension(function(d) {return d["T3_Level2_id"];})
    //data for fitparset
    STATE.cf["fits"] = STATE.cf.dimension(function(d) {return d.fits;})
    //data for majorsankey
    STATE.T12=STATE.cf.dimension(function(d){return "T1"+d["T1_Level2_id"]+"|"+"T2"+d["T2_Level2_id"];})
            .group().reduceSum(function(d){return d.count;}).top(Infinity);

    STATE.T23=STATE.cf.dimension(function(d){return "T2"+d["T2_Level2_id"]+"|"+"T3"+d["T3_Level2_id"];})
            .group().reduceSum(function(d){return d.count;}).top(Infinity);
}

function generateCluster(){
    $("#all").addClass("active").siblings().removeClass("active");

    var cluster1=_.filter(STATE.scoreID,function(d){ return d<=STATE.selectScore});
    var cluster2=_.filter(STATE.scoreID,function(d){ return d>STATE.selectScore});
    var interval1="1-"+cluster1[cluster1.length-1];
    var interval2=(cluster1[cluster1.length-1]+1)+"-"+cluster2[cluster2.length-1];

    STATE.scoreMap_i=_.invert(_.object([interval1,interval2],[5,36]));

    //data for cluster
    STATE.scoreMap=d3.map();
    for(var i in STATE.scoreID) {
            // if (_.contains(cluster1,STATE.scoreID[i])) STATE.scoreMap[STATE.scoreID[i]]=5;
            // if (_.contains(cluster2,STATE.scoreID[i])) STATE.scoreMap[STATE.scoreID[i]]=36;
            if (_.contains(cluster1,STATE.scoreID[i])) {
                STATE.scoreMap.set(STATE.scoreID[i], 5);
            }
            if (_.contains(cluster2,STATE.scoreID[i])) STATE.scoreMap.set(STATE.scoreID[i], 36);
            
    }

    var groupT2=STATE.cf.dimension(function(d){return d.changeT2;}).group().reduceSum(function(d){return d.count;}).top(Infinity);
    var groupT3=STATE.cf.dimension(function(d){return d.changeT3;}).group().reduceSum(function(d){return d.count;}).top(Infinity);

   
    var total=_.reduce(_.pluck(groupT2,"value"),function(memo, num){ return memo + num; }, 0);
    
    var cluster =STATE.cf.dimension(function(d) {return d["Gender"]+"|"+STATE.scoreMap.get(d.scoreid)+"|"+d["changeT2"]+"|"+d["changeT3"]})
                         .group().reduceSum(function(d){return d.count;}).top(Infinity);
    // console.log(cluster);

    var min=d3.min(_.pluck(cluster,"value"));
    var max=d3.max(_.pluck(cluster,"value"));
    // console.log([min,max])
    // var norm=d3.min(_.pluck(cluster,"value").filter(function(num){return num>100;}));
    var norm=min>(max/20) ? min : (max/20);
    // var norm=max/10;
    var sampleData=[];

    cluster.forEach(function(d){
      if(d.value>0){
        var scalor=Math.floor(d.value/norm);

        d3.range(scalor).forEach(function(){
            var item={
              gender: d.key.split("|")[0],
              score:  d.key.split("|")[1],
              changeT2:  d.key.split("|")[2],
              changeT3:  d.key.split("|")[3]
            }
            sampleData.push(item);
        })
      }  
    });

    return { Total:total,
             groupT2:groupT2,
             groupT3:groupT3,
             data:sampleData,
             sampling:min
    }
}
function clearFilter(){

      STATE.cf["T1_Level2_id"].filter(null);
      STATE.cf["T2_Level2_id"].filter(null);
      STATE.cf["T3_Level2_id"].filter(null);
      STATE.cf["HighestLevel2_id"].filter(null);
      aggAttr(STATE.data);
 }
function gradeFormat(d) {
    var a = d.charAt(1);
    switch(a) {
        case '1':
            return "T1";
            break;
        case '2':
            return "T2";
            break;
        case '3':
            return "T3";
            break;
    }
    return d;
}
