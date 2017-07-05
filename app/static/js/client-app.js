(function(){
	var capstone = {};
	capstone.events = {};
	capstone.sync = {};
	capstone.ui = {};
	capstone.utils = {};

	var TIMEPERIODS = {
		"ALL": 0
		,"1Y": 1
		,"3M": 2
		,"1M": 3
		,"5D": 4
	};
	capstone.TIMEPERIODS = TIMEPERIODS;

	/**
	*	EVENTS
	*/
	capstone.events.tickers_received = function(response){
		capstoneApp.storeTickersList(response);
	};

	capstone.events.prices_received = function(response){
		capstoneApp.storePrices(response);
	};

	capstone.events.predictions_received = function(response){
		capstoneApp.storePredictions(response);
	};

	capstone.events.syncError = function(method, xhr, errorType, error ){
		alert(method + " - " + errorType + " - " + error);
	};

	capstone.events.selectedTicker_changed = function(newValue){
		if(newValue == ""){
			capstoneApp.obs_data.selected_ticker(undefined)
		}
		else{
			capstoneApp.obs_data.selected_ticker(newValue)
			capstoneApp.refreshPricePlot()
		}
	};

	capstone.events.timeperiod_changed = function(newTimePeriod, capstoneApp, evt){
		if(capstoneApp.obs_data.selected_timeperiod() != newTimePeriod){
			capstoneApp.obs_data.selected_timeperiod(newTimePeriod);
			capstoneApp.drawPricePlot();
		};

		evt.target.blur();
		evt.preventDefault();
	};

	/**
	*	SYNC
	*/
	capstone.sync.tickers_fetch = function(){
		var _req = {
			url:'/tickers',
			type:'GET',
			dataType: "JSON",
			//data:JSON.stringify({})
		}

		$.ajax(_req)
			.done(capstone.events.tickers_received)
			.fail(capstone.events.syncError.bind(null, "capstone.sync.tickers_fetch"))
	};

	capstone.sync.prices_fetch = function(symbol){
		var _req = {
			url:'/prices/'+symbol,
			type:'GET',
			dataType: "JSON"
		}

		$.ajax(_req)
			.done(capstone.events.prices_received)
			.fail(capstone.events.syncError.bind(null, "capstone.sync.prices_fetch"))
	}

	capstone.sync.predictions_fetch = function(symbol){
		var _req = {
			url:'/predict/'+symbol,
			type:'GET',
			dataType: "JSON"
		}

		$.ajax(_req)
			.done(capstone.events.predictions_received)
			.fail(capstone.events.syncError.bind(null, "capstone.sync.predictions_fetch"))
	}

	/**
	*	UI
	*/
	capstone.ui.computeIsActiveTimePeriod = function(capstoneApp, timeperiod){
		var _v = capstoneApp.obs_data.selected_timeperiod();

		return _v == timeperiod;
	};


	/**
	*	UTILS
	*/
	capstone.utils.tickerTitle = function(key){
		return capstoneApp.__raw__.tickers.data[key].slice(0,2).join(" - ")
	};

	capstone.utils.tickerSymbol = function(key){
		return capstoneApp.__raw__.tickers.data[key][0];
	};

	capstone.utils.tickerName = function(key){
		return capstoneApp.__raw__.tickers.data[key][1];
	};

	capstone.utils.pricesColumn = function(columnName, sliceData){
		var _col_idx;
		var _data;
		var _rowsRange;
		var _sliceIdx;
		var _r;

		_sliceIdx = -1;
		sliceData = typeof sliceData === "undefined" ? true : sliceData;

		switch(capstoneApp.obs_data.selected_timeperiod()){
			case TIMEPERIODS["1Y"]:
				_sliceIdx = capstoneApp.__raw__.pricedates_1Y;
				break;
			case TIMEPERIODS["3M"]:
				_sliceIdx = capstoneApp.__raw__.pricedates_3M;
				break;
			case TIMEPERIODS["1M"]:
				_sliceIdx = capstoneApp.__raw__.pricedates_1M;
				break;
			case TIMEPERIODS["5D"]:
				_sliceIdx = capstoneApp.__raw__.pricedates_5D;
				break;
			default:
				_sliceIdx = capstoneApp.__raw__.pricedates_all;
				break;
		}

		_col_idx = capstoneApp.__raw__.prices.columns.indexOf(columnName);
		_data = capstoneApp.__raw__.prices.data;
		_rowsRange = d3.range(0, _data.size()[0]);
		_r = math.flatten(math.subset(_data, math.index(_rowsRange, _col_idx))).toArray();

		if(sliceData && _sliceIdx > 0){
			_r = _r.slice(_sliceIdx, _r.length)
		}

		return _r;
	};

	capstone.utils.predictionColumn = function(columnName, sliceData){
		var _col_idx;
		var _data;
		var _rowsRange;
		var _sliceIdx;
		var _r;

		_sliceIdx = -1;
		sliceData = typeof sliceData === "undefined" ? true : sliceData;

		switch(capstoneApp.obs_data.selected_timeperiod()){
			case TIMEPERIODS["1Y"]:
				_sliceIdx = capstoneApp.__raw__.predictiondates_1Y;
				break;
			case TIMEPERIODS["3M"]:
				_sliceIdx = capstoneApp.__raw__.predictiondates_3M;
				break;
			case TIMEPERIODS["1M"]:
				_sliceIdx = capstoneApp.__raw__.predictiondates_1M;
				break;
			case TIMEPERIODS["5D"]:
				_sliceIdx = capstoneApp.__raw__.predictiondates_5D;
				break;
			default:
				_sliceIdx = capstoneApp.__raw__.predictiondatesall;
				break;
		}

		_col_idx = capstoneApp.__raw__.predictions.columns.indexOf(columnName);
		_data = capstoneApp.__raw__.predictions.data;
		_rowsRange = d3.range(0, _data.size()[0]);
		_r = math.flatten(math.subset(_data, math.index(_rowsRange, _col_idx))).toArray();

		if(sliceData && _sliceIdx > 0){
			_r = _r.slice(_sliceIdx, _r.length)
		}

		return _r;
	};

	/**
	*	Controller
	*/
	function App(){
		this.ui = {};
		this.__raw__ = {
			tickers: undefined
			,prices: undefined
			,predictions: undefined
			,pricedates_parsed: undefined
			,pricedates_all: 0
			,pricedates_1Y: undefined
			,pricedates_3M: undefined
			,pricedates_1M: undefined
			,pricedates_5D: undefined
			,predictiondates_parsed: undefined
			,predictiondates_all: 0
			,predictiondates_1Y: undefined
			,predictiondates_3M: undefined
			,predictiondates_1M: undefined
			,predictiondates_5D: undefined
			,selectizeObj: undefined
			,pricesGridObj: undefined
			,predictionsGridObj: undefined
		};

		this.obs_data = {
			ticker_arr: ko.observable(undefined)
			,selected_ticker: ko.observable(undefined)
			,selected_timewindow: ko.observable(undefined)
			,selected_timeperiod: ko.observable(TIMEPERIODS["5D"])
		};

		this.ui.isActiveTimePeriod_All = ko.computed(capstone.ui.computeIsActiveTimePeriod.bind(null, this, TIMEPERIODS["ALL"]));
		this.ui.isActiveTimePeriod_1Y = ko.computed(capstone.ui.computeIsActiveTimePeriod.bind(null, this, TIMEPERIODS["1Y"]));
		this.ui.isActiveTimePeriod_3M = ko.computed(capstone.ui.computeIsActiveTimePeriod.bind(null, this, TIMEPERIODS["3M"]));
		this.ui.isActiveTimePeriod_1M = ko.computed(capstone.ui.computeIsActiveTimePeriod.bind(null, this, TIMEPERIODS["1M"]));
		this.ui.isActiveTimePeriod_5D = ko.computed(capstone.ui.computeIsActiveTimePeriod.bind(null, this, TIMEPERIODS["5D"]));

		this.init();
	};

	App.prototype.init = function() {
		capstone.sync.tickers_fetch();
	};

	App.prototype.storeTickersList = function(response) {
		this.__raw__.tickers = response;
		this.obs_data.ticker_arr(d3.range(response.data.length))
		this.initSelectize();
	};

	App.prototype.storePrices = function(response) {
		var _max_date;
		var _1y, _3m, _1m, _5d;
		var _symbol;

		this.__raw__.prices = response;
		this.__raw__.prices.data = math.matrix(this.__raw__.prices.data)
		this.__raw__.pricedates_parsed = capstone.utils.pricesColumn("Date")
										.map(function(itr){ return moment(itr, "YYYY-MM-DD").toDate(); });

		_max_date = d3.max(this.__raw__.pricedates_parsed);

		 _1y = moment(_max_date).subtract(1, "year").toDate();
		 _3m = moment(_max_date).subtract(3, "month").toDate();
		 _1m = moment(_max_date).subtract(1, "month").toDate();
		 _5d = moment(_max_date).subtract(5, "day").toDate();

		this.__raw__.pricedates_1Y = capstoneApp.__raw__.pricedates_parsed
		 	.filter(function(itr){ return moment(itr).isSameOrAfter(_1y); })
		this.__raw__.pricedates_3M = capstoneApp.__raw__.pricedates_parsed
		 	.filter(function(itr){ return moment(itr).isSameOrAfter(_3m); })
		this.__raw__.pricedates_1M = capstoneApp.__raw__.pricedates_parsed
			.filter(function(itr){ return moment(itr).isSameOrAfter(_1m); })
		this.__raw__.pricedates_5D = capstoneApp.__raw__.pricedates_parsed
			.filter(function(itr){ return moment(itr).isSameOrAfter(_5d); })

		this.__raw__.pricedates_all = 0;
		this.__raw__.pricedates_1Y = this.__raw__.pricedates_parsed.length - this.__raw__.pricedates_1Y.length;
		this.__raw__.pricedates_3M = this.__raw__.pricedates_parsed.length - this.__raw__.pricedates_3M.length;
		this.__raw__.pricedates_1M = this.__raw__.pricedates_parsed.length - this.__raw__.pricedates_1M.length;
		this.__raw__.pricedates_5D = this.__raw__.pricedates_parsed.length - this.__raw__.pricedates_5D.length;

		_symbol = capstone.utils.tickerSymbol(this.obs_data.selected_ticker());
		capstone.sync.predictions_fetch(_symbol);
	};

	App.prototype.storePredictions = function(response) {
		var _max_date;
		var _1y, _3m, _1m, _5d;

		this.__raw__.predictions = response;
		this.__raw__.predictions.data = math.matrix(this.__raw__.predictions.data)
		this.__raw__.predictiondates_parsed = capstone.utils.predictionColumn("Date")
										.map(function(itr){ return moment(itr, "YYYY-MM-DD").toDate(); });

		_max_date = d3.max(this.__raw__.predictiondates_parsed);

		 _1y = moment(_max_date).subtract(1, "year").toDate();
		 _3m = moment(_max_date).subtract(3, "month").toDate();
		 _1m = moment(_max_date).subtract(1, "month").toDate();
		 _5d = moment(_max_date).subtract(5, "day").toDate();

		this.__raw__.predictiondates_1Y = capstoneApp.__raw__.predictiondates_parsed
		 	.filter(function(itr){ return moment(itr).isSameOrAfter(_1y); })
		this.__raw__.predictiondates_3M = capstoneApp.__raw__.predictiondates_parsed
		 	.filter(function(itr){ return moment(itr).isSameOrAfter(_3m); })
		this.__raw__.predictiondates_1M = capstoneApp.__raw__.predictiondates_parsed
			.filter(function(itr){ return moment(itr).isSameOrAfter(_1m); })
		this.__raw__.predictiondates_5D = capstoneApp.__raw__.predictiondates_parsed
			.filter(function(itr){ return moment(itr).isSameOrAfter(_5d); })

		this.__raw__.predictiondates_all = 0;
		this.__raw__.predictiondates_1Y = this.__raw__.predictiondates_parsed.length - this.__raw__.predictiondates_1Y.length;
		this.__raw__.predictiondates_3M = this.__raw__.predictiondates_parsed.length - this.__raw__.predictiondates_3M.length;
		this.__raw__.predictiondates_1M = this.__raw__.predictiondates_parsed.length - this.__raw__.predictiondates_1M.length;
		this.__raw__.predictiondates_5D = this.__raw__.predictiondates_parsed.length - this.__raw__.predictiondates_5D.length;



		this.drawPricePlot();
		this.drawPriceGrid();
	};

	App.prototype.initSelectize = function(){
		var _opts = {
			"onChange": capstone.events.selectedTicker_changed
		}

		this.__raw__.selectizeObj = $("#ticker-picker").selectize(_opts);
	};

	App.prototype.refreshPricePlot = function() {
		var _symbol = capstone.utils.tickerSymbol(this.obs_data.selected_ticker());
		capstone.sync.prices_fetch(_symbol);
	};

	App.prototype.drawPricePlot = function(){
		var close_ax = {
			x: capstone.utils.pricesColumn("Date")
			,y: capstone.utils.pricesColumn("Close")
			,type: 'scatter'
			,name: 'Close'
		};

		var volume_ax = {
			x: capstone.utils.pricesColumn("Date")
			,y: capstone.utils.pricesColumn("Volume")
			,type: 'bar'
			,name: 'Volume'
			,marker: {color: 'rgb(142,124,195)'}
		};

		var rets_ax = [1, 5, 60, 200]
			.map(function(itr){
				var _column = "RETURN_" + itr;
				var _name = itr + ' Day Return';
				return {
					x: capstone.utils.predictionColumn("Date")
					,y: capstone.utils.predictionColumn(_column)
					,type: 'scatter'
					,name: _name
					, line: {
						dash: 'dot'
					}
				}})
		 

		var data = [close_ax].concat(rets_ax);

		var layout = {
			dragmode: null,
			margin: {
				r: 10, 
				t: 25, 
				b: 40, 
				l: 60
			}, 
			showlegend: true,
			xaxis: {
				autorange: true, 
				domain: [0, 1], 
				title: 'Date', 
				type: 'date'
			}, 
			yaxis: {
				autorange: true, 
				domain: [0, 1], 
				type: 'linear'
			}
		};

		Plotly.newPlot('prices-plot', data, layout);
		Plotly.newPlot('volume-plot', [volume_ax], layout);


		// $("#prices-plot").on('plotly_hover', function(evt, plotlyData){
		// 	if(plotlyData.xvals.length){
		// 		var _datestr = moment(plotlyData.xvals[0]).format("YYYY-MM-DD");
		// 		capstoneApp.gotoPrice(_datestr);
		// 		capstoneApp.gotoPrediction(_datestr);
		// 	}
		// })
		// .on('plotly_unhover', function(evt, plotlyData){
		//     capstoneApp.gotoPrice(null);
		// 	capstoneApp.gotoPrediction(null);
		// });
	};

	App.prototype.drawPriceGrid = function(){

		var container = $("#prices-grid").get(0);
		this.__raw__.pricesGridObj = new Handsontable(container, {
			data: this.__raw__.prices.data.toArray()
			,search: true
			,rowHeaders: d3.range(this.__raw__.prices.data.size()[0])
			,colHeaders: this.__raw__.prices.columns
			,columns: this.__raw__.prices.columns.map(function(itr){
				return {
					type: itr === "Date" ? "text" : "numeric"
					,format: itr === "Date" ? null : (itr === "Volume" ? "0,0" : '0,0.000')
				};
			})
		});

		var container = $("#predictions-grid").get(0);
		this.__raw__.predictionsGridObj = new Handsontable(container, {
			data: this.__raw__.predictions.data.toArray()
			,search: true
			,rowHeaders: d3.range(this.__raw__.predictions.data.size()[0])
			,colHeaders: this.__raw__.predictions.columns
			,columns: this.__raw__.predictions.columns.map(function(itr){
				return {
					type: itr === "Date" ? "text" : "numeric"
					,format: itr === "Date" ? null : '0,0.000'
				};
			})
		});
	};

	App.prototype.gotoPrice = function(date){
		var result = this.__raw__.pricesGridObj.search.query(date)

		if(result.length){
			this.__raw__.pricesGridObj.selectCell(result[0].row, result[0].col)
			this.__raw__.pricesGridObj.deselectCell();
		}

		this.__raw__.pricesGridObj.render();
	};

	App.prototype.gotoPrediction = function(date){
		var result = this.__raw__.predictionsGridObj.search.query(date)
		if(result.length){
			this.__raw__.predictionsGridObj.selectCell(result[0].row, result[0].col)
			this.__raw__.predictionsGridObj.deselectCell();
		}

		this.__raw__.predictionsGridObj.render();
	}

	capstone.App = App;
	window.capstone = capstone;
})()