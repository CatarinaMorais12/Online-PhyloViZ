function createDistanceTable(selectedNodes, distanceMatrix, metadata, maxDistance){

  svgHeight = $("#distanceMatrix").height() * 0.9;

  $("#divsvg").css({ 'width': svgHeight, 'height': svgHeight});

	d3.select("#divsvg svg").remove();
  d3.select("#divsvgLegend svg").remove();

  var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = svgHeight,
    height = svgHeight;

  var svg = d3.select("#divsvg").append("svg")
    .attr('class', 'svgDistances')
    .attr("width", height)
    .attr("height", height - $("#divOrder p").height())
  .append("g")

  $("#divOrder").css({'display': 'block'});

  createSelect(metadata, function(){
    $('#countSelectedNodes').empty();
    $('#countSelectedNodes').append('Selected Nodes: ' + selectedNodes.length);
    $("#countSelectedNodes").css({display: 'block'});
    constructMatrix(selectedNodes, distanceMatrix, metadata, maxDistance, svg, svgHeight);
    $("#divClearDistances").css({display: 'block'});
    allowClearDistances();
  });

}

function allowClearDistances(){
  $("#clearDistanceMatrix").click(function(){
    $('divsvg').empty();
    $("#divOrder").css({display: 'none'});
    $("#countSelectedNodes").css({display: 'none'});
    d3.select("#divsvg svg").remove();
    d3.select("#divsvgLegend svg").remove();
    $("#checkboxListContent").empty();
    $("#divdistances").empty();
    $("#divClearDistances").css({display: 'none'});
    $("#divCheckboxList").css({display: 'none'});
  });
  $("#divClearDistances").css({display: 'block'});
}

function createSelect(metadata, callback){
  if (metadata.length > 0){
    var selectElement = document.getElementById('checkboxListContent'); 
    for (i in metadata){
      var checkBoxHTML = document.createElement('div'); 
      checkBoxHTML.innerHTML = '<input type="checkbox" class="checkBoxMetadata" value ="'+ metadata[i] +'" name="check' + metadata[i] + '><label for="check' + metadata[i] + '">'+ metadata[i] +'</label>'
      selectElement.appendChild(checkBoxHTML);
    }
    $("#divCheckboxList").css({display: 'block'});
  }
  callback();
}

var constructMatrix = function(selectedNodes, distanceMatrix, metadata, maxDistance, svg, svgHeight) {

  var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = svgHeight,
    height = svgHeight;

  var x = d3.scale.ordinal().rangeBands([0, width]),
      z = d3.scale.linear().domain([0, 4]).clamp(true),
      c = d3.scale.category10().domain(d3.range(10));

  var colors = ["#6363FF", "#6373FF", "#63A3FF", "#63E3FF", "#63FFFB", "#63FFCB",
               "#63FF9B", "#63FF6B", "#7BFF63", "#BBFF63", "#DBFF63", "#FBFF63", 
               "#FFD363", "#FFB363", "#FF8363", "#FF7363", "#FF6364"];

  var buckets = 10, currentValue = '', currentShowValues = {};

  if(maxDistance < colors.length) colors = colors.slice(0, maxDistance);

  var colorScale = d3.scale.quantile()
    .domain([0, maxDistance]) //d3.max(nodes, function (d) { return d.value; })
    .range(colors);

  var matrix = [],
      nodes = selectedNodes,
      n = nodes.length,
      existsMetadata = false;

  // Compute index per node.
  nodes.forEach(function(node, i) {
    node.index = i;
    node.count = 0;
    matrix[i] = d3.range(n).map(function(j) { return { value: -1, x: j, y: i}; });
  });

  if (metadata.length != 0) existsMetadata = true;

  countLines = 0;

  for (i in selectedNodes){
    countColumns = 0;
    for (j in selectedNodes){
      matrix[countLines][countColumns].value = distanceMatrix[selectedNodes[i].id][0][selectedNodes[j].id];
      if (existsMetadata){
        countMetadata = 0;
        for (z in metadata){
          if (selectedNodes[j].data.isolates.length == 0) toAdd = '';
          else toAdd = selectedNodes[j].data.isolates[0][countMetadata];
          matrix[countLines][countColumns][metadata[z]] = toAdd;
          countMetadata += 1;
        }
      }
      countColumns += 1;
    }
    countLines += 1;
  }

  // Precompute the orders.
  var orders = {
    name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].id, nodes[b].id); })
  };

  if(existsMetadata){
    for (z in metadata){
       orders[metadata[z]] = d3.range(n).sort(function(a, b) { 
          if (nodes[a].data.isolates.length == 0) nodeA = '';
          else nodeA = nodes[a].data.isolates[0][z];
          if (nodes[b].data.isolates.length == 0) nodeB = '';
          else nodeB = nodes[b].data.isolates[0][z];
          return d3.ascending(nodeA, nodeB); 
      });
    }
  }
  
  var options = '';
  $("#order").empty();
  for (var order1 in orders) options += '<option>' +order1+'</option>';

  $("#order").append(options);

  // The default sort order.
  x.domain(orders.name);

  currentValue = 'name';

  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height);

  var row = svg.selectAll(".row")
      .data(matrix)
    .enter().append("g")
      .attr("class", "row")
      .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
      .each(row);

  row.append("line")
      .attr("x2", width);


  var column = svg.selectAll(".column")
      .data(matrix)
    .enter().append("g")
      .attr("class", "column")
      .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

  column.append("line")
      .attr("x1", -width);

  var quantileNumbers = [0].concat(colorScale.quantiles());

  var legendHeight = svgHeight / 2; 

  var legend = d3.select('#divsvgLegend').append('svg')
                  .attr('width', legendHeight/15 )
                  .attr('height', legendHeight/colors.length).selectAll(".legend")
                  .data(quantileNumbers, function(d) { return d; });

          legend.enter().append("g")
              .attr("class", "legend");

          legend.append("rect")
            .attr("x", 0)
            .attr("y", function(d, i) { return legendHeight/colors.length * i; })
            .attr("width", legendHeight/15)
            .attr("height", legendHeight/colors.length)
            .style("fill", function(d, i) { return colors[i]; });

          legend.append("text")
            .attr("class", "mono")
            .text(function(d,i) {
              if(i == quantileNumbers.length-1) return "≥ " + parseFloat(quantileNumbers[i]).toFixed(2);
              else return parseFloat(quantileNumbers[i]).toFixed(2) + ' - ' + parseFloat(quantileNumbers[i+1]).toFixed(2);
            })
            .attr("x", legendHeight/15 + 5)
            .attr("y", function(d, i) { return legendHeight/colors.length * i + legendHeight/colors.length/2; });

  $('#groupSVG').css({ height: legendHeight});
  $('#divsvgLegend').css({ height: legendHeight});

  $('.checkBoxMetadata').on('click', function(){
      currentShowValues[this.value] = this.checked;
  });

  var prevCellSelected;

  function row(row) {


    var cell = d3.select(this).selectAll(".cell")
        .data(row)
      .enter().append("rect")
        .attr("class", function(d, i){ return "cell line_" + d.y + " col_" + d.x;})
        .attr("x", function(d) { return x(d.x); })
        .attr("width", x.rangeBand())
        .attr("height", x.rangeBand())
        //.style("fill-opacity", function(d) { return z(d.z); })
        .style("fill", function(d) { return colorScale(distanceMatrix[selectedNodes[d.y].id][0][selectedNodes[d.x].id]); })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
  }

  function mouseover(p) {

    $('#divOverMatrix').empty();

    var text = '<p>Line: ' + nodes[p.y].id + '</p><p>Column: ' + nodes[p.x].id + ' </p><p>Distance: ' + 
                distanceMatrix[selectedNodes[p.y].id][0][selectedNodes[p.x].id] + '</p>';
    

    for (i in currentShowValues){
      if (currentShowValues[i]) text += '<p>' + i + ': ' + p[i] + '</p>';
    }


    $('#divOverMatrix').append(text);
    d3.selectAll(".line_" + p.y ).style("fill", function(d, i) { 
      if (d.y == p.y && d.x == p.x) return 'red';
      else return colorScale(distanceMatrix[selectedNodes[d.y].id][0][selectedNodes[d.x].id]);
    }).attr("stroke", function(d,i){
      if (d.y == p.y || d.x == p.x) return 'black';
    });

    d3.selectAll(".col_" + p.x ).style("fill", function(d, i) { 
      if (d.y == p.y && d.x == p.x) return 'red';
      else return colorScale(distanceMatrix[selectedNodes[d.y].id][0][selectedNodes[d.x].id]);
    }).attr("stroke", function(d,i){
      if (d.y == p.y || d.x == p.x) return 'black';
    });

    prevCellSelected = p;
  }

  function mouseout() {

    $('#divOverMatrix').empty();

    d3.selectAll(".col_" + prevCellSelected.x).style("fill", function(d, i) { 
      return colorScale(distanceMatrix[selectedNodes[d.y].id][0][selectedNodes[d.x].id]);
    }).attr("stroke", function(d,i){
      return false;
    });

    d3.selectAll(".line_" + prevCellSelected.y).style("fill", function(d, i) { 
      return colorScale(distanceMatrix[selectedNodes[d.y].id][0][selectedNodes[d.x].id]);
    }).attr("stroke", function(d,i){
      return false;
    });

  }

  function order(value) {
    currentValue = value;
    x.domain(orders[value]);

    var t = svg.transition().duration(0);

    svg.selectAll(".row")
        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
      .selectAll(".cell")
        .attr("x", function(d) { return x(d.x); });

    svg.selectAll(".column")
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
  }


  $('#order').change(function(){
    order($('#order').find(":selected").text());
  });


}