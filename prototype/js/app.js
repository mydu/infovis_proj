var myapp = angular.module('sortableApp', ['ui.sortable']);


    myapp.controller('sortableController', function ($scope) {
    var tmpList = [];

    var vis_fit = d3.select("#vis_fit").append("svg")
              .attr("class","vis_fit")
              .attr("width", 400)
              .attr("height", 960);
    var vis_migration = d3.select("#vis_migration").append("svg")
              .attr("class","vis_migration")
              .attr("width", 700)
              .attr("height", 960);

    var width = 500,
    height = 300,
    radius = Math.min(width, height) / 2;

    var color = d3.scale.category10();

    var arc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    var labelArc = d3.svg.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

    var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d.value;});
    var vis_change = d3.select("#vis_change").append("svg")
              .attr("width", width)
              .attr("height", height)
              .append("g")
              .attr("class","change")
              .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    // $scope.rawScreens = [["T1_IMFIT","T2_IMFIT","T3_IMFIT"],[]];
    
    $scope.list1 = ["T1_IMFIT","T2_IMFIT","T3_IMFIT","T1_Level2","T2_Level2","T3_Level2"]
    $scope.list2 = ["T1_IMFIT","T2_IMFIT"]
    $scope.list3 = ["T1_Level2","T2_Level2"]
    
    $scope.sortingLog = [];
    $scope.sortableOptions = {
      placeholder: "app",
      connectWith: ".apps-container",
      stop:function(event,ui){
        // console.log(ui.item.sortable.droptarget.attr('id'));
        updateSets(vis_fit,"FIT",$scope.list2,600,400);
        updateSets(vis_migration,"migrate",$scope.list3,960,700);
      }
    };

    d3.csv("student_flow_aggregated_file.csv")
        .get(function(error, data) {
            if(error) {
                console.log(error);
                return;
            }
            extractID(data);
            MData.cf = crossfilter(data);
            MData.cf["T1_Level2"] = MData.cf.dimension(function(d) {return d["T1_Level2"];})
            MData.cf["T2_Level2"] = MData.cf.dimension(function(d) {return d["T2_Level2"];})
            MData.cf["T3_Level2"] = MData.cf.dimension(function(d) {return d["T3_Level2"];})
            MData.cf["T1_IMFIT"] = MData.cf.dimension(function(d) {return d["T1_IMFIT"];})
            MData.cf["T2_IMFIT"] = MData.cf.dimension(function(d) {return d["T2_IMFIT"];})
            MData.cf["T3_IMFIT"] = MData.cf.dimension(function(d) {return d["T3_IMFIT"];})
            MData.cf["change"] = MData.cf.dimension(function(d) {return d["change"];})
            MData.cf["migrate"] = MData.cf.dimension(function(d) {return d["migrate"];}) 
            MData.cf["FIT"] = MData.cf.dimension(function(d) {return d["fit"];}) 
            updateSets(vis_fit,"FIT",$scope.list2,600,400);
            updateSets(vis_migration,"migrate",$scope.list3,960,700);
            updateChart();
    }); 
    // $scope.logModels = function () {
    //   $scope.sortingLog = [];
    //   for (var i = 0; i < $scope.rawScreens.length; i++) {
    //     var logEntry = $scope.rawScreens[i].map(function (x) {
    //       return x.title;
    //     }).join(', ');
    //     logEntry = 'container ' + (i+1) + ': ' + logEntry;
    //     $scope.sortingLog.push(logEntry);
    //   }
    // };
    function updateChart(){
      var changeAgg=MData.cf["change"].group();
      console.log(changeAgg.top(Infinity));
      var g = vis_change.selectAll(".arc")
                .data(pie(changeAgg.top(Infinity)))
                .enter().append("g")
                .attr("class", "arc");

        g.append("path")
            .attr("d", arc)
            .style("fill", function(d) { return color(d.data.key); })
            .on("click",function(d){
                clearFilter();
                MData.cf["change"].filterExact(d.data.key);
                d3.select(".FIT").datum(MData.cf["FIT"].bottom(Infinity)).call(MData.fitChart);
                d3.select(".migrate").datum(MData.cf["FIT"].bottom(Infinity)).call(MData.migrateChart);
            });

        g.append("text")
            .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
            .attr("dy", ".35em")
            .text(function(d) { return d.data.key;});
    }
    // $scope.updateSets=function(){
    function updateSets(vis,attr,dim,w,h){
        clearFilter();
        if(dim.length>1){

          vis.select("g").remove();
          var paraset=vis.append("g")
              .attr("class",attr)
              .attr("transform","rotate(-90)translate(-"+w+",0)");

          if(attr==="FIT"){
            MData.fitChart = d3.parsets()
                      .width(w)
                      .height(h)
                      .value(function(d){return d.count;})
                      .dimensionFormat(gradeFormat)
                      .dimensions(dim)
                      .tension(0.5);
            paraset.datum(MData.cf[attr].bottom(Infinity)).call(MData.fitChart);
          }
          if(attr==="migrate"){
            MData.migrateChart = d3.parsets()
                      .width(w)
                      .height(h)
                      .value(function(d){return d.count;})
                      .dimensionFormat(gradeFormat)
                      .dimensions(dim)
                      .tension(0.5);
            paraset.datum(MData.cf[attr].bottom(Infinity)).call(MData.migrateChart);
          }
            

          // d3.select("#vis").select("svg").remove();
          // var vis = d3.select("#vis").append("svg")
          
          
          
          // if (attr==="FIT") paraset.datum(MData.cf["FIT"].bottom(Infinity)).call(chart);
          // if (attr==="migrate") paraset.datum(MData.cf["migrate"].bottom(Infinity)).call(chart);
          
          d3.selectAll(".paraGroup").selectAll("path").on("click",function(d){
            // console.log(this.parentNode.parentNode)
            console.log(d);
            // MData.cf[d.dimension].filter(null);
            clearFilter();
            MData.cf[d.dimension].filterExact(d.name);
            MData.cf[d.parent.dimension].filterExact(d.parent.name);
            if (d.parent.parent.name!==undefined) MData.cf[d.parent.parent.dimension].filterExact(d.parent.parent.name);
            if(d3.select(this.parentNode.parentNode).attr("class")==="FIT") vis.select(".migrate").datum(MData.cf["migrate"].bottom(Infinity)).call(MData.migrateChart);
            if(d3.select(this.parentNode.parentNode).attr("class")==="migrate") {
              console.log("updateFit")
              d3.select(".FIT").datum(MData.cf["FIT"].bottom(Infinity)).call(MData.fitChart);
            }
            var changeAgg=MData.cf["change"].group();
             console.log(changeAgg.top(Infinity));
             console.log(d3.select(".change").selectAll("path"));
             vis_change.selectAll("path").data(pie(changeAgg.top(Infinity)))
                                          .transition().duration(500)
                                          .attrTween("d", arcTween);
          });
          d3.selectAll(".category").on("click",function(d){
            // console.log(this.parentNode.parentNode)
            // MData.cf[d.dimension.name].filter(null);
            // console.log(d);
            clearFilter();
            MData.cf[d.dimension.name].filterExact(d.name);
            if(d3.select(this.parentNode.parentNode).attr("class")==="FIT") d3.select(".migrate").datum(MData.cf["migrate"].bottom(Infinity)).call(MData.migrateChart);
            if(d3.select(this.parentNode.parentNode).attr("class")==="migrate") {
              console.log("updateFit")
              d3.select(".FIT").datum(MData.cf["FIT"].bottom(Infinity)).call(MData.fitChart);
            }
            var changeAgg=MData.cf["change"].group();
            console.log(changeAgg.top(Infinity));
            vis_change.selectAll("path").data(pie(changeAgg.top(Infinity)))
                                          .transition().duration(500)
                                          .attrTween("d", arcTween);
          });
          // });
      }
      else{
        // d3.select("#vis").select("svg").remove();
         vis.select("g").remove();
      }
    }
    function clearFilter(){

      MData.cf["change"].filter(null);
      MData.cf["T1_IMFIT"].filter(null);
      MData.cf["T2_IMFIT"].filter(null);
      MData.cf["T3_IMFIT"].filter(null);
      MData.cf["T1_Level2"].filter(null);
      MData.cf["T2_Level2"].filter(null);
      MData.cf["T3_Level2"].filter(null);
    }
    function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) { return arc(i(t)); };
        }   
  });
