sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"ConsumoMatnr/zppconsumomatnr/model/models",
	'sap/ui/core/Fragment',
	"ConsumoMatnr/zppconsumomatnr/utils/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/ushell/services/Container"
], function (Controller, models, Fragment, formatter, JSONModel, MessageBox, Filter, FilterOperator, MessageToast) {
	"use strict";

	return Controller.extend("ConsumoMatnr.zppconsumomatnr.controller.Home", {
		formatter: formatter,
		_byId: function (sName) {
			var cmp = this.byId(sName);
			if (!cmp) {
				cmp = sap.ui.getCore().byId(sName);
			}
			return cmp;
		},
		getODataDefault: function () {
			const sUrl = this.getOwnerComponent().getManifestObject().resolveUri("odata/sap/opu/odata/sap/ZPP_CONSUMO_MATERIAL_SRV/");
			return new sap.ui.model.odata.ODataModel(sUrl);
		},
		onInit: function () {
			var flagExt;
			//if (this.getOwnerComponent().getComponentData().startupParameters.RESPONSABLE) {
			if (this.getOwnerComponent().getComponentData()) {
				if (this.getOwnerComponent().getComponentData().startupParameters.RESPONSABLE) {
					this.flagnavigate = "X"; //Si la App es llamda desde la App del "Tablero de Formulación"
					var sParametros = this.getOwnerComponent().getComponentData().startupParameters;
					this.responsableAux = sParametros.RESPONSABLE[0];
					this.centroAux = sParametros.CENTRO[0];
					this.centro = sParametros.CENTRO[0];
					this.orden = sParametros.ORDEN[0];
					this.material = sParametros.MATERIAL[0];
					this.materiales = sParametros.MATERIAL;
					this.cantidadFal = sParametros.CANTIDAD[0];
					this.cantidadesFal = sParametros.CANTIDAD;
					this.onResponsablesSelected();
				} else {
					flagExt = "X";
				}
			} else {
				flagExt = "X";
			}

			if (flagExt == "X") {
				this.getView().setModel(models.createCenterModel(), "center");
				var that = this;

				this.getODataDefault().read("/CentroSet?$expand=CentroRespon", {
					success: function (oData) {
						for (var property in oData.results) {
							oData.results[property].CentroRespon = oData.results[property].CentroRespon.results;
						}

						var oModel = new sap.ui.model.json.JSONModel({
							results: oData.results
						});
						// oModel.setSizeLimit(10);
						that.getView().setModel(oModel, "centroRespon");
						that.createDialog(that);
					},
					error: function (oError) {
						jQuery.sap.log.error(oError);
					}
				});
			}
		},
		getStartupParameters: function (oController) {
			return oController.getOwnerComponent().getComponentData().startupParameters;
		},
		createDialog: function (that, id) {
			// switch (id) {
			// case :

			// 	break;
			// default:
			if (!that._getDialog) {
				that._getDialog = sap.ui.xmlfragment("dialogNav", "ConsumoMatnr.zppconsumomatnr.view.fragments.Center", that);
				that.getView().addDependent(that._getDialog);
			}
			that._getDialog.setModel(that.getView().getModel("centroRespon"));
			that._getDialog.open();

			// }

		},
		onAfterRendering: function () {

		},
		onSearchDialog: function (oEvent) {

			// add filter for search
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {

				aFilters.push(new Filter("descripcion", "Contains", sQuery));
				//aFilters.push(new Filter("descripcion", "Contains", sQuery));
			}
			// update list binding

			var oListDetalle = sap.ui.core.Fragment.byId("dialogNav", "listDetalle");
			var binding = oListDetalle.getBinding("items");
			//binding.filter(aFilters, "Application");

			if (aFilters.length === 0) {
				binding.filter(aFilters);
			} else {
				binding.filter(new Filter({
					filters: aFilters,
					and: false
				}));
			}

		},
		onButtonCloseDialog: function (oEvent) {
			//var oDialog = oEvent.getSource().getParent();
			//oDialog.close();

			this._getDialog.close();
		},
		onNavToPlanner: function (oEvent) {
			var oSource = oEvent.getSource();
			Fragment.byId("dialogNav", "buttonNavDialog").setVisible(true);
			var oCtx = oEvent.getSource().getBindingContext();
			var oNavCon = Fragment.byId("dialogNav", "navCon");
			var oPlannerPage = Fragment.byId("dialogNav", "planner");
			oNavCon.to(oPlannerPage);
			var oListDetalle = Fragment.byId("dialogNav", "listDetalle");

			// oListDetalle.bindElement(oCtx.getPath());
			oListDetalle.bindElement(oCtx.getPath());
		},
		onNavBack: function (oEvent) {
			var oNavCon = Fragment.byId("dialogNav", "navCon");
			oNavCon.back();
			Fragment.byId("dialogNav", "buttonNavDialog").setVisible(false);
		},

		onResponsablesSelected: function (oEvent) {
			var that = this;
			if (this.flagnavigate) {
				var respCtrl = this.responsableAux;
				var centroAux = this.centroAux;
			} else {
				this.oEvent = oEvent;
				var oListDetalle = sap.ui.core.Fragment.byId("dialogNav", "listDetalle");
				var sPath = oListDetalle._aSelectedPaths[0];
				var aPath = sPath.split("/");
				var oData = this._getDialog.getModel().getData();
				oData = JSON.parse(JSON.stringify(oData));
				var sPathCenterSelected = oListDetalle.getElementBinding().getPath();
				this.centro = this._getDialog.getModel().getProperty(sPathCenterSelected);
				var centroAux = this.centro.centro;
				this.responsable = this._getDialog.getModel().getProperty(sPath);
				for (var i = 1; i < aPath.length; i++) {
					oData = oData[aPath[i]];
				}

				var respCtrl = oData.codigo;
			}
			sap.ui.core.BusyIndicator.show();

			var aFilters = [];
			aFilters.push(new Filter("codigoRespon", FilterOperator.EQ, respCtrl));
			if (this.flagnavigate) {
				aFilters.push(new Filter("numeroOrden", FilterOperator.EQ, this.orden));
			}

			/*this.getODataDefault().read("/OrdenProcesoSet?$filter=codigoRespon eq \'" + respCtrl + "\'", {
				success: function (oData) {*/
			this.getODataDefault().read("/OrdenProcesoSet", {
				filters: aFilters,
				success: function (oData) {
					var aDataLib = [];
					// for (var i in oData.results) {
					// 	var oDataLib = {};
					// 	var aLib = oData.results[i].status.split(" ");
					// 	if (aLib[0] === "LIB.") {
					// 		oDataLib = oData.results[i];
					// 		aDataLib.push(oDataLib);
					// 	}
					// }
					// var oModel = new sap.ui.model.json.JSONModel({
					// 	ordenProceso: aDataLib
					// });
					var oModel = new sap.ui.model.json.JSONModel({
						ordenProceso: oData.results
					});
					oModel.setSizeLimit(oData.results.length);
					that.getView().setModel(oModel);
					if (!that.flagnavigate) {
						that.onButtonCloseDialog(that.oEvent);
					}
					sap.ui.core.BusyIndicator.hide();

					if (that.flagnavigate) {
						that.onItemPressOrden();
					}
				},
				error: function (oError) {
					jQuery.sap.log.error(oError);
					sap.ui.core.BusyIndicator.hide();
				}
			});

			this.getODataDefault().read("/TipoProductoSet", {
				success: function (oData) {
					var oModel = new sap.ui.model.json.JSONModel(oData.results);

					oModel.setSizeLimit(oData.results.length);
					that.getView().setModel(oModel, "tipoMaterial");
					// var aTipoMaterial = that._byId("tipoMaterial").getItems();

					//  var aTipoMaterial = sap.ui.core.Fragment.byId("popover","tipoMaterial").getItems();
					// for (var j = 0; j < aTipoMaterial.length; j++) {
					// 	aTipoMaterial[j].setSelected(true);
					// }
				},
				error: function (oError) {
					jQuery.sap.log.error(oError);
				}
			});

			this.getODataDefault().read("/AlmacenSet(centro='" + centroAux + "',responsable='" + respCtrl + "')", {
				success: function (oData) {
					var oModel = new sap.ui.model.json.JSONModel(oData);

					that.getView().setModel(oModel, "almacenConstante");
					that.getView().getModel("almacenConstante").updateBindings(true);
					// var aTipoMaterial = that._byId("tipoMaterial").getItems();

					//  var aTipoMaterial = sap.ui.core.Fragment.byId("popover","tipoMaterial").getItems();
					// for (var j = 0; j < aTipoMaterial.length; j++) {
					// 	aTipoMaterial[j].setSelected(true);
					// }
				},
				error: function (oError) {
					jQuery.sap.log.error(oError);
				}
			});
		},
		onSearch: function (oEvent) {

			// add filter for search
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new Filter("numeroOrden", "Contains", sQuery);
				aFilters.push(filter);
			}
			// update list binding
			var tableOrden = this.getView().byId("tableOrden");
			var binding = tableOrden.getBinding("items");
			//binding.filter(aFilters, "Application");
			binding.filter(aFilters);
		},
		onRefresh: function (oEvent) {
			var oRefreshButton = oEvent.getParameter("refreshButtonPressed");
			if (oRefreshButton) {
				var tableOrden = this.getView().byId("tableOrden");
				var binding = tableOrden.getBinding("items");
				binding.filter(null);
			}
		},
		filterMat: "",
		onPressFirstMaterial: function (that) {
			var items = that._byId("tableMaterial").getItems();
			if (items.length > 0) {
				that._byId("tableMaterial").setSelectedItem(items[0], true);
				that.onItemPressMaterial();
			}
		},
		onItemPressOrden: function () {
			var that = this;
			var sOrden = "";
			if (that.flagnavigate) {
				var items = that._byId("tableOrden").getItems();
				if (items.length > 0) {
					that._byId("tableOrden").setSelectedItem(items[0], true);
				}
				sOrden = that.orden;

			} else {
				var oOrden = that._byId("tableOrden").getSelectedItem().getBindingContext().getObject();
				sOrden = oOrden.numeroOrden;
			}

			var numeroOrden = sOrden;
			this.numeroOrdenTemporal = numeroOrden;
			var aFilters = [];
			aFilters.push(new Filter("numeroOrden", FilterOperator.EQ, numeroOrden));
			if (this.flagnavigate) {
				aFilters.push(new Filter("material", FilterOperator.EQ, this.material));
			}
			//this.getODataDefault().read("/MaterialsSet?$filter=numeroOrden eq \'" + numeroOrden + "\'", {
			this.getODataDefault().read("/MaterialsSet", {
				filters: aFilters,
				success: function (oData) {

					if (that.flagnavigate) {
						var aFilters = [];
						aFilters.push(new Filter("numeroOrden", FilterOperator.EQ, that.orden));
						//aFilters.push(new Filter("material", FilterOperator.EQ, that.material));
						if (that.materiales.length > 0) {
							var aMateriales = that.materiales;
							for (var j in aMateriales) {
								var sMaterial = aMateriales[j];
								aFilters.push(new Filter("material", FilterOperator.EQ, sMaterial));
							}
						}
						that.getODataDefault().read("/MaterialesAddSet", {
							filters: aFilters,
							success: function (oData) {
								var oModel = new sap.ui.model.json.JSONModel(oData.results);
								oModel.setSizeLimit(oData.results.length);
								that.getView().setModel(oModel, "materialesadd");

								var dataMaterial = that.getView().getModel("materialesadd").getData();
								/*that.materialSelected = dataMaterial.find(function (oItem) {
									return oItem.material === that.material;
								});
								that.materialSelected.cantidad = that.cantidadFal;

								that.onSaveDialogMaterial();*/

								for (var k in dataMaterial) {
									that.materialSelected = dataMaterial.find(function (oItem) {
										return oItem.material === that.materiales[k];
									});
									that.materialSelected.cantidad = that.cantidadesFal[k];
									that.materialSelected.cantidadFal = (+that.materialSelected.cantidad - +that.materialSelected.cantidadCont).toFixed(3);
									that.onSaveDialogMaterial();
								}
							},
							error: function (oError) {
								jQuery.sap.log.error(oError);
							}
						});

					} else if (oData.results.length > 0) {
						for (var i in oData.results) {
							oData.results[i].porcentaje = parseInt(oData.results[i].porcentaje);
						}
						var oModel = new sap.ui.model.json.JSONModel(oData.results);
						oModel.setSizeLimit(oData.results.length);
						that.getView().setModel(oModel, "material");
						that.getView().getModel("material").updateBindings(true);

						if (that.filterMat.length > 0) {
							that._byId("tableMaterial").getBinding("items").filter([new Filter({
								filters: that.filterMat,
								or: true
							})]);
						} else {
							that._byId("tableMaterial").getBinding("items").filter([0]);
						}
						that.onPressFirstMaterial(that);

					}
				},
				error: function (oError) {
					jQuery.sap.log.error(oError);
				}
			});

			that.onAddMateriales(numeroOrden, "0", that);

		},
		onAddMateriales: function (numeroOrden, flag, that, material) {
			if (flag === "0") {
				var aFilters = [];
				aFilters.push(new Filter("numeroOrden", FilterOperator.EQ, numeroOrden));
				that.getODataDefault().read("/MaterialesAddSet?$filter=numeroOrden eq '" + numeroOrden + "'", {
					filter: aFilters,
					success: function (oData) {
						var oModel = new sap.ui.model.json.JSONModel(oData.results);
						oModel.setSizeLimit(oData.results.length);
						that.getView().setModel(oModel, "materialesadd");
						//	that.createDialog(that);
					},
					error: function (oError) {
						jQuery.sap.log.error(oError);
					}
				});
			} else {
				that.getODataDefault().read("/MaterialesAddSet?$filter=numeroOrden eq '" + numeroOrden + "' and material eq '" + material + "'", {
					success: function (oData) {

						var materialSelected = that.materialSeleccionado.getBindingContext("material").getObject();
						// var data = oData.results;
						var data = oData.results.find(function (oItem) {
							return oItem.material === materialSelected.material;
						});
						var materialDetail = that.getView().getModel("materialDetail").getData();
						// materialDetail.material.cantidad = data.cantidad;
						materialDetail.material.fecUltRegi = data.fecUltRegi;
						materialDetail.material.horaEntr = data.horaEntr;
						materialDetail.material.nombreUser = data.nombreUser;
						materialDetail.material.flagCW = data.flagCW;
						materialDetail.material.cantidadCont = data.cantidadCont;
						if (!data.cantidadCont) {
							materialDetail.material.porcentaje = 0;
							materialSelected.porcentaje = 0;
						} else {
							materialDetail.material.porcentaje = (+data.cantidadCont / +materialDetail.material.cantidad) * 100;
							materialSelected.porcentaje = parseInt(materialDetail.material.porcentaje);
						}
						that.getView().getModel("materialDetail").updateBindings(true);
						that.getView().getModel("material").refresh();
						that.onItemPressMaterial();

						//that.onItemPressMaterial();
					},
					error: function (oError) {
						jQuery.sap.log.error(oError);
					}
				});
			}

		},
		_getFilter: function (oEvent) {
			// create popover
			if (!this._oDialogFilter) {
				this._oDialogFilter = sap.ui.xmlfragment("ConsumoMatnr.zppconsumomatnr.view.fragments.TipoMaterial", this);
				this.getView().addDependent(this._oDialogFilter);
			}
			return this._oDialogFilter;
			// this._oDialogFilter.openBy(oEvent.getSource());
		},
		handleOpenDialogSearchContains: function () {
			this._getFilter()
				.setFilterSearchCallback(null)
				.setFilterSearchOperator(sap.m.StringFilterOperator.Contains)
				.open();
		},
		handleConfirm: function (oEvent) {
			var mParams = oEvent.getParameters();
			var that = this;
			var oSource = oEvent.getSource();
			var aItems = oSource.getSelectedFilterItems();

			// var oFilterMaterial = {};

			var aFilterMaterial = [];
			if (aItems.length > 0) {
				for (var i in aItems) {
					//	oFilterMaterial = aItems[i].getBindingContext("tipoMaterial").getObject();
					var oFilterMaterial;
					oFilterMaterial = new Filter({
						path: 'tipoMaterial',
						operator: FilterOperator.EQ,
						value1: aItems[i].getBindingContext("tipoMaterial").getObject().tipoMaterial
					});
					aFilterMaterial.push(oFilterMaterial);
					oFilterMaterial = "";
				}
				this.filterMat = aFilterMaterial;

				this._byId("tableMaterial").getBinding("items").filter([new Filter({
					filters: aFilterMaterial,
					or: true
				})]);
			} else {
				this.filterMat = "";
				this._byId("tableMaterial").getBinding("items").filter([0]);
			}
			this.byId("vsdFilterBar").setVisible(aItems.length > 0);
			this.byId("vsdFilterLabel").setText(mParams.filterString);
		},
		onExit: function () {
			var oDialogKey,
				oDialogValue;

			for (oDialogKey in this._mViewSettingsDialogs) {
				oDialogValue = this._mViewSettingsDialogs[oDialogKey];

				if (oDialogValue) {
					oDialogValue.destroy();
				}
			}
		},
		onInputChange: function (oEvent) {
			var that = this;
			var oSource = oEvent.getSource();
			var value = oSource.getValue();

			value = this.formatter.formatValue(value.replace(/[^0-9.]/g, ""));
			oSource.setValue(value);
			var id = oEvent.getSource().getId().split("-")[2] === undefined ? oEvent.getSource().getId() : oEvent.getSource().getId().split(
				"-")[2];

		},
		onItemPressMaterial: function (idAlmacen, flagAlmacen) {
			var that = this;
			// var oSource = oEvent.getSource();
			// var oMaterialConsum = oSource._oSelectedItem.getBindingContext("material").getObject();
			var oMaterialConsum = that._byId("tableMaterial").getSelectedItem().getBindingContext("material").getObject();
			that.materialSeleccionado = that._byId("tableMaterial").getSelectedItem();
			var tableOrden = that._byId("tableOrden");
			var oOrden = tableOrden.getSelectedItem().getBindingContext().getObject();
			var almacenConstante = that.getView().getModel("almacenConstante").getData();
			if (this.flagnavigate) {
				this.centro = this.centroAux;
			}
			var oDetaill = Object.assign({
				orden: oOrden
			}, {
				material: oMaterialConsum
			}, {
				centro: this.centro
			});
			if (oMaterialConsum.flagCW === "X") {
				var oModel = new sap.ui.model.json.JSONModel({
					status: true
				});
				that.getView().setModel(oModel, "cw");
			} else {
				var oModel = new sap.ui.model.json.JSONModel({
					status: false
				});
				that.getView().setModel(oModel, "cw");
			}
			var oModel = new JSONModel(oDetaill);
			that.getView().setModel(oModel, 'materialDetail');
			var centro;
			if (this.flagnavigate) {
				centro = this.centroAux;
				that.cantidadFal = oMaterialConsum.cantidadFal;
			} else {
				centro = that.centro.centro;
			}

			that.orden = oDetaill.orden;
			that.oDetail = oDetaill;
			var almacen = "";
			if (oMaterialConsum.hasOwnProperty("creado")) {
				almacen = almacenConstante.almacen;
			} else {
				almacen = oDetaill.material.almacen;
			}
			if (flagAlmacen) {
				almacen = idAlmacen;
			}
			var service = "/ConsumoMaterialsSet?$filter=centroMaterial eq \'" + centro + "\' and material eq \'" + oDetaill.material.material +
				"\' and almacenMaterial eq \'" + almacen + "\' and ordenProceso eq \'" + that.orden.numeroOrden + "\'";
			that.getODataDefault().read(service, {
				success: function (oData) {
					if (oData.results.length !== 0) {
						var materialDetail = that.getView().getModel("materialDetail").getData();
						var cantidadFaltante;
						if (that.flagnavigate) {
							cantidadFaltante = that.cantidadFal;
						} else {
							cantidadFaltante = materialDetail.material.cantidadFal;
						}
						var longitud = oData.results.length;

						for (var i in oData.results) {
							//oData.results[i].porcentaje = parseInt(oData.results[i].porcentaje);
							var cantidad = oData.results[i].cantidad;
							var status = oData.results[i].status;
							if (parseFloat(cantidadFaltante) >= 0 && (status === "None" || status === "Warning")) {
								if (parseFloat(cantidad) >= parseFloat(cantidadFaltante)) {
									oData.results[i].cantidadTomar = parseFloat(cantidadFaltante);
									cantidadFaltante = parseFloat(cantidadFaltante) - parseFloat(cantidadFaltante);
								} else if (parseFloat(cantidad) < parseFloat(cantidadFaltante)) {
									oData.results[i].cantidadTomar = parseFloat(cantidad).toFixed(3);
									cantidadFaltante = (parseFloat(cantidadFaltante) - parseFloat(cantidad)).toFixed(3);
								}
							} else {
								oData.results[i].cantidadTomar = "0.000";
							}
							//Columna Vacía
							oData.results[i].cantidadTomar = "";
							oData.results[i].cantidadCW = "";

							oData.results[i].cantidadTomar = oData.results[i].cantidadTomar.toString();
							oData.results[i].ordenProceso = that.orden.numeroOrden;
							oData.results[i].unidad = that.oDetail.material.unidad;
							oData.results[i].unidadTratar = that.oDetail.material.unidad;
						}

						var oModel = new sap.ui.model.json.JSONModel(oData.results);
						oModel.setSizeLimit(oData.results.length);
						that.getView().setModel(oModel, "materialConsumir");
						that.getView().getModel("materialConsumir").updateBindings(true);

						var tableroConsumir = that.getView().getModel("materialConsumir").getData();

						//Columna Vacía
						/*						for (var i in tableroConsumir) {
													if (oMaterialConsum.flagCW === "X" && parseInt(tableroConsumir[i].cantidadTomar) > 0) {
														var un = tableroConsumir[i].unidad.replace("/", "_");
														var unCW = tableroConsumir[i].unidadCW.replace("/", "_");
														var parameter = "(material=\'" + tableroConsumir[i].material +
															"\',cantidad=\'" + tableroConsumir[i].cantidadTomar + "\',unidadBase=\'" + un + "\',unidadCW=\'" + unCW + "\')";
														var posicion = i;
														that.convertSync(that, tableroConsumir, parameter, posicion);

													} else if (oMaterialConsum.flagCW === "X" && parseInt(tableroConsumir[i].cantidadTomar) == 0) {
														tableroConsumir[i].cantidadCW = tableroConsumir[i].cantidadTomar;
													}
												}*/

					} else {
						var oModel = new sap.ui.model.json.JSONModel(null);
						// oModel.setSizeLimit(oData.results.length);
						that.getView().setModel(oModel, "materialConsumir");

						var oModelT = new JSONModel(null);
						that.getView().setModel(oModelT, "total");
						that.getView().getModel("total").updateBindings(true);
					}
				},
				error: function (oError) {
					jQuery.sap.log.error(oError);
				}
			});

			var aFilters = [];
			aFilters.push(new Filter("IDCentro", FilterOperator.EQ, centro));
			aFilters.push(new Filter("IDMaterial", FilterOperator.EQ, oDetaill.material.material));
			that.getODataDefault().read("/AlmacenMaterialSet", {
				filters: aFilters,
				success: function (oData) {
					var oModelAlm = new sap.ui.model.json.JSONModel(oData.results);
					that.getView().setModel(oModelAlm, "almacenes");
					//that.createDialogAlmacen(that);
				},
				error: function (oError) {
					jQuery.sap.log.error(oError);
				}
			});
		},
		onChangeWarehouse: function (oEvent) {
			var that = this;
			that.createDialogAlmacen(that);
		},
		createDialogAlmacen: function (that, id) {
			if (!that._getDialogAlm) {
				that._getDialogAlm = sap.ui.xmlfragment("dialogAlm", "ConsumoMatnr.zppconsumomatnr.view.fragments.Almacen", that);
				that.getView().addDependent(that._getDialogAlm);
			}
			that._getDialogAlm.setModel(that.getView().getModel("almacenes"));
			//sap.ui.core.Fragment.byId("dialogAlm", "listAlmacenes").setModel(that.getView().getModel("almacenes"));
			that._getDialogAlm.open();
		},
		onHandleSelectAlmacen: function (oEvent) {
			var oSource = oEvent.getSource();
			var aPath = oSource.getSelectedContextPaths()[0]; // sap.ui.core.Fragment.byId("dialog", "listPrincipal")
			var sPath = aPath.split("/")[1];

			var aAlmacenes = this.getView().getModel("almacenes").getData();
			var oAlmacen = aAlmacenes[sPath];

			this._getDialogAlm.close();

			var sAlmacen = oAlmacen.Almacen;
			var sFlag = "X";
			this.onItemPressMaterial(sAlmacen, sFlag);
		},
		convertSync: function (that, tableroConsumir, parameter, posicion) {
			that.getODataDefault().read("/ConvertSet" + parameter, {
				success: function (oData) {
					tableroConsumir[posicion].cantidadCW = oData.value;
					that.getView().getModel("materialConsumir").updateBindings(true);
				},
				error: function (oError) {
					jQuery.sap.log.error(oError);
				}
			});
		},
		onCheckBoxSelected: function (oEvent) {
			var that = this;
			var oSource = oEvent.getSource();
			//var oParemeters = oEvent.getParameters("listItems");
			var aItems = oSource.getSelectedItems();
			// var oFilterMaterial = {};

			var aFilterMaterial = [];
			for (var i in aItems) {
				//	oFilterMaterial = aItems[i].getBindingContext("tipoMaterial").getObject();
				var oFilterMaterial;
				oFilterMaterial = new Filter({
					path: 'tipoMaterial',
					operator: FilterOperator.EQ,
					value1: aItems[i].getBindingContext("tipoMaterial").getObject().tipoMaterial
				});
				aFilterMaterial.push(oFilterMaterial);
				oFilterMaterial = "";
			}
			this.filterMat = aFilterMaterial;

			this._byId("tableMaterial").getBinding("items").filter([new Filter({
				filters: aFilterMaterial,
				or: true
			})]);

		},

		onChangeInputCW: function (oEvent) {

			var that = this;
			var oSource = oEvent.getSource();
			var sPath = oSource.getBindingContext("materialConsumir").getPath();
			var oObject = oSource.getBindingContext("materialConsumir").getObject();
            
            let previousCantidadCW = oObject.cantidadCW;
            if(previousCantidadCW === "0.000"){
            	let sValid = oEvent.getParameters().value.substring(oEvent.getParameters().value.length - 5);
            	if(sValid === "0.000"){
            	    oSource.setValue(oEvent.getParameters().value.substring(0, oEvent.getParameters().value.length - 5));	
            	}
            }
            oSource.setValue(oSource.getValue().replace(/,/gi, ''));
			
			if (oSource.getValue() === "") {
				//	this.getView().getModel("materialConsumir").setProperty(sPath + "/cantidadTomar", "");
				that.getView().getModel("materialConsumir").setProperty(sPath + "/cantidadCW", "");
				this.getView().getModel("materialConsumir").updateBindings(true);
				return;
			}

			that.loadValorUdmTipoCatchWeigth(oObject).then((oResult) => {

				let cantidadCW = parseFloat(oResult.ValorUdm2);
				oObject.oDataCW = oResult;

			

				var cantWGIng = parseFloat(oSource.getValue());
				var value = this.formatter.formatValue(oSource.getValue());

				var cantWG = parseFloat(cantidadCW);

				if (cantWGIng <= cantWG) {
					return that.getView().getModel("materialConsumir").setProperty(sPath + "/cantidadCW", value);
				} else {

					oSource.setValue("0.000");
					that.getView().getModel("materialConsumir").setProperty(sPath + "/cantidadCW", "0.000");
					this.getView().getModel("materialConsumir").updateBindings(true);
					return MessageToast.show("Stock insuficiente en Kg");
				}

			});

		},
		onChangeInput: function (oEvent) {
			var id = oEvent.getSource().getId().split("-")[2] === undefined ? oEvent.getSource().getId() : oEvent.getSource().getId().split(
				"-")[2];

			var that = this;
			var oSource = oEvent.getSource();
			var sPath = oSource.getBindingContext("materialConsumir").getPath();
			var oObject = oSource.getBindingContext("materialConsumir").getObject();
			/*	if (id != "inputCantidadTomar") {

					if (oSource.getValue() === "") {
						//	this.getView().getModel("materialConsumir").setProperty(sPath + "/cantidadTomar", "");
						that.getView().getModel("materialConsumir").setProperty(sPath + "/cantidadCW", "");
						this.getView().getModel("materialConsumir").updateBindings(true);
						return;
					}

					that.loadValorUdmTipoCatchWeigth(oObject).then((oResult) => {

						let cantidadCW = parseFloat(oResult.ValorUdm2);
						oObject.oDataCW = oResult;

						that.getView().getModel("materialConsumir").updateBindings(true);

						var cantWGIng = parseFloat(oSource.getValue());
						var value = this.formatter.formatValue(oSource.getValue());

						var cantWG = parseFloat(cantidadCW);

						if (cantWGIng <= cantWG) {
							return that.getView().getModel("materialConsumir").setProperty(sPath + "/cantidadCW", value);
						} else {

							oSource.setValue("0.000");
							that.getView().getModel("materialConsumir").setProperty(sPath + "/cantidadCW", "0.000");
							this.getView().getModel("materialConsumir").updateBindings(true);
							return MessageToast.show("Stock insuficiente en Kg");
						}

					});

				}*/

			var sum = 0.000;
			var sum2 = 0.000;
			var value = this.formatter.formatValue(oSource.getValue());

			if (value === undefined) {
				this.getView().getModel("materialConsumir").setProperty(sPath + "/cantidadTomar", "");
				that.getView().getModel("materialConsumir").setProperty(sPath + "/cantidadCW", "");
				this.getView().getModel("materialConsumir").updateBindings(true);
				return;
			}

			if (parseFloat(oObject.cantidad) < parseFloat(value)) {
				oSource.setValue("0");
				return MessageToast.show("No se puede ingresar un valor mayor a la cantidad.");
			}
			this.getView().getModel("materialConsumir").setProperty(sPath + "/cantidadTomar", value);
			var aData = this.getView().getModel("materialConsumir").getData();
			for (var i in aData) {
				sum = parseFloat((aData[i].cantidadTomar || 0)) + sum;
				sum2 = parseFloat((aData[i].cantidadCW || 0)) + sum2;
			}

			var oTotal = {
				cantTotal: sum.toFixed(3),
				unidad: aData[0].unidadTratar,
				cantTotalCW: sum2.toFixed(3),
				unidadCW: aData[0].unidadCW
			};
			var oModel = new JSONModel(oTotal);
			this.getView().setModel(oModel, "total");
			this.getView().getModel("total").updateBindings(true);
			this.getView().getModel("materialConsumir").updateBindings(true);
			var flag = this.getView().getModel("materialDetail").getData().material.flagCW;
			if (id === "inputCantidadTomar" && flag === "X") {
				that.convert(that, oSource, "materialConsumir");
			}
		},
		convert: function (that, oSource, model) {
			//var that = that;
			var property = oSource.getBindingContext(model).getProperty();
			that.propertyModel = property;
			var MaterialDetail = that.getView().getModel('materialDetail').getData();
			var oConvert = {
				material: MaterialDetail.material,
				cantidad: oSource.getValue(),
				unidadBase: property.unidadTratar,
				unidadCW: property.unidadCW
			};
			var sum = 0.000;
			var sum2 = 0.000;
			var unCW = property.unidadCW.replace("/", "_");
			var aData = that.getView().getModel("materialConsumir").getData();
			var un = property.unidad.replace("/", "_");
			var parameter = "(material=\'" + MaterialDetail.material.material +
				"\',cantidad=\'" + oSource.getValue() + "\',unidadBase=\'" + un + "\',unidadCW=\'" + unCW + "\')";
			that.getODataDefault().read("/ConvertSet" + parameter, {
				success: function (oData) {

					if (that.propertyModel.oDataCW === undefined) {
						that.loadValorUdmTipoCatchWeigth(that.propertyModel).then((oResult) => {
							let cantidadConvert = parseFloat(oData.value);
							let cantidadCW = parseFloat(oResult.ValorUdm2);
							that.propertyModel.oDataCW = oResult;
							if (cantidadConvert > cantidadCW) {
								that.propertyModel.cantidadCW = oResult.ValorUdm2;
							} else {
								that.propertyModel.cantidadCW = oData.value;
							}
							that.getView().getModel(model).updateBindings(true);
						});
					} else {
						let cantidadConvert = parseFloat(oData.value);
						let cantidadCW = parseFloat(that.propertyModel.oDataCW.ValorUdm2);
						if (cantidadConvert > cantidadCW) {
							that.propertyModel.cantidadCW = that.propertyModel.oDataCW.ValorUdm2;
						} else {
							that.propertyModel.cantidadCW = oData.value;
						}
						that.getView().getModel(model).updateBindings(true);
					}

					for (var i in aData) {
						sum = parseFloat((aData[i].cantidadTomar || 0)) + sum;
						sum2 = parseFloat((aData[i].cantidadCW || 0)) + sum2;
					}
					var oTotal = {
						cantTotal: sum.toFixed(3),
						unidad: aData[0].unidadTratar,
						cantTotalCW: sum2.toFixed(3),
						unidadCW: aData[0].unidadCW
					};

					var oModel = new JSONModel(oTotal);
					that.getView().setModel(oModel, "total");
					that.getView().getModel("total").updateBindings(
						true);
				},
				error: function (oError) {
					jQuery.sap.log.error(oError);
				}

			});
		},
		onLiveChangeInput: function (oEvent) {
			var sNumber = "";
			var that = this;
			var oSource = oEvent.getSource();

			var value = oEvent.getSource().getValue();
			var bNotnumber = isNaN(value);
			sNumber = value;
			var ultimaLetra = isNaN(value.charAt(value.length - 1));
			if (bNotnumber === false && ultimaLetra === false) {
				oEvent.getSource().setValue(sNumber);
			} else {
				oEvent.getSource().setValue(sNumber.substr(0, value.length - 1));
			}
		},
		onItemPressOrdenContabilizar: function () {
			var that = this;
			var oOrden = that._byId("tableOrden").getSelectedItem().getBindingContext().getObject();
			var aStatusOrden = oOrden.status.split(" ");
			var bCompact = !!this.getView().$().closest(".sapUiSizeCozy").length;

			// }
			var numeroOrden = oOrden.numeroOrden;
			this.getODataDefault().read("/MaterialsSet?$filter=numeroOrden eq \'" + numeroOrden + "\'", {
				success: function (oData) {
					var materialSelected = that.materialSeleccionado.getBindingContext("material").getObject();
					var item = oData.results.find(function (oItem) {
						return oItem.material === materialSelected.material;
					});
					if (item) {
						var materialDetail = that.getView().getModel("materialDetail").getData();
						materialDetail.material.cantidad = item.cantidad;
						materialDetail.material.fecUltRegi = item.fecUltRegi;
						materialDetail.material.horaEntr = item.horaEntr;
						materialDetail.material.nombreUser = item.nombreUser;
						materialDetail.material.almacen = item.almacen;
						materialDetail.material.flagCW = item.flagCW;
						materialDetail.material.cantidadFal = item.cantidadFal;
						materialDetail.material.cantidadCont = item.cantidadCont;
						materialDetail.material.porcentaje = parseInt(item.porcentaje);
						materialSelected.porcentaje = parseInt(item.porcentaje);
						that.getView().getModel("materialDetail").updateBindings(true);
						that.getView().getModel("material").refresh();
						that.onItemPressMaterial();
					} else {
						that.onAddMateriales(oOrden.numeroOrden, "1", that, materialSelected.material);
					}
				},
				error: function (oError) {
					jQuery.sap.log.error(oError);
				}
			});
		},
		onPressContabilizar: function (oEvent) {
			var that = this;
			var oData = that.getView().getModel("materialConsumir").getData();
			var oData = JSON.parse(JSON.stringify(oData));
			// var total = that.getView().getModel("materialConsumir").getData();

			// for (var i in oData) {
			// 	oData[i].unidad = oData[i].unidadTratar;
			// 	delete oData[i].__metadata;
			// 	delete oData[i].fechaCad;
			// 	delete oData[i].unidadTratar;
			// 	delete oData[i].status;
			// }

			for (var i = oData.length - 1; i >= 0; i--) {
				if ((!isNaN(parseFloat(oData[i].cantidadTomar)) && parseFloat(oData[i].cantidadTomar) === 0) || oData[i].cantidadTomar === "") {
					var oThisObj = oData[i];
					var index = $.map(oData, function (obj, indice) {
						if (obj === oThisObj) {
							return indice;
						}
					});

					oData[index].unidad = oData[index].unidadTratar;
					delete oData[index].__metadata;
					delete oData[index].fechaCad;
					delete oData[index].unidadTratar;
					delete oData[index].status;
					oData.splice(index, 1);
				}
			}
			var aData = [];
			var flag = this.getView().getModel("materialDetail").getData().material.flagCW;
			for (var i in oData) {
				oData[i].unidad = oData[i].unidadTratar;
				delete oData[i].__metadata;
				delete oData[i].fechaCad;
				delete oData[i].unidadTratar;
				// if(! (parseFloat(oData[i].cantidadTomar) > 0 &&  parseFloat(oData[i].cantidadCW) > 0)){
				// 	return MessageToast.show("Las cantidades a contabilizar deben \n ser MAYOR A CERO.");
				// }

				if (oData[i].status === "Error") {
					return MessageToast.show("No se pueden contabilizar lotes de material \n vencidos.");
				}
				delete oData[i].status;
				if (oData[i].hasOwnProperty("cantidadTomar")) {
					oData[i].cantidadTomar = oData[i].cantidadTomar.toString().replace(",", "");
					if (oData[i].hasOwnProperty("cantidadCW")) {

						if (flag === "X") {
							if (oData[i].cantidadCW === "0.000" || oData[i].cantidadCW === "") {
								return MessageToast.show("Ingresar stock a contabilizar");
							}
							oData[i].cantidadCW = oData[i].cantidadCW.toString().replace(",", "");
						}

					}
					if (oData[i].hasOwnProperty("cantidad")) {
						oData[i].cantidad = oData[i].cantidad.toString().replace(",", "");
					}

					aData.push(oData[i]);
				}
			}

			var MaterialDetail = this.getView().getModel('materialDetail').getData();

			var oDataHead = {
				orden: MaterialDetail.orden.numeroOrden,
				material: MaterialDetail.material.material,
				flagCW: MaterialDetail.material.flagCW,
				ConsumoMaterialsSet: aData,
				MensajesSet: [{
					Type: "",
					Id: "",
					Number: "",
					Message: "",
					LogNo: "",
					LogMsgNo: "",
					MessageV1: "",
					MessageV2: "",
					MessageV3: "",
					MessageV4: "",
					Parameter: "",
					Row: 0,
					Field: "",
					System: ""
				}]
			};

			if (oData.length === 0) {
				return MessageToast.show("Verifique los datos.");
			}
			var bCompact = !!this.getView().$().closest(".sapUiSizeCozy").length;
			MessageBox.confirm(
				"Desea contabilizar?", {
					actions: ["Si", "No"],
					styleClass: bCompact ? "sapUiSizeCozy" : "",
					onClose: function (sAction) {
						if (sAction === "Si") {
							that.getODataDefault().create("/ConsumoMaterialsHeadSet", oDataHead, {
								success: function (oData) {
									if (oData.material.length === 0) {
										//var mensaje = "Se contabilizó exitosamente:  " + oData.orden;
										var mensaje = "Se ha realizado el consumo. Revisar log.";
										var bCompact = !!that.getView().$().closest(".sapUiSizeCozy").length;
										MessageBox.success(
											mensaje, {
												styleClass: bCompact ? "sapUiSizeCozy" : ""
											}
										);
										that.onItemPressOrdenContabilizar();
									} else {
										//var mensaje = oData.orden;
										var mensaje = "No se ha realizado el consumo. Revisar log.";
										var bCompact = !!that.getView().$().closest(".sapUiSizeCozy").length;
										MessageBox.warning(
											mensaje, {
												styleClass: bCompact ? "sapUiSizeCozy" : ""
											}
										);
									}

									var aMensajes = [];
									if (!oData.MensajesSet.results[0].Type) {
										delete oData.MensajesSet.results[0];
									}
									for (var i in oData.MensajesSet.results) {
										var oMensajes = {};
										if (oData.MensajesSet.results[i].Type === 'E') {
											oMensajes.Message = oData.MensajesSet.results[i].Message;
											oMensajes.Type = "Error";
										}
										if (oData.MensajesSet.results[i].Type === 'S') {
											oMensajes.Message = oData.MensajesSet.results[i].Message;
											oMensajes.Type = "Success";
										}
										if (oData.MensajesSet.results[i].Type === 'W') {
											oMensajes.Message = oData.MensajesSet.results[i].Message;
											oMensajes.Type = "Warning";
										}
										if (oData.MensajesSet.results[i].Type === 'I') {
											oMensajes.Message = oData.MensajesSet.results[i].Message;
											oMensajes.Type = "Information";
										}
										aMensajes.push(oMensajes);
									}

									var oModelMsg = new JSONModel(aMensajes);
									that.getView().setModel(oModelMsg, "message");
									that.getView().getModel("message").updateBindings(true);

								},
								error: function (oError) {
									jQuery.sap.log.error(oError);
									// MessageToast.show("Error.");
								}

							});
						}

					}
				}
			);

		},
		onPressCancelar: function (oEvent) {
			if (sap.ushell.Container !== undefined) {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "#"
					}
				});
			}

		},
		handleOpenDialogAddMaterial: function (oEvent) {
			var that = this;
			if (!that._getDialogAdd) {
				that._getDialogAdd = sap.ui.xmlfragment("dialogNav", "ConsumoMatnr.zppconsumomatnr.view.fragments.Material", that);
				that.getView().addDependent(that._getDialogAdd);
			}
			that._getDialogAdd.setModel(that.getView().getModel("centroRespon"));
			var sMaterial = sap.ui.core.Fragment.byId("dialogNav", "idMaterialMath");
			var sCantidad = sap.ui.core.Fragment.byId("dialogNav", "idCantidadM");
			var sDescripcion = sap.ui.core.Fragment.byId("dialogNav", "idDescripcion");
			sMaterial.setValue("");
			sDescripcion.setValue("");
			sCantidad.setDescription("");
			sCantidad.setValue("");
			that._getDialogAdd.open();
		},
		onSaveDialogMaterial: function (oEvent) {
			var that = this;

			if (that.flagnavigate) {
				var sMaterial = that.material;
				var sCantidad = that.cantidadFal;
			} else {
				var oSource = oEvent.getSource();

				var sMaterial = sap.ui.core.Fragment.byId("dialogNav", "idMaterialMath");
				var sCantidad = sap.ui.core.Fragment.byId("dialogNav", "idCantidadM");
				this.materialSelected.cantidad = sCantidad.getValue();
				var sDescripcion = sap.ui.core.Fragment.byId("dialogNav", "idDescripcion");
			}

			var sPorcentaje = 0;
			if (this.materialSelected.cantidadCont) {
				sPorcentaje = (+this.materialSelected.cantidadCont / +this.materialSelected.cantidad) * 100;
				sPorcentaje = parseInt(sPorcentaje);
			}
			var aMaterialAdd = {
				material: this.materialSelected.material,
				descripcion: this.materialSelected.descripcion,
				unidad: this.materialSelected.unidad,
				numeroOrden: this.numeroOrdenTemporal,
				tipoMaterial: this.materialSelected.tipoMaterial,
				porcentaje: sPorcentaje,
				cantidad: this.materialSelected.cantidad,
				cantidadDet: this.materialSelected.cantidad,
				cantidadCont: this.materialSelected.cantidadCont,
				cantidadFal: this.materialSelected.cantidadFal,
				almacen: this.getView().getModel("almacenConstante").getData().almacen,
				fecUltRegi: this.materialSelected.fecUltRegi,
				horaEntr: this.materialSelected.horaEntr,
				nombreUser: this.materialSelected.nombreUser,
				flagCW: this.materialSelected.flagCW,
				creado: "X"
			};
			if (that.flagnavigate) {
				//var aMaterial = [aMaterialAdd];
				//var oModel = new sap.ui.model.json.JSONModel(aMaterial);
				aMaterialAdd.cantidadDet = aMaterialAdd.cantidad;
				if (that.getView().getModel("material") == undefined) {
					var aMaterial = [aMaterialAdd];
					var oModel = new sap.ui.model.json.JSONModel(aMaterial);
					var flagFirst = "X";
				} else {
					var aMaterialDetail = that.getView().getModel("material").getData();
					var aMateriales = [];
					var aMaterialDetailNew = JSON.parse(JSON.stringify(aMaterialDetail));
					var aMateriales2 = aMateriales.concat(aMaterialDetailNew, aMaterialAdd);
					var oModel = new sap.ui.model.json.JSONModel(aMateriales2);
				}
				this.getView().setModel(oModel, "material");
				this.getView().getModel("material").updateBindings(true);
				if (flagFirst) {
					that.onPressFirstMaterial(that);
				}
			} else {

				var aMaterialDetail = this.getView().getModel("material").getData();
				sMaterial.setValue("");
				sDescripcion.setValue("");
				sCantidad.setDescription("");
				sCantidad.setValue("");
				//aMateriales.concat(aMaterialAdd,JSON.parse(JSON.stringify(aMaterialDetail)));
				var aMateriales = [];
				var aMaterialDetailNew = JSON.parse(JSON.stringify(aMaterialDetail));
				var aMateriales2 = aMateriales.concat(aMaterialAdd, aMaterialDetailNew);
				// aMateriales.push(aMaterialAdd);
				// aMateriales.push(aMaterialDetail);

				var oModel = new sap.ui.model.json.JSONModel(aMateriales2);

				this.getView().setModel(oModel, "material");
				this.getView().getModel("material").updateBindings(true);
				that.onPressFirstMaterial(that);
			}

			if (!that.flagnavigate) {
				var oDialog = oSource.getParent();
				oDialog.close();
			}

		},
		onCloseDialogMaterial: function () {
			this._getDialogAdd.close();
		},
		onHandleValueMaterial: function (oEvent) {
			var s = oEvent.getSource();
			/*			var sZona;
						if (this.byId("tblAnalisisSG").getVisible() == true) {
							sZona = "zonaCalculoSG";
						} else {
							sZona = "zonaCalculoSNG";
						}
						this.seleccionado = s.getParent().getBindingContext(sZona).getProperty();*/
			// create value help dialog
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment("ConsumoMatnr.zppconsumomatnr.view.fragments.MaterialMathcode", this);
				this.getView().addDependent(this._valueHelpDialog);
			}

			// open value help dialog
			this._valueHelpDialog.open();
		},
		onHandleValueHelpSearch: function (oEvent) {

			// add filter for search
			var aFilters = [];
			var sQuery = oEvent.getSource()._sSearchFieldValue;
			if (sQuery && sQuery.length > 0) {

				aFilters.push(new Filter("material", "Contains", sQuery));
				aFilters.push(new Filter("descripcion", "Contains", sQuery));
			}
			// update list binding

			var binding = oEvent.getSource().getBinding("items");

			if (aFilters.length === 0) {
				binding.filter([0]);
			} else {
				binding.filter(new Filter({
					filters: aFilters,
					and: false
				}));
			}
		},
		onHandleValueHelpClose: function (evt) {

			var aFilters = new sap.ui.model.Filter({ // filter container
				filters: [
					new sap.ui.model.Filter("codigoMaterial", sap.ui.model.FilterOperator.Contains, ""), // filter for value 1
					new sap.ui.model.Filter("nombreMaterial", sap.ui.model.FilterOperator.Contains, "") // filter for value 2
				]
			});
			evt.getSource().getBinding("items").filter(aFilters, sap.ui.model.FilterType.Application);

			var oSelectedItem = evt.getParameter("selectedItem");

			if (oSelectedItem) {
				var dataMaterial = this.getView().getModel("materialesadd").getData();
				var sMaterial = sap.ui.core.Fragment.byId("dialogNav", "idMaterialMath");
				sMaterial.setValue(oSelectedItem.getTitle());
				this.materialSelected = dataMaterial.find(function (oItem) {
					return oItem.material === oSelectedItem.getTitle();
				});
				this.materialSelected.cantidad = sap.ui.core.Fragment.byId("dialogNav", "idCantidadM").getValue();
				var sCantidad = sap.ui.core.Fragment.byId("dialogNav", "idCantidadM");
				sCantidad.setDescription(this.materialSelected.unidad);
				var sDescripcion = sap.ui.core.Fragment.byId("dialogNav", "idDescripcion");
				sDescripcion.setValue(this.materialSelected.descripcion);
			}
			//productInput evt.getSource().getBinding("items").filter([]);

			//this.seleccionado.codigo = oSelectedItem.getTitle();
			//this.seleccionado.descripcion = oSelectedItem.getDescription();
		},
		onHandleChangeAlmacen: function (oEvent) {
			var oSource = oEvent.getSource();
			var sPath = oSource.getBinding("value").getContext().getPath().split("/")[1];
			var oLote = oSource.getBinding("value").getContext().getModel().getData()[sPath];

			var sValue = oEvent.getParameter("newValue").toUpperCase();

			oLote.almacen = sValue;
			oSource.getBinding("value").getContext().getModel().updateBindings(true);
		},
		onMessagePopoverPress: function (oEvent) {
			if (!this._oMessagePopover) {
				// create popover lazily (singleton)
				this._oMessagePopover = sap.ui.xmlfragment(this.getView().getId(),
					"ConsumoMatnr.zppconsumomatnr.view.fragments.MessagePopover", this);
				this.getView().addDependent(this._oMessagePopover);
			}
			this._oMessagePopover.openBy(oEvent.getSource());
		},

		loadValorUdmTipoCatchWeigth: function (objSel) {
			var aFilters = [];
			aFilters.push(new Filter("Material", FilterOperator.EQ, objSel.material));
			aFilters.push(new Filter("Centro", FilterOperator.EQ, objSel.centroMaterial));
			aFilters.push(new Filter("Almacen", FilterOperator.EQ, objSel.almacen));
			aFilters.push(new Filter("Lote", FilterOperator.EQ, objSel.lote));
			var that = this;
			sap.ui.core.BusyIndicator.show(0);
			/*this.getODataDefault().read("/OrdenProcesoSet?$filter=codigoRespon eq \'" + respCtrl + "\'", {
				success: function (oData) {*/
			return new Promise((resolve, reject) => {
				this.getODataDefault().read("/ValorUdmSet", {
					filters: aFilters,
					success: function (oData) {
						var dataVal = [];
						var data = oData.results[0];
						data.ValorUdm1.trim();
						data.ValorUdm2.trim();
						dataVal.push({
							"valor": data.ValorUdm1,
							"udm": data.Udm1
						});
						dataVal.push({
							"valor": data.ValorUdm2,
							"udm": data.Udm2
						});
						var oModel = new sap.ui.model.json.JSONModel(dataVal);
						that.getView().setModel(oModel, "valUdm");
						that.getView().getModel("valUdm").updateBindings(true);
						objSel.oDataCW = oData.results[0];
						resolve(oData.results[0]);
						sap.ui.core.BusyIndicator.hide();
					},
					error: function (oError) {
						jQuery.sap.log.error(oError);
						reject(oError);
						sap.ui.core.BusyIndicator.hide();
					}
				});
			});
		},
		open: function (evt) {
			var oView = this.getView();
			var that = this;
			//var oModel = new sap.ui.model.json.JSONModel(dataLotesDestino);
			/*that.getView().setModel(oModel, "lotesDestinos");
			that.getView().getModel("lotesDestinos").updateBindings(true);*/
			var oDialog = oView.byId("unidadMedida");
			var objSel = evt.getSource().getBindingContext("materialConsumir").getObject();
			var centro = objSel.centroMaterial;
			var almacen = objSel.almacen;
			var material = objSel.material;
			var lote = objSel.lote;
			that.loadValorUdmTipoCatchWeigth(objSel);

			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(oView.getId(), "ConsumoMatnr.zppconsumomatnr.view.fragments.UnidadMedida", this);
			}

			oView.addDependent(oDialog);
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
			oDialog.open();
		},
		onDialogClose: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			oDialog.close();
		},
	});
});