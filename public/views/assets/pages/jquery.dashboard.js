!function($) {
    "use strict";

    var Dashboard1 = function() {
    	this.$realData = []
    };

    //creates Bar chart
    Dashboard1.prototype.createBarChart  = function(element, data, xkey, ykeys, labels, lineColors) {
        Morris.Bar({
            element: element,
            data: data,
            xkey: xkey,
            ykeys: ykeys,
            labels: labels,
            hideHover: 'auto',
            resize: true, //defaulted to true
            gridLineColor: '#eeeeee',
            barSizeRatio: 0.2,
            barColors: lineColors
        });
    },

    //creates line chart
    Dashboard1.prototype.createLineChart = function(element, data, xkey, ykeys, labels, opacity, Pfillcolor, Pstockcolor, lineColors) {
        Morris.Line({
          element: element,
          data: data,
          xkey: xkey,
          ykeys: ykeys,
          labels: labels,
          fillOpacity: opacity,
          pointFillColors: Pfillcolor,
          pointStrokeColors: Pstockcolor,
          behaveLikeLine: true,
          gridLineColor: '#eef0f2',
          hideHover: 'auto',
          resize: true, //defaulted to true
          pointSize: 0,
          lineColors: lineColors
        });
    },

    //creates Donut chart
    Dashboard1.prototype.createDonutChart = function(element, data, colors) {
        Morris.Donut({
            element: element,
            data: data,
            resize: true, //defaulted to true
            colors: colors
        });
    },

    Dashboard1.prototype.createAreaChartDotted = function(element, pointSize, lineWidth, data, xkey, ykeys, labels, Pfillcolor, Pstockcolor, lineColors) {
        Morris.Line({
            element: element,
            pointSize: 3,
            lineWidth: 3,
            data: data,
            xkey: xkey,
            ykeys: ykeys,
            labels: labels,
            hideHover: 'auto',
            pointFillColors: Pfillcolor,
            pointStrokeColors: Pstockcolor,
            resize: true,
            lineColors: lineColors
        });
    },


    Dashboard1.prototype.init = function() {

      let self = this;
      var $portfolioData = [
        { y: '2017-01-09', a: 5, b:5 },
        { y: '2017-01-10', a: 7, b:5 },
        { y: '2017-01-11', a: 8, b:6 },
        { y: '2017-01-12', a: 10, b:7 },
        { y: '2017-01-13', a: 9, b:14 },
        { y: '2017-01-14', a: 11, b:17 },
        { y: '2017-01-15', a: 9, b:19 },
        { y: '2017-01-16', a: 15, b:16 },
        { y: '2017-01-17', a: 16, b:22 },
        { y: '2017-01-18', a: 20, b:27 }
      ];

      $.ajax({
        url: "/api/portfolio_history_index",
        type: "post",
        contentType : 'application/json',
        success: function(portfolioData) {
          // console.log(portfolioData);
          self.createAreaChartDotted('morris-area-with-dotted', 0, 0, portfolioData.data, 'y', portfolioData.names, portfolioData.names,['#71b6f9'],['#999999'], ['#5b69bc','#10c469','#188ae2']);
        }
      });

      var $areaDotData = [
          { y: '2009', a: 10, b: 20 },
          { y: '2010', a: 75,  b: 65 },
          { y: '2011', a: 50,  b: 40 },
          { y: '2012', a: 75,  b: 65 },
          { y: '2013', a: 50,  b: 40 },
          { y: '2014', a: 75,  b: 65 },
          { y: '2015', a: 90, b: 60 }
      ];

        //create line chart
        // var $data  = [
        //     { y: '2008', a: 50, b: 0 },
        //     { y: '2009', a: 75, b: 50 },
        //     { y: '2010', a: 30, b: 80 },
        //     { y: '2011', a: 50, b: 50 },
        //     { y: '2012', a: 75, b: 10 },
        //     { y: '2013', a: 50, b: 40 },
        //     { y: '2014', a: 75, b: 50 },
        //     { y: '2015', a: 100, b: 70 }
        //   ];
        // this.createLineChart('morris-line-example', $data, 'y', ['a','b'], ['Series A','Series B'],['0.9'],['#ffffff'],['#999999'], ['#10c469','#188ae2']);

        //creating donut chart
        var $donutData = [
                {label: "Securities", value: 5},
                {label: "Stocks", value: 30},
                {label: "Bonds", value: 20}
            ];
        this.createDonutChart('morris-donut-example', $donutData, ['#ff8acc', '#5b69bc', "#35b8e0"]);
    },
    //init
    $.Dashboard1 = new Dashboard1, $.Dashboard1.Constructor = Dashboard1
}(window.jQuery),

//initializing
function($) {
    "use strict";
    $.Dashboard1.init();
}(window.jQuery);
