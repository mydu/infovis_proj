function MajorSankey(){

  var margin = {
        top: 20,
        right: 50,
        bottom: 10,
        left: 50
    },
    width = 550- margin.left - margin.right,
    height = 500- margin.top - margin.bottom;

    // append the svg canvas to the page
    var svg = d3.select("#majorSankey").append("svg")
      .attr("class","sankey")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    var legend_group=d3.select("#legend")
                    .append("svg")
                    .attr("height", height + margin.top + margin.bottom);

    var encode_legend=legend_group.append("g");
    var major_legend=legend_group
                    .append("g")
                    .attr("transform","translate(0,40)");


    // Set the sankey diagram properties
    var sankey = d3.sankey()
      .nodeWidth(10)
      .nodePadding(25)
      .size([width, height]);

    var path = d3.svg.diagonal()
    .source(function(d) { return {"x":d.source.y, "y":d.source.x}; })            
      .target(function(d) { return {"x":d.target.y, "y":d.target.x}; })
      // .source(function(d) {
      //     return {"x":d.source.y + d.source.dy / 2,
      //             "y":d.source.x + sankey.nodeWidth()/2};
      // })            
      // .target(function(d) {
      //     return {"x":d.target.y + d.target.dy / 2,
      //             "y":d.target.x + sankey.nodeWidth()/2};
      // })
      .projection(function(d) { return [d.y, d.x]; });

      //set up graph in same style as original example but empty
    var graph = {"nodes" : [], "links" : []};

      _.each([STATE.T12,STATE.T23],function(data){
        _.each(data,function(d){
          graph.nodes.push({ "name": d.key.split("|")[0] });
            graph.nodes.push({ "name": d.key.split("|")[1] });
            graph.links.push({ "source": d.key.split("|")[0],
                             "target": d.key.split("|")[1],
                             "value": d.value });
        })
      })
  
    // csv to linknode
   // data.forEach(function (d) {
   //    graph.nodes.push({ "name": d.source });
   //    graph.nodes.push({ "name": d.target });
   //    graph.links.push({ "source": d.source,
   //                       "target": d.target,
   //                       "value": +d.value });
   //   });
   
     // return only the distinct / unique nodes
     graph.nodes = d3.keys(d3.nest()
       .key(function (d) { return d.name; })
       .map(graph.nodes));
     // loop through each link replacing the text with its index from node
     graph.links.forEach(function (d, i) {
       graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
       graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
     });

     //now loop through each nodes to make nodes an array of objects
     // rather than an array of strings
     graph.nodes.forEach(function (d, i) {
       graph.nodes[i] = { "name": d };
     });

    sankey.nodes(graph.nodes)
    .links(graph.links)
    .layout(32);
    
    //node scale
    var maxVal_node=d3.max(_.pluck(graph.nodes,"value"));
    var minVal_node=d3.min(_.pluck(graph.nodes,"value"));
    var nodeScale=d3.scale.sqrt()
                    .domain([minVal_node,maxVal_node])
                    .range([10,50]);
    //link scale
    var maxVal_links=d3.max(_.pluck(graph.links,"value"));
    var minVal_links=d3.min(_.pluck(graph.links,"value"));
    
    var linkScale=d3.scale.sqrt()
                    .domain([minVal_links,maxVal_links])
                    .range([1,10]);
    
    $("#slider").slider({
      value:1,
    min: minVal_links,
    max: maxVal_links,
    slide: function( event, ui ) {
      $("#amount").val( ui.value );
    },
    stop: function( event, ui ) {
      updateLinks();
    }
  });
  $("#amount").val($("#slider").slider("value"));
    // add in the links
    var link = svg.append("g")
      .attr("class", "links")
      .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("path")
        .attr("id", function(d,i){
          d.id = i;
          return "link-"+i;
        })
        .filter(function(d){ return d.value >$("#slider").slider("value");})
        .attr("class", "link")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", "tan")
        .style("stroke-opacity", ".2")
        .on("mouseover", function(d) { 
          d3.select(this).style("stroke-opacity", ".5") } )
        .on("mouseout", function() { d3.select(this).style("stroke-opacity", ".2") } )
        .style("stroke-width", function (d) {
            return linkScale(d.value);
        })
        .sort(function (a, b) {
            return b.dy - a.dy;
        });

    // add the link titles
    link.append("title")
        .text(function (d) {
            var sourceid=d.source.name.substring(2,d.source.name.length)
            var targetid=d.target.name.substring(2,d.target.name.length)
            return  (_.invert(STATE.majorIDMap))[sourceid]+ " → " +(_.invert(STATE.majorIDMap))[targetid] + "\n" + d.value+"\n"+linkScale(d.value);
        });

    // add in the nodes
    var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("major",function(d){
          var majorid=d.name.substring(2,d.name.length);
          return majorid;
        })
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .on("mouseover",function(d,i){
          var interact_mode="hover";
          highlight_node_links(d,i,this,interact_mode);
        })
        .on("mouseout",function(d,i){
          var interact_mode="hover";
          highlight_node_links(d,i,this,interact_mode);
        })
        .on("click",function(d,i){
         // var interact_mode="click";
         // highlight_node_links(d,i,this,interact_mode);
         clearFilter()
         var term=d.name.substring(0,2);
         var majorid=d.name.substring(2,d.name.length);
         STATE.cf[term+"_Level2_id"].filterExact(majorid);
         STATE.clusterBubble.update();
         updateParsets();
        })
  
        // .call(d3.behavior.drag()
        // .origin(function (d) {
        //     return d;
        // })
        // .on("dragstart", function () {
        //     this.parentNode.appendChild(this);
        // })
        // .on("drag", dragmove));

    // add the circles/rect for the nodes
    // node.append("circle")
    //     .attr("cx", sankey.nodeWidth()/2)
    //     .attr("cy", function (d) {
    //         return d.dy/2;
    //     })
    //     .attr("r", function (d) {
    //         return Math.sqrt(d.dy);
    //     })
    //     .style("fill", function (d) {
    //         return d.color = color(d.name.replace(/ .*/, ""));
    //     })
    //     .style("fill-opacity", ".9")
    //     .style("shape-rendering", "crispEdges")
    //     .style("stroke", function (d) {
    //         return d3.rgb(d.color).darker(2);
    //     })
    //     .append("title")
    //     .text(function (d) {
    //         return d.name + "\n" + format(d.value);
    //     });
  node.append("rect")
      .attr("x", function (d) {
          return -nodeScale(d.value)/2;
      })
      .attr("y", function (d) {
          return -sankey.nodeWidth()/2;
      })
        .attr("width", function(d) { return nodeScale(d.value); })
        .attr("height", sankey.nodeWidth())
        .style("fill", function(d) { 
      return d.color = STATE.majorFill(d.name.substring(2,d.name.length)); })
    //   .style("stroke", function(d) { 
      // return d3.rgb(d.color).darker(2); })
    .append("title")
      .text(function(d) { 
        var majorid=d.name.substring(2,d.name.length)
        return (_.invert(STATE.majorIDMap))[majorid] + "\n" + d.value; });

    // add in the title for the nodes
   //  node.append("text")
   //      .attr("x", function (d) {
   //          return - 6 + sankey.nodeWidth() / 2 - Math.sqrt(d.dy);
   //      })
   //      .attr("y", function (d) {
   //          return d.dy / 2;
   //      })
   //      .attr("dy", ".15em")
   //      .attr("transform", null)
   //      .text(function (d) {
   //       var majorid=d.name.substring(2,d.name.length)
      // // return (_.invert(STATE.majorIDMap))[majorid];
      // return majorid;
   //      })
   //      .filter(function (d) {
   //          return d.x < width / 2;
   //      })
   //      .attr("x", function (d) {
   //          return 6 + sankey.nodeWidth() / 2 + Math.sqrt(d.dy);
   //      })
    function highlight_node_links(node,i,thisnode,mode){
      // console.log(thisnode);
      var remainingNodes=[],
          nextNodes=[];

      var stroke_opacity = 0;
      if( d3.select(thisnode).attr(mode) == "1" ){
        d3.select(thisnode).attr(mode,"0");
        stroke_opacity = 0.2;
        if (mode==="click") {
          d3.select(thisnode)
            .on("mouseover",function(d,i){
            var interact_mode="hover";
            highlight_node_links(d,i,this,interact_mode);
            })
            .on("mouseout",function(d,i){
            var interact_mode="hover";
            highlight_node_links(d,i,this,interact_mode);
            })
          }
      }else{
        d3.select(thisnode).attr(mode,"1");
        stroke_opacity = 0.7;
        if (mode==="click") d3.select(thisnode).on("mouseover",null);
        if (mode==="click") d3.select(thisnode).on("mouseout",null);
      }
      // if( d3.select(thisnode).attr("data-clicked") == "1" ){
      //   d3.select(thisnode).attr("data-clicked","0");
      //   stroke_opacity = 0.2;
      // }else{
      //   d3.select(thisnode).attr("data-clicked","1");
      //   stroke_opacity = 0.5;
      // }


      var traverse = [{
                        linkType : "sourceLinks",
                        nodeType : "target"
                      },{
                        linkType : "targetLinks",
                        nodeType : "source"
                      }];

      traverse.forEach(function(step){
        node[step.linkType].forEach(function(link) {
          remainingNodes.push(link[step.nodeType]);
          highlight_link(link.id, stroke_opacity);
        });
      });
        // while (remainingNodes.length) {
        //   nextNodes = [];
        //   remainingNodes.forEach(function(node) {
        //     node[step.linkType].forEach(function(link) {
        //       nextNodes.push(link[step.nodeType]);
        //       highlight_link(link.id, stroke_opacity);
        //     });
        //   });
        //   remainingNodes = nextNodes;
        // }
        //highlight same major node
        var selected_majorid=node.name.substring(2,node.name.length);
        var selected_nodes=d3.select(".sankey").selectAll(".node")
            .filter(function(d){
              var majorid=d.name.substring(2,d.name.length);
              return majorid===selected_majorid; 
            })
        selected_nodes.classed("ranked", function(d){
          return !d3.select(this).classed("ranked");
        });
  }

  function highlight_link(id,opacity){
        d3.select("#link-"+id).style("stroke-opacity", opacity);
  }

    function updateLinks(){
      d3.select(".links").selectAll("path").remove();
      d3.select(".links").selectAll(".link")
       .data(graph.links)
        .enter()
        .append("path")
        .attr("id", function(d,i){
          d.id = i;
          return "link-"+i;
        })
        .filter(function(d){ return d.value >$("#slider").slider("value");})
        .attr("class", "link")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", "tan")
        .style("stroke-opacity", ".33")
        .on("mouseover", function() { d3.select(this).style("stroke-opacity", ".7") } )
        .on("mouseout", function() { d3.select(this).style("stroke-opacity", ".2") } )
        .style("stroke-width", function (d) {
            return linkScale(d.value);
        })
        .sort(function (a, b) {
            return b.dy - a.dy;
        });
    }
     majorLegend(major_legend);
     sizeLegend(encode_legend);

}








// // load the data (using the timelyportfolio csv method)
// d3.csv("student_flow_aggregated_file.csv", function(error, data) {
// // d3.csv("idg.csv", function(error, data) {

//   extendAttr(data);
//   var cf = crossfilter(data);

//   var T12=cf.dimension(function(d){return "T1"+d["T1_Level2_id"]+"|"+"T2"+d["T2_Level2_id"];})
//           .group().reduceSum(function(d){return d.count;}).top(Infinity);
//   var T23=cf.dimension(function(d){return "T2"+d["T2_Level2_id"]+"|"+"T3"+d["T3_Level2_id"];})
//           .group().reduceSum(function(d){return d.count;}).top(Infinity);
  
  
  
//     // the function for moving the nodes
//     function dragmove(d) {
//         d3.select(this).attr("transform",
//             "translate(" + (
//         d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))) + "," + (
//         d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
//         sankey.relayout();
//         link.attr("d", path);
//     };
//     function highlight_link_links(){

//     }



  function majorLegend(group) {
    var itemHeight = 14;
    var padding = 4;
    var majorData=[];
    //map STATE.majorIDMap
    console.log(STATE.majorIDMap);
    _.each(STATE.majorIDMap,function(key,value){
      majorData.push({
        id:key,
        name:value
      })
    })
    console.log(majorData)
    var item = group.selectAll(".MajorLegendItem").data(majorData)
                .enter().append("g")
                .attr("class", "MajorLegendItem")
                .attr("transform", function(d, i) {
                    return "translate(" + padding/2 + "," + (i*(itemHeight + 2*padding) + padding) + ")";
                });

    item.append("rect")
        .attr("width", itemHeight)
        .attr("height", itemHeight)
        .style("fill", function(d, i) {return STATE.majorFill(d.id);})
        .style("stroke", "white");

    item.append("text")
        .attr("x", itemHeight + padding/2)
        .attr("y", itemHeight-2)
        .attr("text-anchor", "start")
        .attr("font-size", itemHeight + "px")
        .attr("font-family", "Lato")
        .attr("fill", "black")
        .text(function(d) {
          return d.name;});
  }
  function sizeLegend(group) {
        // var circleSize = [];
        // var circleText = [1,5,10,15];
        
        // circleSize[0] = 2;
        
        // for (var i=1;i<4;i++) {
        //     circleSize[i] = 0.6*i*5 + 2;   
        // }
        
        // var circleSize = group.selectAll(".cLegend")
        //     .data(circleSize)
        //     .enter().append("circle")
        //     .attr("class", "cLegend")
        //     .attr("cx", function(d,i) { return 120; })
        //     .attr("cy", 78)
        //     .attr("r", function(d) { return d; })
        //     .attr("fill", "black");
        
        // circleSize.transition().duration(1000).attr("cx", function(d,i) { return 120 + i*30; })
        
        // group.selectAll(".cLegendLabels")
        //     .data(circleText)
        //     .enter().append("text")
        //     .attr("class", "cLegendLabels")
        //     .attr("x", function(d,i) { return 120 + i*30; })
        //     .attr("y", 58)
        //     .attr("text-anchor", "middle")
        //     .text(function (d) { return d });
}