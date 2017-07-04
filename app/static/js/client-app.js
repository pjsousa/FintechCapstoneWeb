(function(){
	var capstone = {};
	capstone.events = {};
	capstone.sync = {};
	capstone.ui = {};
	capstone.utils = {};

	/**
	*	EVENTS
	*/
	capstone.events.tickers_received = function(response){
		capstoneApp.storeTickersList(response);
	};

	capstone.events.prices_received = function(response){
		capstoneApp.storePrices(response);
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

	/**
	*	UI
	*/


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

	capstone.utils.pricesColumn = function(columnName){
		var _col_idx = capstoneApp.__raw__.prices.columns.indexOf(columnName);
		var _data = capstoneApp.__raw__.prices.data;
		var _rowsRange = d3.range(0, _data.size()[0]);
		return math.flatten(math.subset(_data, math.index(_rowsRange, _col_idx))).toArray();
	};

	/**
	*	Controller
	*/
	function App(){
		this.__raw__ = {
			tickers: undefined
			,prices: undefined
			,selectizeObj: undefined
		};

		this.obs_data = {
			ticker_arr: ko.observable(undefined)
			,selected_ticker: ko.observable(undefined)
			,selected_timewindow: ko.observable(undefined)
		};

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
		this.__raw__.prices = response;
		this.__raw__.prices.data = math.matrix(this.__raw__.prices.data)
		
		this.drawPricePlot();
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
		var trace1 = {
			x: capstone.utils.pricesColumn("Date")
			,close: capstone.utils.pricesColumn("Close")
			,high: capstone.utils.pricesColumn("High")
			,line: {color: 'rgba(31,119,180,1)'}
			,low: capstone.utils.pricesColumn("Low")
			,open: capstone.utils.pricesColumn("Open")
			,type: 'candlestick'
			,xaxis: 'x'
			,yaxis: 'y'
		};

		var data = [trace1];

		var layout = {
			dragmode: 'zoom', 
			margin: {
				r: 10, 
				t: 25, 
				b: 40, 
				l: 60
			}, 
			showlegend: false, 
			xaxis: {
				autorange: true, 
				domain: [0, 1], 
				//range: ['2017-01-03 12:00', '2017-02-15 12:00'], 
				//rangeslider: {range: ['2017-01-03 12:00', '2017-02-15 12:00']}, 
				title: 'Date', 
				type: 'date'
			}, 
			yaxis: {
				autorange: true, 
				domain: [0, 1], 
				//range: [114.609999778, 137.410004222], 
				type: 'linear'
			}
		};

		Plotly.plot('prices-plot', data, layout);
	};

	capstone.App = App;
	window.capstone = capstone;
})()