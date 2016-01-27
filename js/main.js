d3.csv("data/student_flow_aggregated_file.csv", function(error, data) {

	extendAttr(data);
	aggAttr(data);
	console.log(data)
	MajorSankey();
	STATE.clusterBubble=new ClusterBubble();
	STATE.clusterBubble.update();

	STATE.parsetGroup= d3.select("#fitParset").append("svg")
              .attr("width", 500)
              .attr("height", 400)
              .append("g")
              .attr("class","parset")
              .attr("transform", "rotate(-90)translate(-400,0)");
    STATE.fitParset = d3.parsets()
		    .width(400)
		    .height(500)
		    .dimensions(STATE.fits)
		    .value(function(d) {return d.count;})
		    // .tooltip(function(d){return d.count;})
		    .dimensionFormat(gradeFormat)
		    .tension(0.5);
	updateParsets();
});

function updateParsets() {
    STATE.parsetGroup.datum(STATE.cf["fits"].bottom(Infinity)).call(STATE.fitParset);
}
