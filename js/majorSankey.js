function MajorSankey(){

  var margin = {
        top: 60,
        right: 80,
        bottom: 20,
        left: 110
    },
    width = 600-margin.left - margin.right,
    height = 600- margin.top - margin.bottom;

    // append the svg canvas to the page
    var svg = d3.select("#majorSankey").append("svg")
              .attr("class","sankey")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
    var canvas=svg.append("rect")
                    .attr("calss","sankey_canvas")
                    .style("fill","#f0f0f0")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .on("click",function(){
                      STATE.selectTerm=null;
                      STATE.selectMajor=null;
                      console.log("clear")
                      clearFilter();
                      STATE.clusterBubble.update();
                      STATE.majorSankey.update();
                      updateParsets();
                    })      

    var major_legend=d3.select("#major_legend")
                    .append("svg")
                    // .append("g")
    var size_legend=d3.select("#size_legend")
                    .append("svg")
                    // .append("g")
    var bestfit_legend=d3.select("#bestfit_legend")
                    .append("svg")
                    .attr("height",40)           
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

      $( ".majorbtn" ).click(function() {
        $(this).addClass("active").siblings().removeClass("active");
        STATE.sortBy=this.id;
        STATE.majorSankey.update();
      });
    this.update=function(){

      d3.select("#major").selectAll("g").remove();

        //set up graph in same style as original example but empty

      var graph = {"nodes" : [], "links" : []};

        _.each([STATE.T12,STATE.T23],function(data){
          _.each(data,function(d){
            if(d.value>0){
              graph.nodes.push({ "name": d.key.split("|")[0] });
              graph.nodes.push({ "name": d.key.split("|")[1] });
              graph.links.push({ "source": d.key.split("|")[0],
                               "target": d.key.split("|")[1],
                               "value": d.value });
            }  
          })
        })
      STATE.graph=graph;
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
      STATE.maxVal_node=d3.max(_.pluck(graph.nodes,"value"));
      STATE.minVal_node=d3.min(_.pluck(graph.nodes,"value"));
      STATE.nodeScale=d3.scale.log()
                      .domain([STATE.minVal_node,STATE.maxVal_node])
                      .range([10,50]);
      //link scale
      STATE.maxVal_link=d3.max(_.pluck(graph.links,"value"));
      STATE.minVal_link=d3.min(_.pluck(graph.links,"value"));
      
      STATE.linkScale=d3.scale.log()
                      .domain([STATE.minVal_link,STATE.maxVal_link])
                      .range([1,10]);

      majorLegend(major_legend);
      sizeLegend(size_legend);

      if(STATE.selectTerm) {
        bestfitLegend(bestfit_legend)
      }else{d3.select("#bestfit_legend").select("svg").selectAll("*").remove();}


      $("#slider").slider({
          value:1,
          min: STATE.minVal_link,
          max: STATE.maxVal_link,
          slide: function( event, ui ) {
            $("#amount").val( ui.value );
          },
          stop: function( event, ui ) {
            updateLinks();
          }
        });
       $("#amount").change(function(){
          $("#slider").slider( "value",$("#amount").val());
          updateLinks();
       }).val($("#slider").slider("value"));

      var sankey_g=svg.append("g").attr("transform","translate(" + margin.left + "," + margin.top + ")");
      sankey_g.selectAll(".term")
              .data(["T1","T2","T3"])
              .enter()
              .append("text")
              .attr("class", "term")
              .attr("x",function(d,i){return i*200;})
              .attr("y",-30)
              .text(function(d){
                if (d===STATE.selectTerm) return d+"/"+STATE.selectMajor;
                else return d;
              })
              .style("text-anchor", "middle")
              // .style("text-anchor", function(d){
              //   if (d===STATE.selectTerm){
              //         if (d==="T1") return "start";
              //         if (d==="T2") return "middle";
              //         if (d==="T3") return "end";
              //   }
              // })
              .each(function(d,i){
                if (d===STATE.selectTerm){
                  d3.select(this).append("tspan")
                                .attr("dy",15)
                                .attr("x",i*200)
                                .text("(Best-fit Major)")
                                .style("text-anchor", "middle")
                }
              });
              
      // add in the links
      var link = sankey_g.append("g")
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
          .on("mouseover", function(d) {
            d3.selectAll(".link").style("stroke-opacity", ".1");
            d3.select(this).style("stroke-opacity", ".7");
            d3.select("#"+d.target.name).selectAll("rect").classed("highlight",true);
            d3.select("#"+d.source.name).selectAll("rect").classed("highlight",true);
          } )
          .on("mouseout", function(d) { 
            d3.selectAll(".link").style("stroke-opacity", ".2");
            d3.select("#"+d.target.name).selectAll("rect").classed("highlight",false);
            d3.select("#"+d.source.name).selectAll("rect").classed("highlight",false); 
          })
          .style("stroke-width", function (d) {
              return STATE.linkScale(d.value);
          })
          .sort(function (a, b) {
              return b.dy - a.dy;
          });

      // add the link titles
      link.append("title")
          .text(function (d) {
              var sourceterm=d.source.name.substring(0,2);
              var targetterm=d.target.name.substring(0,2);
              var sourceid=d.source.name.substring(2,d.source.name.length)
              var targetid=d.target.name.substring(2,d.target.name.length)
              // return  (_.invert(STATE.majorIDMap))[sourceid]+ " → " +(_.invert(STATE.majorIDMap))[targetid] + "\n" + d.value;
              return d.value+" Students migrate\n"+(_.invert(STATE.majorIDMap))[sourceid]+"("+sourceterm+") → "+(_.invert(STATE.majorIDMap))[targetid]+"("+targetterm+")";
          });

      // add in the nodes
      var node = sankey_g.append("g")
        .attr("class", "nodes")
        .selectAll(".node")
          .data(graph.nodes)
          .enter().append("g")
          .attr("class", "node")
          .attr("id", function(d,i){
            return d.name;
          })
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
            d3.select(this).select("text").text(function(d){return d.value;});
             d3.select(this).select('rect').classed("highlight",true);
          })
          .on("mouseout",function(d,i){
            var interact_mode="hover";
            highlight_node_links(d,i,this,interact_mode);
            d3.select(this).select("text").text(null);
            d3.select(this).select("rect").classed("highlight",false);
          })
          .on("click",function(d,i){
           // var interact_mode="click";
           // highlight_node_links(d,i,this,interact_mode);
           if(!STATE.selectTerm) {
              clearFilter();
               var term=d.name.substring(0,2);
               var majorid=d.name.substring(2,d.name.length);
               STATE.selectTerm=term;
               STATE.selectMajorid=majorid;
               STATE.selectMajor=_.invert(STATE.majorIDMap)[majorid];

               if (term==="T1"){
                  STATE.T12=STATE.cf.dimension(function(d){return "T1"+d["HighestLevel2_id"]+"|"+"T2"+d["T2_Level2_id"];})
                        .group().reduceSum(function(d){return d.count;}).top(Infinity);
               }
               if(term==="T2"){
                  STATE.T12=STATE.cf.dimension(function(d){return "T1"+d["T1_Level2_id"]+"|"+"T2"+d["HighestLevel2_id"];})
                        .group().reduceSum(function(d){return d.count;}).top(Infinity);

                  STATE.T23=STATE.cf.dimension(function(d){return "T2"+d["HighestLevel2_id"]+"|"+"T3"+d["T3_Level2_id"];})
                  .group().reduceSum(function(d){return d.count;}).top(Infinity);
               }
               if (term==="T3"){
                  STATE.T23=STATE.cf.dimension(function(d){return "T2"+d["T2_Level2_id"]+"|"+"T3"+d["HighestLevel2_id"];})
                  .group().reduceSum(function(d){return d.count;}).top(Infinity);
               }
              
               STATE.cf[term+"_Level2_id"].filterExact(majorid);
               STATE.clusterBubble.update();
               STATE.majorSankey.update();
               updateParsets();
           } 
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
            return -STATE.nodeScale(d.value)/2;
        })
        .attr("y", function (d) {
            return -sankey.nodeWidth()/2;
        })
          .attr("width", function(d) { return STATE.nodeScale(d.value); })
          .attr("height", sankey.nodeWidth())
          .style("fill", function(d) {
            var majorid=d.name.substring(2,d.name.length);
            return STATE.majorFill(majorid); })
          .attr("stroke", function(d) { 
            var term=d.name.substring(0,2);
            var majorid=d.name.substring(2,d.name.length); 
            if(term===STATE.selectTerm) return STATE.majorFill(STATE.selectMajorid);
            // else return STATE.majorFill(majorid);
          })
          .attr("stroke-width",3)
          .append("title")
          .text(function(d) { 
            var term=d.name.substring(0,2);
            var majorid=d.name.substring(2,d.name.length)
            if (term===STATE.selectTerm) {
              return d.value+" Students in \n"
                     +(_.invert(STATE.majorIDMap))[STATE.selectMajorid]+"("+STATE.selectTerm+")\n"
                     +(_.invert(STATE.majorIDMap))[majorid]+"(Best-fit Major)";
            }
            else return d.value+" Students in\n"+(_.invert(STATE.majorIDMap))[majorid]+"("+term+")"; 
          });
            // return (_.invert(STATE.majorIDMap))[majorid] + "\n" + d.value; });
            
      // add in the title for the nodes
      node.append("text")
          .attr("y", sankey.nodeWidth()*2)
          // .text(function (d) { return d.value})
          .attr("font-size", 12)
          .style("text-anchor", "middle")

      function updateLinks(){
        d3.select(".links").selectAll(".link")
          .style("display", "block")
          .filter(function(d){ return d.value <$("#slider").slider("value");})
          .style("display", "none")
      }
  }
}


    function highlight_node_links(node,i,thisnode,mode){
      // console.log(thisnode);
      var remainingNodes=[],
          nextNodes=[];

      var stroke_opacity = 0;
      if( d3.select(thisnode).attr(mode) == "1" ){
        d3.select(thisnode).attr(mode,"0");
        stroke_opacity = 0.2;
        // if (mode==="click") {
        //   d3.select(thisnode)
        //     .on("mouseover",function(d,i){
        //     var interact_mode="hover";
        //     highlight_node_links(d,i,this,interact_mode);
        //     })
        //     .on("mouseout",function(d,i){
        //     var interact_mode="hover";
        //     highlight_node_links(d,i,this,interact_mode);
        //     })
        //   }
        d3.selectAll(".link").style("stroke-opacity",stroke_opacity);

      }else{
        d3.select(thisnode).attr(mode,"1");
        stroke_opacity = 0.7;
        // if (mode==="click") d3.select(thisnode).on("mouseover",null);
        // if (mode==="click") d3.select(thisnode).on("mouseout",null);
        d3.selectAll(".link").style("stroke-opacity",".1");
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
          // remainingNodes.push(link[step.nodeType]);
          if( d3.select(thisnode).attr(mode) == "1" ){
            d3.select("#"+link[step.nodeType].name).select("text")
            .text(link.value);
          }
          else{
            d3.select("#"+link[step.nodeType].name).select("text")
            .text(null);
          }
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
        var highlight_majorid=node.name.substring(2,node.name.length);
        // var highlight_nodes=d3.select(".sankey").selectAll(".node")
        //     .filter(function(d){
        //       var majorid=d.name.substring(2,d.name.length);
        //       return majorid===highlight_majorid; 
        //     });

        var highlight_legend=d3.selectAll(".majorLegend").filter(function(d){ 
            return d.id===highlight_majorid;});

        // highlight_nodes.classed("highlight", function(d){
        //   return !d3.select(this).classed("highlight");
        // });
        highlight_legend.classed("highlight", function(d){
          return !d3.select(this).classed("highlight");
        });

  }

  function highlight_link(id,opacity){
    d3.select("#link-"+id).style("stroke-opacity", opacity);
  }


  function majorLegend(svg) {
    var itemHeight = 12;
    var padding = 3;
    var majorData=[];
    //map STATE.majorIDMap

    _.each(STATE.majorIDMap,function(key,value){

      majorData.push({
        id:key.toString(),
        name:value
      })
    })
    svg.attr("height",360);
    svg.append("text").text('Majors')
        .attr("transform","translate(0,20)");
    var item = svg.append("g")
                .attr("transform","translate(0,30)")
                .selectAll(".majorLegend").data(majorData)
                .enter().append("g")
                .attr("class", "majorLegend")
                .attr("transform", function(d, i) {
                    return "translate(" + padding/2 + "," + (i*(itemHeight + 2*padding) + padding) + ")";
                })
                .on("mouseover",function(d){
                     var highlight_majorid=d.id;
                     d3.select(this).selectAll("rect").classed("highlight",true);
                     var highlight_nodes=d3.select(".sankey").selectAll(".node")
                      .filter(function(d){
                        var majorid=d.name.substring(2,d.name.length);
                        return majorid===highlight_majorid; 
                      }); 
                      highlight_nodes.selectAll("rect").classed("highlight",true);
                      highlight_nodes.selectAll("text").text(function(d){return d.value;})
                  })
                  .on("mouseout",function(d){
                    d3.select(this).selectAll("rect").classed("highlight",false);
                    d3.select(".sankey").selectAll(".node").selectAll("rect").classed("highlight",false);
                    
                    var highlight_majorid=d.id;
                    var highlight_nodes=d3.select(".sankey").selectAll(".node")
                      .filter(function(d){
                        var majorid=d.name.substring(2,d.name.length);
                        return majorid===highlight_majorid; 
                      }); 
                    highlight_nodes.selectAll("text").text(null);
                  });

    item.append("rect")
        .attr("width", itemHeight)
        .attr("height", itemHeight)
        .style("fill", function(d, i) {return STATE.majorFill(d.id);})
        // .style("stroke", "white");
       

    item.append("text")
        .attr("x", itemHeight + padding/2)
        .attr("y", itemHeight-2)
        .attr("text-anchor", "start")
        .attr("font-size", itemHeight + "px")
        .attr("fill", "black")
        .text(function(d) {
          return d.name;});
  }
  function bestfitLegend(svg){
    svg.append("text")
       .attr("transform","translate(60,20)")
       .text("Stoke enodes declared major")
    svg.append("text")
       .attr("transform","translate(60,40)")
       .text("Fill enodes best-fit major")
    svg.append("rect")
       .attr("transform","translate(5,15)")
       .attr("height",10)
       .attr("width",50)
       .attr("stroke",STATE.majorFill(STATE.selectMajorid))
       .attr("stroke-width",3)
       .attr("fill","#9C9C9C")
       .style("opacity",0)
       .transition().duration(1000).style("opacity","1");
  }
  function sizeLegend(svg) {
    var all_nodevalues=STATE.graph.nodes
                            .filter(function(d){return d.value>STATE.minVal_node&&d.value<STATE.maxVal_node;})
                            .map(function(d){return d.value;});
    var all_linkvalues=STATE.graph.links
                            .filter(function(d){return d.value>STATE.minVal_link&&d.value<STATE.maxVal_link;})
                            .map(function(d){return d.value;});
    
    var nodeSample=_.sample(all_nodevalues, 5);
    nodeSample.sort(function(a, b) {return a - b;});
    nodeSample.unshift(STATE.minVal_node);
    nodeSample.push(STATE.maxVal_node);

    var linkSample=_.sample(all_linkvalues, 5);
    linkSample.sort(function(a, b) {return a - b;});
    linkSample.unshift(STATE.minVal_link);
    linkSample.push(STATE.maxVal_link);

    var nodeSampleData=[];
    _.each(nodeSample,function(d){
      nodeSampleData.push({
        count:d,
        size:STATE.nodeScale(d)
      })
    });

    var linkSampleData=[];
    _.each(linkSample,function(d){
      linkSampleData.push({
        count:d,
        size:STATE.linkScale(d)
      })
    });
    svg.attr("height",140);

    svg.append("text")
    .attr("transform","translate(0,30)")
    .text("Node Encoding")
    .attr("stroke-width",2);

    var node_legend=svg.append("g")
          .attr("class","nodesizeLegend")
          .attr("transform","translate(0,60)");
    
    node_legend.append("text")
              .text(STATE.minVal_node)
              .attr("transform","translate(0,5)");
    node_legend.append("text")
              .text(STATE.maxVal_node)
              .attr("transform","translate(170,5)");
    var node_item=node_legend.selectAll(".nodeLegend")
          .data(nodeSampleData)
          .enter().append("g")
          .attr("class", "nodeLegend")
          
    node_item.append("rect")
          .attr("width",10)
          .attr("height", function(d,i) { return d.size; })
          .attr("fill","#9C9C9C")
          .attr("stroke", "#000000")
           .attr("x", function (d,i) { return 30; })
          .attr("y", function(d,i) { return -d.size/2;})
          .transition().duration(1000).attr("x", function(d,i) { return i*20+30; })
    node_item.append("title")
              .text(function(d) { return d.count; });
          

    // node_legend.selectAll(".nodesizeText")
    //             .data(nodeSampleData)
    //             .enter().append("text")
    //               .attr("class", "nodesizeText")
    //               .attr("x", function (d,i) { return i*50+10; })
    //               .attr("y", 40)
    //               .style("text-anchor", "middle")
    //               .text(function(d,i) { return d.count; });
    
    svg.append("text")
      .attr("transform","translate(0,110)")
      .text("Link Encoding")
      .attr("stroke-width",2);

    var link_legend=svg.append("g")
      .attr("class","nodesizeLegend")
      .attr("transform","translate(0,130)");
    link_legend.append("text")
              .text(STATE.minVal_link)
              .attr("transform","translate(0,5)");
    link_legend.append("text")
              .text(STATE.maxVal_link)
              .attr("transform","translate(170,5)");
    var link_item=link_legend.selectAll(".linkLegend")
        .data(linkSampleData)
        .enter().append("g")
        .attr("class", "linkLegend")
       
        

    link_item.append("rect")
        .attr("width",function(d,i) { return d.size; })
        .attr("height", function(d,i) { return d.size; })
        .attr("fill","#9C9C9C")
        .attr("stroke", "#000000")
        .attr("x", function (d,i) { return 30; })
        .attr("y", function(d,i) { return -d.size/2;})
        .transition().duration(1000).attr("x", function(d,i) { return i*20+30; })
    link_item.append("title")
        .text(function(d) { return d.count; });
        
    // link_legend.selectAll(".nodesizeText")
    //               .data(linkSampleData)
    //               .enter().append("text")
    //                 .attr("class", "nodesizeText")
    //                 .attr("x", function (d,i) { return i*50+10; })
    //                 .attr("y", 20)
    //                 .style("text-anchor", "middle")
    //                 .text(function(d,i) { return d.count; });

         
}