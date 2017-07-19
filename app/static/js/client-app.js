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

	RETURNS = [1, 30, 60];
	capstone.RETURNS = RETURNS;

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
			capstoneApp.refreshData()
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

	capstone.events.forecastDate_changed = function(capstoneApp, evt){
		console.log("Hey")
		capstoneApp.selectDate(evt.target.value);
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
	};

	capstone.sync.predictions_fetch = function(symbol){
		var _req = {
			url:'/predict/'+symbol,
			type:'GET',
			dataType: "JSON"
		}

		$.ajax(_req)
			.done(capstone.events.predictions_received)
			.fail(capstone.events.syncError.bind(null, "capstone.sync.predictions_fetch"))
	};

	/**
	*	UI
	*/
	capstone.ui.computeIsActiveTimePeriod = function(capstoneApp, timeperiod){
		var _v = capstoneApp.obs_data.selected_timeperiod();

		return _v == timeperiod;
	};

	capstone.ui.computeGridLabel = function(capstoneApp, isforecast, return_time){
		var _isShowPrices = capstoneApp.obs_data.isShowPrices();
		var _activeDate = capstoneApp.obs_data.active_date_idx();
		var _hasForecast = capstoneApp.ui.activeDateHasForecast();
		var _return_col, _price_col;
		var _r;
		var _value;
		
		if(_hasForecast){
			if(isforecast){
				_return_col = "RETURN_" + return_time;
				_price_col= "Close_" + return_time;

				_value = capstone.utils.predictionColumn((_isShowPrices ? _price_col : _return_col), false)[_activeDate]

				if(_isShowPrices){
					_r = numeral(_value).format("0.00");
				}
			}
			else{
				var _date_col = "forecastDate_" + return_time;
				var _date_computed_val = capstoneApp.ui[_date_col]();
				var _final_date = capstone.utils.pricesColumn("Date", false).indexOf(_date_computed_val);
				
				if (_final_date == -1 ){
					_r = "No Forecast";
				}
				else{
					_r = capstone.utils.pricesColumn("Close", false)[_final_date]
				}
			}
		}
		else{
			_r = "No Forecast";
		}

		//console.log(isforecast, return_time, _value, _r);

		return _r;
	};

	capstone.ui.computeActiveDateLabel = function(capstoneApp){
		var _activeDate = capstoneApp.obs_data.active_date();
		var _r;

		if (_activeDate){
			_r = _activeDate;
		}
		else{
			_r = "No date selected";
		}

		return _r;
	};

	capstone.ui.computeForecastDate = function(capstoneApp, return_time){
		var _activeDate = capstoneApp.obs_data.active_date_idx();
		var _hasForecast = capstoneApp.ui.activeDateHasForecast();
		var _r;


		if (_hasForecast){
			switch(return_time){
				case 1:
					_r = capstone.utils.predictionColumn("Date_1", false)[_activeDate];
					break;
				case 30:
					_r = capstone.utils.predictionColumn("Date_30", false)[_activeDate];
					break;
				case 60:
					_r = capstone.utils.predictionColumn("Date_60", false)[_activeDate];
					break;

			}
		}
		else{
			_r = "No Forecast";
		}

		return _r;
	};

	capstone.ui.computeActiveDateHasForecast = function(capstoneApp){
		var _activeDate = capstoneApp.obs_data.active_date();
		return capstoneApp.obs_data.active_date_idx() > -1;
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
			,selected_timeperiod: ko.observable(TIMEPERIODS["1M"])
			,isShowPrices: ko.observable(true)
			,active_date: ko.observable(undefined)
			,active_date_idx: ko.observable(undefined)
		};

		this.ui.activeDateHasForecast = ko.computed(capstone.ui.computeActiveDateHasForecast.bind(null, this));

		this.ui.isActiveTimePeriod_All = ko.computed(capstone.ui.computeIsActiveTimePeriod.bind(null, this, TIMEPERIODS["ALL"]));
		this.ui.isActiveTimePeriod_1Y = ko.computed(capstone.ui.computeIsActiveTimePeriod.bind(null, this, TIMEPERIODS["1Y"]));
		this.ui.isActiveTimePeriod_3M = ko.computed(capstone.ui.computeIsActiveTimePeriod.bind(null, this, TIMEPERIODS["3M"]));
		this.ui.isActiveTimePeriod_1M = ko.computed(capstone.ui.computeIsActiveTimePeriod.bind(null, this, TIMEPERIODS["1M"]));
		this.ui.isActiveTimePeriod_5D = ko.computed(capstone.ui.computeIsActiveTimePeriod.bind(null, this, TIMEPERIODS["5D"]));

		this.ui.forecastDate = ko.computed(capstone.ui.computeActiveDateLabel.bind(null, this));
		this.ui.forecastDate_1 = ko.computed(capstone.ui.computeForecastDate.bind(null, this, 1));
		this.ui.forecastDate_30 = ko.computed(capstone.ui.computeForecastDate.bind(null, this, 30));
		this.ui.forecastDate_60 = ko.computed(capstone.ui.computeForecastDate.bind(null, this, 60));

		this.ui.forecast_1 = ko.computed(capstone.ui.computeGridLabel.bind(null, this, true, 1));
		this.ui.forecast_30 = ko.computed(capstone.ui.computeGridLabel.bind(null, this, true, 30));
		this.ui.forecast_60 = ko.computed(capstone.ui.computeGridLabel.bind(null, this, true, 60));
		this.ui.real_1 = ko.computed(capstone.ui.computeGridLabel.bind(null, this, false, 1));
		this.ui.real_30 = ko.computed(capstone.ui.computeGridLabel.bind(null, this, false, 30));
		this.ui.real_60 = ko.computed(capstone.ui.computeGridLabel.bind(null, this, false, 60));
		
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

		this.obs_data.active_date(undefined)
		this.obs_data.active_date_idx(undefined)
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
		this.__raw__.selectizeObj[0].selectize.clear()
	};

	App.prototype.refreshData = function() {
		var _symbol = capstone.utils.tickerSymbol(this.obs_data.selected_ticker());
		capstone.sync.prices_fetch(_symbol);
	};

	App.prototype.drawPricePlot = function(){
		
		var _parent = $("#prices-plot").get(0).parentNode
		$("#prices-plot").remove();
		$("#volume-plot").remove();
		_parent.innerHTML = '<div id="prices-plot" class="row" style="height: 300px;"></div><div id="volume-plot" class="row" style="height: 100px;"></div>';

		var close_ax = {
			x: capstone.utils.pricesColumn("Date")
			,y: capstone.utils.pricesColumn("Close")
			,type: 'scatter'
			,name: 'Close ($)'
		};

		var volume_ax = {
			x: capstone.utils.pricesColumn("Date")
			,y: capstone.utils.pricesColumn("Volume")
			,type: 'bar'
			,name: 'Volume'
			,marker: {color: 'rgb(142,124,195)'}
		};

		var data = [close_ax]

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


		$("#prices-plot").get(0).on('plotly_hover', function(plotlyData){
			if(plotlyData.xvals.length){
				var _datestr = plotlyData.points[0].x;
				capstoneApp.selectDate(_datestr);
			}
		});
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

	App.prototype.selectDate = function(dateString){
		console.log("Event date:", dateString);
		var _idx = capstone.utils.predictionColumn("Date", false).indexOf(dateString);
		console.log("Date index:", _idx);
		_idx = _idx > -1 ? _idx : undefined;

		this.obs_data.active_date(dateString);
		this.obs_data.active_date_idx(_idx);
	};

	capstone.App = App;
	window.capstone = capstone;
})()