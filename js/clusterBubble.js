function ClusterBubble(){

    
    var width = 500, height = 350;
        
    var padding = 1;
    
    var clusterPadding = 1;// separation between different-color circles

    var fill = d3.scale.ordinal()
                 .domain(STATE.gender)
                 .range(["#1f77b4","#d62728"])
    var radius_scale = d3.scale.sqrt();

    var svg = d3.select("#cluster").append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class","clusterBubble")

    var clusterLegend=d3.select("#gender_legend").append("svg")
                        .attr("class","genderLegend")
                        // .attr("width", width)
                        .attr("height", 70)

    var actLegend=d3.select("#act_legend").append("svg")
                        // .attr("width",parseInt(d3.select("#act_legend").style("width"),10))
                        .attr("height", 20)

    var slider=d3.slider()
                .scale(d3.scale.ordinal().domain(STATE.scoreID).rangePoints([0, 1]))
                .axis(d3.svg.axis())
                .snap(true)
                .value(STATE.selectScore)
                .on("slide",function(evt,val){
                  STATE.selectScore=val;
                  STATE.clusterBubble.update();
                })
  d3.select("#clusterSlider")
            .call(slider);
             // .call(d3.slider().scale(d3.scale.linear().domain([1,5])).axis(d3.svg.axis()).value(1));
  
  this.update=function() {
       d3.select(".clusterBubble").selectAll("*").remove();

       

      STATE.clusterData=generateCluster();
      console.log(STATE.clusterData);


      var data=STATE.clusterData.data;
      var max_score = d3.max(data, function (d) { return d.score})
      
      var all_center = { 
        "all": {name: (!STATE.selectTerm) ? "All "+STATE.clusterData.Total+" Students": STATE.clusterData.Total+" Students who declared major in " +STATE.selectMajor+" at term "+ STATE.selectTerm, 
                x: 200, 
                y: 200}
          };
      
      var t2_centers = {
        "0": {
              name: "T1=T2( "+_.where(STATE.clusterData.groupT2, {key:"0"})[0].value+" )",
              x: 100,
              y: 200},
        "1": {
        name:"T1!=T2( "+_.where(STATE.clusterData.groupT2, {key:"1"})[0].value+" )", 
              x: 300,
              y: 200},
      }
      var t3_centers={
        "00": {name:"T1=T2=T3( "+_.where(STATE.clusterData.groupT3, {key:"00"})[0].value+" )", 
              x: 100, y: 200},
        "01": {name:"T1=T2!=T3( "+_.where(STATE.clusterData.groupT3, {key:"01"})[0].value+" )",  
              x: 200, y: 200},
        "10": {name:"T1!=T2=T3( "+_.where(STATE.clusterData.groupT3, {key:"10"})[0].value+" )", 
               x: 300, y: 200},
        "11": {name:"T1!=T2!=T3( "+_.where(STATE.clusterData.groupT3, {key:"11"})[0].value+" )",  
                x: 400, y: 200}
      }

      
      STATE.clusters = new Array(2);


      _.each(data, function (elem) {
        elem.radius = radius_scale(elem.score);
        elem.all = 'all';
        elem.cluster=elem.gender;
        // elem.x = _.random(0, width);
        // elem.y = _.random(0, height);
        if (!STATE.clusters[elem.cluster] || (elem.radius > STATE.clusters[elem.cluster].radius)) STATE.clusters[elem.cluster] = elem;
      })

      // console.log(STATE.clusters)
      var maxRadius = d3.max(_.pluck(data, 'radius'));

      var nodes = svg.selectAll("circle")
        .data(data);

      nodes.enter().append("circle")
        .attr("class", "node")
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("r", 1)
        // .style("fill","#1f77b4")
        .style("fill", function (d) { return fill(d.gender); })
        // .on("mouseover", function (d) { showPopover.call(this, d); })
        // .on("mouseout", function (d) { removePopovers(); })

      nodes.transition().duration(500)
        .attr("r", function (d) { return d.radius; })


      // var force = d3.layout.force()
      //               .nodes(data)
      //               .charge([-20]);
     
      var force = d3.layout.force()
                    .nodes(data)
                    .size([width, height])
                    // .gravity(0)
                    .charge(-80)
                    // .on("tick", tick)
                    // .start();

      act_legend(actLegend);
      cluster_legend(clusterLegend);

      draw('all');
      $( ".clusterbtn" ).click(function() {
        $(this).addClass("active").siblings().removeClass("active");
        draw(this.id);
      });

    function draw (varname) {
      if (varname === "all") var foci=all_center;
      if (varname === "changeT2") var foci=t2_centers;
      if (varname === "changeT3") var foci=t3_centers;

      force.on("tick", tick(foci, varname));
      labels(foci)
      force.start();
    }

    function tick (foci, varname) {
      return function (e) {
        for (var i = 0; i < data.length; i++) {
          var o = data[i];
          var f = foci[o[varname]];
          o.y += (f.y - o.y) * e.alpha;
          o.x += (f.x - o.x) * e.alpha;
        }
        nodes
          .each(cluster(10*e.alpha * e.alpha))
          .each(collide(0.2))
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; });
      }
    }

    function labels (foci) {
      svg.selectAll(".label").remove();

      svg.selectAll(".label")
      .data(_.toArray(foci)).enter().append("text")
      .attr("class", "label")
      .style("text-anchor","middle")
      .text(function (d) { return d.name })
      .attr("stoke","#3182bd")
      .attr("transform", function (d) {
        // return "translate(" + (d.x - ((d.name.length)*3)) + ", " + (d.y - 120) + ")";
         return "translate("+d.x+ ", " + (d.y - 120) + ")";
      });
    }

    // Move d to be adjacent to the cluster node.
    function cluster(alpha) {
      return function(d) {
        var cluster = STATE.clusters[d.cluster];
        if (cluster === d) return;
        var x = d.x - cluster.x,
            y = d.y - cluster.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + cluster.radius;
        if (l != r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          cluster.x += x;
          cluster.y += y;
        }
      };
    }
    function collide(alpha) {
      var quadtree = d3.geom.quadtree(data);
      return function(d) {
        var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
            if (l < r) {
              l = (l - r) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    }

}   
    function act_legend(group){
      var distance=parseInt(d3.select("#act_legend").style("width"))-10;
      group.selectAll("circle")
             .data([5,36])
             .enter()
             .append("circle")
             .attr("fill","#636363")
             .attr("r",function(d){return radius_scale(d)})
             .attr("transform",function(d,i){return "translate("+(i*distance+5)+",10)"})
    }
    
    function cluster_legend(group){

      var gender=group.selectAll("g")
                 .data(STATE.gender)
                 .enter()
                 .append("g")
                 .attr("transform",function(d,i){return "translate(10,"+(i*20+30)+")"})

      gender.append("circle")
               .attr("r",5)
               .attr("fill",function(d){return fill(d);})

      gender.append("text")
             .text(function(d){return d;})
             .attr("x",10)
             .attr("y",5)
    }
    function removePopovers () {
      $('.popover').each(function() {
        $(this).remove();
      }); 
    }

    function showPopover (d) {
      $(this).popover({
        placement: 'auto top',
        container: 'body',
        trigger: 'manual',
        html : true,
        content: function() { 
          return d.changeT2+"<br/>"+d.changeT3+"<br/>"+d.score }
      });
      $(this).popover('show')
    }
    // var getCenters = function (vname, size) {
    //   var centers, map;
    //   centers = _.uniq(_.pluck(data, vname)).map(function (d) {
    //     return {name: d, value: 1};
    //   });

    //   map = d3.layout.pack().size(size);
    //   map.nodes({children: centers});

    //   return centers;
    // };


    
}
    