chart1 = d3.chart({
  bindto: '#chart1',
  type: 'scatter',
  // _axisY: (chart) => d3.chart.defaults._axisY(chart).tickFormat((d) => d3.format('.1d')(d * 10000) + 'bp'),
  fieldX: 'GOLD',
  fieldsY: ['USDX'],
  labelX: 'Gold',
  labelY: 'Usdx',
})


d3.csv("data/goldVSusdx.csv", function (data) {
  window.data = data
  // chart1.data = data

})
