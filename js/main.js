d3.csv("data/student_flow_aggregated_file.csv", function(error, data) {

	STATE.data=data;
	
	extendAttr(data);
	aggAttr(data);
	
	STATE.majorSankey=new MajorSankey();
	STATE.majorSankey.update();
	STATE.clusterBubble=new ClusterBubble();
	STATE.clusterBubble.update();

	var svg= d3.select("#fitParset").append("svg")
	
	STATE.paratitle=svg.append("text")
					   .attr("x",300)
					   .attr("y",10)
					   .style("text-anchor","middle");

	STATE.paraGroup=svg.attr("width", 550)
              .attr("height", 470)
              .append("g")
              .attr("class","parset")
              .attr("transform", "rotate(-90)translate(-470,50)");
    STATE.fitParset = d3.parsets()
		    .width(450)
		    .height(480)
		    .dimensions(STATE.fits)
		    .value(function(d) {return d.count;})
		    // .tooltip(function(d){return d.count;})
		    .dimensionFormat(gradeFormat)
		    .tension(0.5);
	updateParsets();

	$("#content").css("opacity",1);
	$("#wait").css("display","none")
});

function updateParsets() {
    STATE.paraGroup.datum(STATE.cf["fits"].bottom(Infinity)).call(STATE.fitParset);
    STATE.paratitle.text(function(){
							if (STATE.selectTerm){
								return "Students who declared major in " +STATE.selectMajor+" at term "+ STATE.selectTerm;
							}
							else return "All Students"
						})
}
