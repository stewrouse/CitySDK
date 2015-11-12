require([
	"esri/map",
	"esri/layers/FeatureLayer",
	"dojo/parser",
	"esri/tasks/GeometryService",
	"esri/tasks/ProjectParameters",
	"esri/request",
	"esri/symbols/SimpleFillSymbol",
	"esri/Color",
	"esri/symbols/SimpleLineSymbol",
	"esri/graphic",
	"dijit/layout/BorderContainer",
	"dijit/layout/ContentPane",
	"dojo/domReady!"],
	function (
		Map,
		FeatureLayer,
		parser,
		GeometryService,
		ProjectParameters,
		esriRequest,
		SimpleFillSymbol,
		Color,
		SimpleLineSymbol,
		Graphic
	)
			{
				parser.parse();
				var geomServ = new GeometryService("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
				
				var map = new Map("map", {
				basemap: "topo",  
				center: [-122.45, 37.75],
				zoom: 13
				});
				
				map.on("layers-add-result",layerAdded);
				function layerAdded(evt)
				{
					if(evt.layers[0].layer.spatialReference.wkid == 4326)
					{
						map.setExtent(evt.layers[0].layer.initialExtent);
						evt.layers[0].layer.on("click", layerClick);
					}
					else
					{
						var projParam = new ProjectParameters();
						projParam.geometries = [evt.layers[0].layer.initialExtent];
						projParam.outSR = map.spatialReference;
						geomServ.project(projParam,function(result)
						{
							map.setExtent(result[0]);
						});
						evt.layers[0].layer.on("click", layerClick);
					}
				}
				
				function layerClick(evt)
				{
					if($("input[name='variable']:checked").length>0)
					{
						
						var sdk = new CitySDK();
						var censusModule = sdk.modules.census;
						censusModule.enable("315210ddaf6505f170cb116e16d5a1ec69ffe699");
						var tempVars = $(":checked");
						var censusVars = [];
						
						var lat = evt.mapPoint.getLatitude();
						var lng = evt.mapPoint.getLongitude();
						
						for (i=0; i<tempVars.length; i++)
						{
							censusVars.push(tempVars[i].value);
							$("#results > tbody:last-child").append("<tr id="+censusVars[i]+"><td>" + tempVars[i].nextSibling.data + "</td><td></td></tr>");
							console.log(tempVars[i].nextSibling.data);
						}
						
						if (typeof polyGraphic != 'undefined')
						{
							map.graphics.remove(polyGraphic);
						}
						
						var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_DIAGONAL_CROSS,
						new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
						new Color([255,0,0]), 2),new Color([255,255,0,0.25]));
						var polyGraphic = new Graphic(evt.graphic.geometry, sfs);
						
						map.graphics.add(polyGraphic);
						
						var request = 
							{
								"lat":lat,
								"lng":lng,
								"level":"tract",
								"container":"state",
								"variables":censusVars
							}
						censusModule.APIRequest(request,function(response)
						{
							console.log(response);
							for(i=0; i<response.variables.length; i++)
							{
								for(i=0; i<response.variables.length; i++)
								{
									if(response.variables[i] == censusVars[i])
									{
										var y = response.variables[i];
										var dataCell = $("#"+censusVars[i]).children().last();
										dataCell[0].innerText = response.data[0][y];
									}
								}
							}
						});	
					}
				}
				
				$("body").on("click",".myBtn", function (evt)
				{
					
					$("firsttag").remove();
					switch(evt.currentTarget.id)
					{
						case "addLayer":

							var url = $("input[name='urlInput']")[0].value;
							var visibleLayer = $("input:checked")[0].value;
							var featureLayerUrl = url + "/" + visibleLayer;
							if(url.indexOf("http") == -1)
							{
								alert("Please enter a valid URL");
							}
							layer = new FeatureLayer(featureLayerUrl);
							map.addLayers([layer]);
							
							$("firsttag").remove();
							break;
						
						case "getData":
							console.log("in get data");
							esriConfig.defaults.io.corsEnabledServers.push($("input[name='urlInput']")[0].value);
							var requestHandle = esriRequest(
							{
								"url": url = $("input[name='urlInput']")[0].value,
								"content":
								{
									"f": "json"
								},
								"calbackParamName":"callback"
							});
							requestHandle.then(function(response)
							{
								for(i=0; i<response.layers.length;i++)
								{
									console.log(response.layers[i].name);
									var subLayerName = response.layers[i].name;
									var sublayerBtn = "<input type='radio' name='sublayer' value=" +i+ ">"+response.layers[i].name+"<br>";
									$("#belowMap").append(sublayerBtn);
								}
								$("firsttag").remove();
								$("#belowMap").append("<button id='addLayer' class='myBtn' disabled>Add Layer</button>").append("<button id='nextPage' class='myBtn' disabled>Continue: Select Census Attributes</button>");
							}, function(error)
							{
								console.log(error.message);
							});
							break;
							
							case "nextPage":
								functionList[x]();
								break;
					}
				});
				
				$("body").on("click", "[name='sublayer']", function(evt)
				{
					$("#addLayer").removeAttr("disabled");
				});
				
				var x=0;
				var functionList=[];
				functionList[0] = function toPage2()
				{
					$.get("page2_v3.html",function(data)
					{
						var temp = $.trim(data);
						var html = $.parseHTML(temp);
						console.log(html);
						$("#aboveMap").empty().append(html[0]);
						$("#belowMap").empty().append(html[2]);
						//$("[name='urlInput']").removeAttr("disabled");
					})
					.done(function()
					{	
					})
					.always(function()
					{	
					});
					x++;
				}
				
				functionList[1] = function toPage3()
				{
					$.get("page3_v3.html",function(data)
					{
						var temp = $.trim(data);
						var html = $.parseHTML(temp);
						console.log(html);
						$("#aboveMap").empty().append(html[0]);
						$("#belowMap").empty().append(html[2]).append(html[3]).append(html[7]);
					})
					.done(function()
					{	
					})
					.always(function()
					{	
					});
				}
			});