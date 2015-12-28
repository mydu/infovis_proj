// function preprocss() {
var MData = {
    majorIDMap: null,
    majorNames: [],
    majorFill: d3.scale.category20(),
    majorLegend: null,
    grades: ["T1_Level2", "T2_Level2", "T3_Level2"],
    scores: ["33-36", "28-32", "24-27", "20-23", "16-19", "1-15"],
    scoreIDMap: null,
    fitGrades: ["Poor", "Moderate", "Good"],
    fitGradeIDMap: null,
    fits: ["T1_IMFIT", "T2_IMFIT", "T3_IMFIT"],
    fitIDMap: null,
    gradesOrder: ["T1_IMFIT", "T2_IMFIT", "T3_IMFIT"],
    source: 0,
    target: 1,
    duration: 0,
    chord: null,
    genderScore: null,
    gradeParset: null,
    fitChart:null,
    migrateChart:null
};

// $(document).ready(function() {
	// d3.csv("student_flow_aggregated_file.csv")
 //        .get(function(error, data) {
 //            if(error) {
 //                console.log(error);
 //                return;
 //            }
 //            extractID(data);
 //    		MData.cf = crossfilter(data);
	// 	});
// });


  function totable(json) {
		var html = "";
		json.forEach(function(row) {
            html += "<tr>";
            for (key in row) {
                  html += "<td>"+row[key]+"</td>";
            };
            html += "</tr>";

        });

        return "<table>" + html + "</table>";
	}

function gradeFormat(d) {
      var a = d.charAt(1);
      switch(a) {
          case '1':
              return "Planned";
              break;
          case '2':
              return "First Year";
              break;
          case '3':
              return "Second Year";
              break;
      }
      return d;
  }
function extractID(data) {
    MData.majorIDMap = d3.map();
    MData.majorNames = [];
    data.forEach(function(d) {
        var name = d["T1_Level2"];
        if(!MData.majorIDMap.has(name)) {
            var id = MData.majorIDMap.size();
            MData.majorNames[id] = name;
            MData.majorIDMap.set(name, id);
        }
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
    data.forEach(function(d) {
    	d.migrate = ""
        for(var i in MData.grades) {
            var name = d[MData.grades[i]];
            var idstr = MData.majorIDMap.get(name);
            d[MData.grades[i] + "_index"] = parseInt(idstr);
           	d.migrate += idstr;
        }
	    d.count = parseInt(d.count);
        d.fit = "";
        // d.fit = d["T1_IMFIT"]+d["T2_IMFIT"]+d["T3_IMFIT"];
        d.fit += fitTextToInt(d["T1_IMFIT"]);
        d.fit += fitTextToInt(d["T2_IMFIT"]);
        d.fit += fitTextToInt(d["T3_IMFIT"]);
        if(d["T1_Level2"]===d["T2_Level2"] && d["T2_Level2"]===d["T3_Level2"]) d.change=0;
        if(d["T1_Level2"]!==d["T2_Level2"] && d["T2_Level2"]===d["T3_Level2"]) d.change=1;
        if(d["T1_Level2"]===d["T2_Level2"] && d["T2_Level2"]!==d["T3_Level2"]) d.change=2;
        if(d["T1_Level2"]!==d["T2_Level2"] && d["T2_Level2"]!==d["T3_Level2"]) d.change=3;

    });
	console.log(data);
}
