##Infovis Project

###Description
This visualization shows how the major of interests changes and how the students be fit for the majors.

It consists of three graphs:
 
1. Major Migration Chart encodes major selected in three years(**ColumnID 3,4,5**).Check Data Description 
2. Fit Chart encodes whether students are fit for the majors in the three years(**ColumnID 6,7,8**).Check Data Description 
3. Cluster Chart encodes gender and ACT scores(**ColumnID 1,2**).Check Data Description 

###Data Source
Contest Challenge: Perceived vs. Actual Student Interest
<http://vacommunity.org/ieeevpg/viscontest/2015/>

Data Structure
![](data/attributes.png)
<http://vacommunity.org/ieeevpg/viscontest/2015//student_flow_aggregated_field_descriptions.pdf#page=3>

###Interaction
In the **Major Migration Chart**, the interactions are:

1. Hover the rectangle to check how the student changes for this major
2. Click on the rectangle to see the real major and best fit major. If you want to go back, just clicking on the white part in the graph
3. You can use scale to filter the least number of students
4. Hover on the legend to check how the students change in this three years

The **Fit Chart** and **Cluster Chart** will also change after you click on the **Major Migration Chart**.




###D3 Layout Examples
1. Sankey Graph <http://bost.ocks.org/mike/sankey/> 
2. Parsets <https://github.com/jasondavies/d3-parsets>
3. Clustor Force Layout <http://bl.ocks.org/mbostock/7882658>