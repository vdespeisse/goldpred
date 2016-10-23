

d3.charts = []

d3.chart = (options) => {
  // if (d3.charts.includes(options)) return
  var chart = Object.assign({}, d3.chart.defaults, d3.chart[options.type], options)
  d3.charts.push(chart)
  console.log(chart)

  Object.defineProperty(chart, 'data', {
    get: () => chart._data,
    set: (data) => {
      chart._data = data
      d3.chart.draw(chart)
    }
  })

  d3.chart.init(chart)

  return chart
}

d3.chart.init = (chart) => {

  window.chart = chart
  chart.root = d3.select(chart.bindto).classed("d3-chart", true)
  // chart.id = d3.charts.length
  chart.svg = chart.root.append("svg").classed("d3-chart-svg", true).classed(chart.type, !!chart.type)
  chart.svg.node().chart = chart
  chart.clipId = "inner-" + chart.id
  chart.clipPath = "url(" + document.URL.split('#')[0] + "#" + chart.clipId + ")"
  chart.clipInner = chart.svg.append("defs").append("clipPath").attr("id", chart.clipId).append('rect')
  chart.wrapper = chart.svg.append("g")
  chart.shapes = chart.wrapper.append("g").attr("class", "shapes").attr("clip-path", chart.clipPath)
  chart.AxisX = chart.wrapper.append("g").attr("class", "axis x")
  chart.AxisY = chart.wrapper.append("g").attr("class", "axis y")
  chart.AxisY2 = chart.wrapper.append("g").attr("class", "axis y2")
  chart.LabelX = chart.AxisX.append("text").attr("class", "label x").style("text-anchor", "end")
  chart.LabelY = chart.AxisY.append("text").attr("class", "label y").attr("transform", "rotate(-90)").style("text-anchor", "end")
  chart.LabelY2 = chart.AxisY2.append("text").attr("class", "label y2").attr("transform", "rotate(-90)").style("text-anchor", "end")
  chart.GridX = chart.wrapper.append("g").attr("class", "grid x")
  chart.Brush = chart.wrapper.append("g").attr("class", "brush")

  if (chart.width || chart.height) chart.resize = false
  d3.chart.resize(chart)

  return chart
}

d3.chart.resize = (chart) => {
  if (chart.resize === false) return d3.chart.draw(chart)

  chart.width = chart.root.node().clientWidth
  chart.height = chart.root.node().clientHeight
  if (!chart.padding) chart.padding = {
    top: 20,
    bottom: 40,
    left: chart.fieldsY.length === 0 ? 20 : 60,
    right: chart.fieldsY2.length === 0 ? 20 : 60,
  }
  chart.innerWidth = chart.width - chart.padding.left - chart.padding.right
  chart.innerHeight = chart.height - chart.padding.top - chart.padding.bottom
  chart.svg
    .attr("width", chart.width)
    .attr("height", chart.height)
    .attr("viewBox", "0 0 " + chart.width + " " + chart.height)
  chart.wrapper
    .attr("width", chart.innerWidth)
    .attr("height", chart.innerHeight)
  chart.clipInner
    .attr("width", chart.innerWidth)
    .attr("height", chart.innerHeight)
  chart.wrapper.attr("transform", "translate(" + chart.padding.left + "," + chart.padding.top + ")")
  chart.AxisX.attr("transform", "translate(0," + chart.innerHeight + ")")
  chart.AxisY2.attr("transform", "translate(" + chart.innerWidth + ",0)")
  chart.LabelX.attr("x", chart.innerWidth).attr("y", -6)
  chart.LabelY.attr("y", 6).attr("dy", ".71em")
  chart.LabelY2.attr("y", -12).attr("dy", ".71em")
  chart.GridX.attr("transform", "translate(0," + chart.innerHeight + ")")

  d3.chart.draw(chart)

  return chart
}

d3.chart.draw = (chart) => {
  if (!chart.data) return

  if (chart.rescale !== false || !chart.scaleX) {
    chart.domainX = chart._domainX(chart)
    chart.domainY = chart._domainY(chart)
    chart.domainY2 = chart._domainY2(chart)
  }

  chart.scaleX = chart._scaleX(chart).domain(chart.domainX)
  chart.scaleY = chart._scaleY(chart).domain(chart.domainY)
  chart.scaleY2 = chart._scaleY2(chart).domain(chart.domainY2)
  if (chart._niceX) chart.scaleX.nice(chart.innerWidth / 80)
  if (chart._niceY) chart.scaleY.nice(chart.innerHeight / 40)

  chart.axisX = chart._axisX(chart)
  chart.axisY = chart._axisY(chart)
  chart.axisY2 = chart._axisY2(chart)
  chart.gridX = chart._gridX(chart)
  chart.AxisX.call(chart.axisX)
  chart.GridX.call(chart.gridX)
  if (chart.fieldsY.length > 0) chart.AxisY.call(chart.axisY)
  if (chart.fieldsY2.length > 0) chart.AxisY2.call(chart.axisY2)
  chart.LabelX.text(chart.labelX)
  chart.LabelY.text(chart.labelY)
  chart.LabelY2.text(chart.labelY2)

  d3.chart[chart.type](chart)

  return chart
}


d3.chart.line = (chart) => {
  var line_iterator = (field, scale) => {
    var line = d3.line().curve(d3.curveStep)
      .x(d => chart.scaleX(d[chart.fieldX]))
      .y(d => chart[scale](d[field]))

    chart.shapes.select('.' + field).remove()
    chart.shapes
      .datum(chart.data)
      .append("path")
      .classed(field, true)
      .attr("d", line)
  }

  chart.fieldsY.forEach(field => line_iterator(field, 'scaleY'))
  chart.fieldsY2.forEach(field => line_iterator(field, 'scaleY2'))

  return chart
}
d3.chart.notype = (chart) => chart

d3.chart.updateEnterPattern = (chart, type = 'rect') => {
  var update = chart.shapes
    .selectAll(type)
    .data(chart.data)
    .classed('update', true)

  var exit = update
    .exit()
    .classed('exit', true)
    .remove()

  var enter = update
    .enter()
    .append(type)
    .attr('class', d => d._class)
    // .classed(field, true)
    .classed('enter', true)

  var updateEnter = update.merge(enter)

  return { update, exit, enter, updateEnter }
}

d3.chart.bar = (chart) => {
  var { update, exit, enter, updateEnter } = d3.chart.updateEnterPattern(chart)
  updateEnter
    .attr('x', d => chart.scaleX(d.key))
    .attr('y', d => (d.value>=0) ? chart.scaleY(d.value) : chart.scaleY(0))
    .attr('width', d => chart.scaleX.bandwidth())
    .attr('height', d =>  Math.abs(chart.scaleY(0) - chart.scaleY(d.value)))
    .attr('class', d => chart.fieldsY[0] )
    .classed('positive', d => d.value >=0)
    .classed('negative', d => d.value <0)
  return chart
}
d3.chart.bar._scaleX = c => d3.scaleBand().rangeRound([0, c.innerWidth]).padding(0.2)
d3.chart.bar._domainX = c => c.data.map(g => g.key)
d3.chart.bar._domainY = c => [0, d3.max(c.data.map(d => d3.max(d.value.map(d => d[Object.keys(d)[0]]))))]

d3.chart.hbar = (chart) => {
  var { update, exit, enter, updateEnter } = d3.chart.updateEnterPattern(chart)
  var t0 = d3.transition().duration(100)
  var t1 = t0.transition().duration(250)
  var t2 = t1.transition().duration(250)
  enter
    .attr('y', (d, i) => chart.scaleX(d.group) + (i * (chart.scaleX.bandwidth()) / 2) + Math.ceil(chart.group_padding / 2))
    .attr('x', d => 0)
    .attr('height', d => chart.scaleX.bandwidth() / chart.fieldsY.length - chart.group_padding)
    .attr('width', d => 0)
    .transition(t2)
    .attr('width', d => chart.scaleY(d.value))
    .style("fill", (d, i) => chart.colors[i])
  update
    .attr('y', (d, i) => chart.scaleX(d.group) + (i * (chart.scaleX.bandwidth()) / 2) + Math.ceil(chart.group_padding / 2))
    .attr('x', d => 0)
    .transition(t1)
    .attr('height', d => chart.scaleX.bandwidth() / chart.fieldsY.length - chart.group_padding)
    .attr('width', d => chart.scaleY(d.value))
    .style("fill", (d, i) => chart.colors[i])
  exit
    .transition(t0)
    .attr('width', d => 0)
    .remove()

  return chart
}
d3.chart.hbar._scaleX = c => d3.scaleBand().rangeRound([0, c.innerHeight]).padding(0.2)
d3.chart.hbar._domainX = c => c.data.map(g => g.key)
d3.chart.hbar._domainY = c => [0, d3.max(c.data.map(d => d3.max(d.value.map(d => d[Object.keys(d)[0]]))))]
d3.chart.hbar._axisX = (chart) => d3.axisBottom(chart.scaleY).ticks(chart.innerWidth / 80).tickSizeOuter(0)
d3.chart.hbar._axisY = (chart) => d3.axisLeft(chart.scaleX).ticks(chart.innerHeight / 40).tickSizeOuter(0)
d3.chart.hbar._scaleY = (chart) => d3.scaleLinear().range([0, chart.innerWidth])

d3.chart.updateEnterPattern_scatter = (chart, field, type) => {
  var update = chart.shapes
    .selectAll("." + field)
    .data(chart.data)
    .classed('update', true)

  var exit = update
    .exit()
    .classed('exit', true)
    .remove()

  var enter = update
    .enter()
    .append(type)
    .attr("class", d => (d._class)?d._class:"test")
    .classed(field, true)
    .classed('enter', true)

  var updateEnter = update.merge(enter)

  return { update, exit, enter, updateEnter }
}

d3.chart.scatter = (chart) => {
  var scatter_iterator = (field, scale) => {
    var { update, exit, enter, updateEnter } = d3.chart.updateEnterPattern_scatter(chart, field, 'circle')

    updateEnter
      .attr('r', 3)
      .attr('cx', (d) => chart.scaleX(d[chart.fieldX]))
      .attr('cy', (d) => chart[scale](d[field]))

    // apply the reults of the least squares regression
    if (chart.regression) {
      var leastSquares = (data, x, y) => {
        var sum = (a, b) => a + b

        var _x = data.map(d => d[x])
        var _y = data.map(d => d[y])

        var xBar = _x.reduce(sum) * 1.0 / data.length
        var yBar = _y.reduce(sum) * 1.0 / data.length

        var xMax = Math.max(..._x)
        var yMax = Math.max(..._y)
        var xMin = Math.min(..._x)
        var yMin = Math.min(..._y)

        var ssXX = _x.map(d => Math.pow(d - xBar, 2)).reduce(sum)
        var ssYY = _y.map(d => Math.pow(d - yBar, 2)).reduce(sum)

        var ssXY = data.map(d => (d[x] - xBar) * (d[y] - yBar)).reduce(sum)

        var slope = ssXY / ssXX
        var intercept = yBar - (xBar * slope)
        var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY)

        data.forEach(d => d['reg_' + y] = d[x] * slope + intercept)

        return {
          slope: slope,
          intercept: intercept,
          rSquare: rSquare,
          xBar: xBar,
          yBar: yBar,
          xMax: xMax,
          yMax: yMax,
          xMin: xMin,
          yMin: yMin,
          data: data
        }
      }

      var decimalFormat = d3.format("0.2f")
      var linReg = leastSquares(chart.data, chart.fieldX, chart.fieldsY[0])
      var trendData = [
        [linReg.xMin, linReg.xMin * linReg.slope + linReg.intercept, linReg.xMax, linReg.xMax * linReg.slope + linReg.intercept]
      ]

      chart.shapes.selectAll(".trendline").remove()
      chart.shapes.selectAll(".trendline-label").remove()
      var trendline = chart.shapes.selectAll(".trendline").data(trendData)
      trendline.enter()
        .append("line")
        .attr("class", "trendline")
        .attr("x1", d => chart.scaleX(d[0]))
        .attr("y1", d => chart.scaleY(d[1]))
        .attr("x2", d => chart.scaleX(d[2]))
        .attr("y2", d => chart.scaleY(d[3]))
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        // display equation on the chart
      chart.shapes
        .append("text")
        .text("Eq: " + decimalFormat(linReg.slope) + "x + " + decimalFormat(linReg.intercept) + ', r2=' + decimalFormat(linReg.rSquare))
        .attr("class", "trendline-label")
        .attr("x", d => chart.scaleX(linReg.xBar))
        .attr("y", d => chart.scaleY(linReg.yBar))
    }
  }

  chart.fieldsY.forEach(field => scatter_iterator(field, 'scaleY'))
  chart.fieldsY2.forEach(field => scatter_iterator(field, 'scaleY2'))

  return chart
}

d3.chart.defaults = {
  _domainX: (chart) => d3.extent(chart.data.map((d) => d[chart.fieldX])),
  _scaleX: (chart) => d3.scaleLinear().range([0, chart.innerWidth]), // NOTE: use nice(chart.innerWidth / 100) ?
  _axisX: (chart) => d3.axisBottom(chart.scaleX).ticks(chart.innerWidth / 80).tickSizeOuter(0),
  _domainY: (chart) => d3.extent(chart.data.map((d) => d[chart.fieldsY[0]])), // TODO: map keys
  _scaleY: (chart) => d3.scaleLinear().range([chart.innerHeight, 0]),
  _axisY: (chart) => d3.axisLeft(chart.scaleY).ticks(chart.innerHeight / 40).tickSizeOuter(0),
  _domainY2: (chart) => d3.extent(chart.data.map((d) => d[chart.fieldsY2[0]])), // TODO: map keys
  _scaleY2: (chart) => d3.scaleLinear().range([chart.innerHeight, 0]),
  _axisY2: (chart) => d3.axisRight(chart.scaleY2).ticks(chart.innerHeight / 40).tickSizeOuter(0),
  _gridX: (chart) => d3.axisBottom(chart.scaleX).tickSize(-chart.innerHeight).tickFormat(() => null),
  _niceX : false,
  _niceY : true,
  labelX: '',
  labelY: '',
  labelY2: '',
  fieldX: [],
  fieldsY: [],
  fieldsY2: [],
  colors: [],
  group_padding: 1,
  // plugins: [d3.chart.onresize],
}

d3.chart.destroy = (chart) => {
  d3.charts.splice(d3.charts.indexOf(chart), 1)
  chart.svg.remove()
  delete chart.width
  delete chart.height

  return chart
}

d3.chart.resizeAll = () => d3.charts.map(d3.chart.resize)
d3.chart.hideAll = () => d3.charts.map(c => c.svg.style('display', 'none'))
d3.chart.showAll = () => d3.charts.map(c => c.svg.style('display', null))
d3.chart.delayResizeAll = (() => {
  d3.chart.resizeAll()
  d3.chart.showAll()
})
window.addEventListener('resize', (e) => {
  d3.chart.hideAll()
  d3.chart.delayResizeAll()
}, false)
