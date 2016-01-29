function ClusterBubble(){

    
    var width = 500, height = 500;
        
    var padding = 1;
    
    var clusterPadding = 1;// separation between different-color circles

    var fill = d3.scale.ordinal()
                 .domain(["Male","Female"])
                 .range(["#1f77b4","#d62728"])


    var svg = d3.select("#cluster").append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class","clusterBubble");

    var t2_centers = {
        "0": {name:"0", x: 100, y: 200},
        "1": {name:"1", x: 300, y: 200},
      }
      var t3_centers={
        "00": {name:"00", x: 100, y: 200},
        "01": {name:"01", x: 200, y: 200},
        "10": {name:"10", x: 300, y: 200},
        "11": {name:"11", x: 400, y: 200}
      }

      var all_center = { "all": {name:"All", x: 200, y: 200}};

      
  this.update=function() {

      d3.select(".clusterBubble").selectAll("*").remove();

      STATE.clusterData=generateCluster();
      // console.log(STATE.clusterData);
      var data=STATE.clusterData.data;
      var max_score = d3.max(data, function (d) { return d.score})
      var radius_scale = d3.scale.sqrt();
      
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

      draw('all');
      $( ".btn" ).click(function() {
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
      .text(function (d) { return d.name })
      .attr("transform", function (d) {
        return "translate(" + (d.x - ((d.name.length)*3)) + ", " + (d.y - 100) + ")";
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
    