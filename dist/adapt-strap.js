/**
 * adapt-strap
 * @version v0.2.9 - 2014-09-09
 * @link https://github.com/Adaptv/adapt-strap
 * @author Kashyap Patel (kashyap@adap.tv)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function(window, document, undefined) {
'use strict';
// Source: module.js
angular.module('adaptv.adaptStrap', [
  'adaptv.adaptStrap.utils',
  'adaptv.adaptStrap.treebrowser',
  'adaptv.adaptStrap.tablelite',
  'adaptv.adaptStrap.tableajax',
  'adaptv.adaptStrap.loadingindicator',
  'adaptv.adaptStrap.infinitedropdown'
]).provider('$adConfig', function () {
  var iconClasses = this.iconClasses = {
      expand: 'glyphicon glyphicon-plus-sign',
      collapse: 'glyphicon glyphicon-minus-sign',
      loadingSpinner: 'glyphicon glyphicon-refresh ad-spin',
      firstPage: 'glyphicon glyphicon-fast-backward',
      previousPage: 'glyphicon glyphicon-backward',
      nextPage: 'glyphicon glyphicon-forward',
      lastPage: 'glyphicon glyphicon-fast-forward',
      sortAscending: 'glyphicon glyphicon-chevron-up',
      sortDescending: 'glyphicon glyphicon-chevron-down',
      sortable: 'glyphicon glyphicon-resize-vertical',
      selectedItem: 'glyphicon glyphicon-ok'
    }, paging = this.paging = {
      request: {
        start: 'skip',
        pageSize: 'limit',
        page: 'page',
        sortField: 'sort',
        sortDirection: 'sort_dir',
        sortAscValue: 'asc',
        sortDescValue: 'desc'
      },
      response: {
        itemsLocation: 'data',
        totalItems: 'pagination.totalCount'
      }
    };
  this.$get = function () {
    return {
      iconClasses: iconClasses,
      paging: paging
    };
  };
});

// Source: infinitedropdown.js
angular.module('adaptv.adaptStrap.infinitedropdown', [
  'adaptv.adaptStrap.utils',
  'adaptv.adaptStrap.loadingindicator'
]).directive('adInfiniteDropdown', [
  '$parse',
  '$compile',
  '$templateCache',
  '$adConfig',
  'adLoadPage',
  'adDebounce',
  'adStrapUtils',
  'adLoadLocalPage',
  function ($parse, $compile, $templateCache, $adConfig, adLoadPage, adDebounce, adStrapUtils, adLoadLocalPage) {
function _link(scope, element, attrs) {
      // We do the name spacing so the if there are multiple ad-table-ajax on the scope,
      // they don't fight with each other.
      scope[attrs.dropdownName] = {
        items: {
          list: [],
          paging: {
            currentPage: 1,
            totalPages: undefined,
            pageSize: Number(attrs.pageSize) || 10
          }
        },
        localConfig: {
          loadingData: false,
          showDisplayProperty: attrs.displayProperty ? true : false,
          showTemplate: attrs.template ? true : false,
          loadTemplate: attrs.templateUrl ? true : false,
          initialLabel: attrs.initialLabel || 'Select',
          singleSelectionMode: $parse(attrs.singleSelectionMode)() ? true : false,
          dynamicLabel: attrs.labelDisplayProperty ? true : false,
          dimensions: {
            'max-height': attrs.maxHeight || '200px',
            'max-width': attrs.maxWidth || 'auto'
          }
        },
        selectedItems: scope.$eval(attrs.selectedItems) || [],
        ajaxConfig: scope.$eval(attrs.ajaxConfig),
        applyFilter: adStrapUtils.applyFilter,
        readProperty: adStrapUtils.getObjectProperty,
        isSelected: adStrapUtils.itemExistsInList
      };
      // ---------- Local data ---------- //
      var listModels = scope[attrs.dropdownName], mainTemplate = $templateCache.get('infinitedropdown/infinitedropdown.tpl.html'), lastRequestToken;
      // ---------- ui handlers ---------- //
      listModels.addRemoveItem = function (event, item, items) {
        event.stopPropagation();
        if (listModels.localConfig.singleSelectionMode) {
          listModels.selectedItems[0] = item;
        } else {
          adStrapUtils.addRemoveItemFromList(item, items);
        }
        var callback = scope.$eval(attrs.onItemClick);
        if (callback) {
          callback(item);
        }
      };
      listModels.loadPage = adDebounce(function (page) {
        lastRequestToken = Math.random();
        listModels.localConfig.loadingData = true;
        var pageLoader = scope.$eval(attrs.pageLoader) || adLoadPage, params = {
            pageNumber: page,
            pageSize: listModels.items.paging.pageSize,
            sortKey: listModels.localConfig.predicate,
            sortDirection: listModels.localConfig.reverse,
            ajaxConfig: listModels.ajaxConfig,
            token: lastRequestToken
          }, successHandler = function (response) {
            if (response.token === lastRequestToken) {
              if (page === 1) {
                listModels.items.list = response.items;
              } else {
                listModels.items.list = listModels.items.list.concat(response.items);
              }
              listModels.items.paging.totalPages = response.totalPages;
              listModels.items.paging.currentPage = response.currentPage;
              listModels.localConfig.loadingData = false;
            }
          }, errorHandler = function () {
            listModels.localConfig.loadingData = false;
          };
        if (attrs.localDataSource) {
          params.localData = scope.$eval(attrs.localDataSource);
          successHandler(adLoadLocalPage(params));
        } else {
          pageLoader(params).then(successHandler, errorHandler);
        }
      }, 10);
      listModels.loadNextPage = function () {
        if (!listModels.localConfig.loadingData) {
          if (listModels.items.paging.currentPage + 1 <= listModels.items.paging.totalPages) {
            listModels.loadPage(listModels.items.paging.currentPage + 1);
          }
        }
      };
      // ---------- initialization and event listeners ---------- //
      //We do the compile after injecting the name spacing into the template.
      listModels.loadPage(1);
      // reset on parameter change
      if (attrs.ajaxConfig) {
        scope.$watch(attrs.ajaxConfig, function () {
          listModels.loadPage(1);
        }, true);
      }
      if (attrs.localDataSource) {
        scope.$watch(attrs.localDataSource, function () {
          listModels.loadPage(1);
        }, true);
      }
      mainTemplate = mainTemplate.replace(/%=dropdownName%/g, attrs.dropdownName).replace(/%=displayProperty%/g, attrs.displayProperty).replace(/%=templateUrl%/g, attrs.templateUrl).replace(/%=template%/g, attrs.template).replace(/%=labelDisplayProperty%/g, attrs.labelDisplayProperty).replace(/%=btnClasses%/g, attrs.btnClasses || 'btn btn-default').replace(/%=icon-selectedItem%/g, $adConfig.iconClasses.selectedItem);
      element.empty();
      element.append($compile(mainTemplate)(scope));
      var listContainer = angular.element(element).find('ul')[0];
      // infinite scroll handler
      var loadFunction = adDebounce(function () {
          // This is for infinite scrolling.
          // When the scroll gets closer to the bottom, load more items.
          if (listContainer.scrollTop + listContainer.offsetHeight >= listContainer.scrollHeight - 300) {
            listModels.loadNextPage();
          }
        }, 50);
      angular.element(listContainer).bind('mousewheel', function (event) {
        if (event.originalEvent && event.originalEvent.deltaY) {
          listContainer.scrollTop += event.originalEvent.deltaY;
          event.preventDefault();
          event.stopPropagation();
        }
        loadFunction();
      });
    }
    return {
      restrict: 'E',
      link: _link
    };
  }
]);

// Source: loadingindicator.js
angular.module('adaptv.adaptStrap.loadingindicator', []).directive('adLoadingIcon', [
  '$adConfig',
  '$compile',
  function ($adConfig, $compile) {
    return {
      restrict: 'E',
      compile: function compile() {
        return {
          pre: function preLink(scope, element, attrs) {
            var loadingIconClass = attrs.loadingIconClass || $adConfig.iconClasses.loadingSpinner, ngStyleTemplate = attrs.loadingIconSize ? 'ng-style="{\'font-size\': \'' + attrs.loadingIconSize + '\'}"' : '', template = '<i class="' + loadingIconClass + '" ' + ngStyleTemplate + '></i>';
            element.empty();
            element.append($compile(template)(scope));
          }
        };
      }
    };
  }
]).directive('adLoadingOverlay', [
  '$adConfig',
  function ($adConfig) {
    return {
      restrict: 'E',
      templateUrl: 'loadingindicator/loadingindicator.tpl.html',
      scope: {
        loading: '=',
        zIndex: '@',
        position: '@',
        containerClasses: '@',
        loadingIconClass: '@',
        loadingIconSize: '@'
      },
      compile: function compile() {
        return {
          pre: function preLink(scope) {
            scope.loadingIconClass = scope.loadingIconClass || $adConfig.iconClasses.loading;
            scope.loadingIconSize = scope.loadingIconSize || '3em';
          }
        };
      }
    };
  }
]);

// Source: tableajax.js
angular.module('adaptv.adaptStrap.tableajax', [
  'adaptv.adaptStrap.utils',
  'adaptv.adaptStrap.loadingindicator'
]).directive('adTableAjax', [
  '$parse',
  '$compile',
  '$templateCache',
  '$adConfig',
  'adLoadPage',
  'adDebounce',
  'adStrapUtils',
  function ($parse, $compile, $templateCache, $adConfig, adLoadPage, adDebounce, adStrapUtils) {
function _link(scope, element, attrs) {
      // We do the name spacing so the if there are multiple ad-table-ajax on the scope,
      // they don't fight with each other.
      scope[attrs.tableName] = {
        items: {
          list: undefined,
          paging: {
            currentPage: 1,
            totalPages: undefined,
            pageSize: undefined,
            pageSizes: $parse(attrs.pageSizes)() || [
              10,
              25,
              50
            ]
          }
        },
        localConfig: {
          pagingArray: [],
          loadingData: false
        },
        ajaxConfig: scope.$eval(attrs.ajaxConfig),
        applyFilter: adStrapUtils.applyFilter,
        readProperty: adStrapUtils.getObjectProperty
      };
      // ---------- Local data ---------- //
      var tableModels = scope[attrs.tableName], mainTemplate = $templateCache.get('tableajax/tableajax.tpl.html'), lastRequestToken;
      tableModels.items.paging.pageSize = tableModels.items.paging.pageSizes[0];
      // ---------- ui handlers ---------- //
      tableModels.loadPage = adDebounce(function (page) {
        lastRequestToken = Math.random();
        tableModels.localConfig.loadingData = true;
        var pageLoader = scope.$eval(attrs.pageLoader) || adLoadPage, params = {
            pageNumber: page,
            pageSize: tableModels.items.paging.pageSize,
            sortKey: tableModels.localConfig.predicate,
            sortDirection: tableModels.localConfig.reverse,
            ajaxConfig: tableModels.ajaxConfig,
            token: lastRequestToken
          }, successHandler = function (response) {
            if (response.token === lastRequestToken) {
              tableModels.items.list = response.items;
              tableModels.items.paging.totalPages = response.totalPages;
              tableModels.items.paging.currentPage = response.currentPage;
              tableModels.localConfig.pagingArray = response.pagingArray;
              tableModels.localConfig.loadingData = false;
            }
          }, errorHandler = function () {
            tableModels.localConfig.loadingData = false;
          };
        pageLoader(params).then(successHandler, errorHandler);
      });
      tableModels.loadNextPage = function () {
        if (!tableModels.localConfig.loadingData) {
          if (tableModels.items.paging.currentPage + 1 <= tableModels.items.paging.totalPages) {
            tableModels.loadPage(tableModels.items.paging.currentPage + 1);
          }
        }
      };
      tableModels.loadPreviousPage = function () {
        if (!tableModels.localConfig.loadingData) {
          if (tableModels.items.paging.currentPage - 1 > 0) {
            tableModels.loadPage(tableModels.items.paging.currentPage - 1);
          }
        }
      };
      tableModels.loadLastPage = function () {
        if (!tableModels.localConfig.loadingData) {
          if (tableModels.items.paging.currentPage !== tableModels.items.paging.totalPages) {
            tableModels.loadPage(tableModels.items.paging.totalPages);
          }
        }
      };
      tableModels.pageSizeChanged = function (size) {
        if (Number(size) !== tableModels.items.paging.pageSize) {
          tableModels.items.paging.pageSize = Number(size);
          tableModels.loadPage(1);
        }
      };
      tableModels.sortByColumn = function (column) {
        if (column.sortKey) {
          if (column.sortKey !== tableModels.localConfig.predicate) {
            tableModels.localConfig.predicate = column.sortKey;
            tableModels.localConfig.reverse = true;
          } else {
            if (tableModels.localConfig.reverse === true) {
              tableModels.localConfig.reverse = false;
            } else {
              tableModels.localConfig.reverse = undefined;
              tableModels.localConfig.predicate = undefined;
            }
          }
          tableModels.loadPage(tableModels.items.paging.currentPage);
        }
      };
      // ---------- initialization and event listeners ---------- //
      //We do the compile after injecting the name spacing into the template.
      tableModels.loadPage(1);
      // reset on parameter change
      scope.$watch(attrs.ajaxConfig, function () {
        tableModels.loadPage(1);
      }, true);
      attrs.tableClasses = attrs.tableClasses || 'table';
      attrs.paginationBtnGroupClasses = attrs.paginationBtnGroupClasses || 'btn-group btn-group-sm';
      mainTemplate = mainTemplate.replace(/%=tableName%/g, attrs.tableName).replace(/%=columnDefinition%/g, attrs.columnDefinition).replace(/%=tableClasses%/g, attrs.tableClasses).replace(/%=paginationBtnGroupClasses%/g, attrs.paginationBtnGroupClasses).replace(/%=icon-firstPage%/g, $adConfig.iconClasses.firstPage).replace(/%=icon-previousPage%/g, $adConfig.iconClasses.previousPage).replace(/%=icon-nextPage%/g, $adConfig.iconClasses.nextPage).replace(/%=icon-lastPage%/g, $adConfig.iconClasses.lastPage).replace(/%=icon-sortAscending%/g, $adConfig.iconClasses.sortAscending).replace(/%=icon-sortDescending%/g, $adConfig.iconClasses.sortDescending).replace(/%=icon-sortable%/g, $adConfig.iconClasses.sortable);
      ;
      element.empty();
      element.append($compile(mainTemplate)(scope));
    }
    return {
      restrict: 'E',
      link: _link
    };
  }
]);

// Source: tablelite.js
angular.module('adaptv.adaptStrap.tablelite', ['adaptv.adaptStrap.utils']).directive('adTableLite', [
  '$parse',
  '$http',
  '$compile',
  '$filter',
  '$templateCache',
  '$adConfig',
  'adStrapUtils',
  'adDebounce',
  'adLoadLocalPage',
  function ($parse, $http, $compile, $filter, $templateCache, $adConfig, adStrapUtils, adDebounce, adLoadLocalPage) {
function _link(scope, element, attrs) {
      // We do the name spacing so the if there are multiple ad-table-lite on the scope,
      // they don't fight with each other.
      scope[attrs.tableName] = {
        items: {
          list: undefined,
          allItems: undefined,
          paging: {
            currentPage: 1,
            totalPages: undefined,
            pageSize: undefined,
            pageSizes: $parse(attrs.pageSizes)() || [
              10,
              25,
              50
            ]
          }
        },
        localConfig: {
          pagingArray: [],
          selectable: attrs.selectedItems ? true : false,
          showPaging: $parse(attrs.disablePaging)() ? false : true
        },
        selectedItems: scope.$eval(attrs.selectedItems),
        applyFilter: adStrapUtils.applyFilter,
        isSelected: adStrapUtils.itemExistsInList,
        addRemoveItem: adStrapUtils.addRemoveItemFromList,
        addRemoveAll: adStrapUtils.addRemoveItemsFromList,
        allSelected: adStrapUtils.itemsExistInList,
        readProperty: adStrapUtils.getObjectProperty
      };
      // ---------- Local data ---------- //
      var tableModels = scope[attrs.tableName], mainTemplate = $templateCache.get('tablelite/tablelite.tpl.html');
      tableModels.items.paging.pageSize = tableModels.items.paging.pageSizes[0];
      // ---------- ui handlers ---------- //
      tableModels.loadPage = adDebounce(function (page) {
        var itemsObject = [], params;
        if (angular.isArray(scope.$eval(attrs.localDataSource))) {
          itemsObject = scope.$eval(attrs.localDataSource);
        } else {
          angular.forEach(scope.$eval(attrs.localDataSource), function (item) {
            itemsObject.push(item);
          });
        }
        params = {
          pageNumber: page,
          pageSize: tableModels.localConfig.showPaging ? tableModels.items.paging.pageSize : itemsObject.length,
          sortKey: tableModels.localConfig.predicate,
          sortDirection: tableModels.localConfig.reverse,
          localData: itemsObject
        };
        var response = adLoadLocalPage(params);
        tableModels.items.list = response.items;
        tableModels.items.allItems = response.allItems;
        tableModels.items.paging.currentPage = response.currentPage;
        tableModels.items.paging.totalPages = response.totalPages;
        tableModels.localConfig.pagingArray = response.pagingArray;
      }, 100);
      tableModels.loadNextPage = function () {
        if (tableModels.items.paging.currentPage + 1 <= tableModels.items.paging.totalPages) {
          tableModels.loadPage(tableModels.items.paging.currentPage + 1);
        }
      };
      tableModels.loadPreviousPage = function () {
        if (tableModels.items.paging.currentPage - 1 > 0) {
          tableModels.loadPage(tableModels.items.paging.currentPage - 1);
        }
      };
      tableModels.loadLastPage = function () {
        if (!tableModels.localConfig.disablePaging) {
          tableModels.loadPage(tableModels.items.paging.totalPages);
        }
      };
      tableModels.pageSizeChanged = function (size) {
        tableModels.items.paging.pageSize = size;
        tableModels.loadPage(1);
      };
      tableModels.sortByColumn = function (column) {
        if (column.sortKey) {
          if (column.sortKey !== tableModels.localConfig.predicate) {
            tableModels.localConfig.predicate = column.sortKey;
            tableModels.localConfig.reverse = true;
          } else {
            if (tableModels.localConfig.reverse === true) {
              tableModels.localConfig.reverse = false;
            } else {
              tableModels.localConfig.reverse = undefined;
              tableModels.localConfig.predicate = undefined;
            }
          }
          tableModels.loadPage(tableModels.items.paging.currentPage);
        }
      };
      // ---------- initialization and event listeners ---------- //
      //We do the compile after injecting the name spacing into the template.
      tableModels.loadPage(1);
      attrs.tableClasses = attrs.tableClasses || 'table';
      attrs.paginationBtnGroupClasses = attrs.paginationBtnGroupClasses || 'btn-group btn-group-sm';
      mainTemplate = mainTemplate.replace(/%=tableName%/g, attrs.tableName).replace(/%=columnDefinition%/g, attrs.columnDefinition).replace(/%=paginationBtnGroupClasses%/g, attrs.paginationBtnGroupClasses).replace(/%=tableClasses%/g, attrs.tableClasses).replace(/%=icon-firstPage%/g, $adConfig.iconClasses.firstPage).replace(/%=icon-previousPage%/g, $adConfig.iconClasses.previousPage).replace(/%=icon-nextPage%/g, $adConfig.iconClasses.nextPage).replace(/%=icon-lastPage%/g, $adConfig.iconClasses.lastPage).replace(/%=icon-sortAscending%/g, $adConfig.iconClasses.sortAscending).replace(/%=icon-sortDescending%/g, $adConfig.iconClasses.sortDescending).replace(/%=icon-sortable%/g, $adConfig.iconClasses.sortable);
      element.empty();
      element.append($compile(mainTemplate)(scope));
      scope.$watch(attrs.localDataSource, function () {
        tableModels.loadPage(1);
      }, true);
    }
    return {
      restrict: 'E',
      link: _link
    };
  }
]);

// Source: treebrowser.js
angular.module('adaptv.adaptStrap.treebrowser', []).directive('adTreeBrowser', [
  '$compile',
  '$http',
  '$adConfig',
  '$templateCache',
  function ($compile, $http, $adConfig, $templateCache) {
    function _link(scope, element, attrs) {
      // We do the name spacing so the if there are multiple ad-tree-browser on the scope,
      // they don't fight with each other.
      scope[attrs.treeName] = {
        toggle: function (event, item) {
          var toggleCallback;
          event.stopPropagation();
          toggleCallback = scope.$eval(attrs.toggleCallback);
          if (toggleCallback) {
            toggleCallback(item);
          } else {
            item._ad_expanded = !item._ad_expanded;
          }
        },
        hasChildren: function (item) {
          var hasChildren = scope.$eval(attrs.hasChildren), found = item[attrs.childNode] && item[attrs.childNode].length > 0;
          if (hasChildren) {
            found = hasChildren(item);
          }
          return found;
        },
        localConfig: { showHeader: attrs.nodeHeaderUrl ? true : false }
      };
      // ---------- Local data ---------- //
      var treeName = attrs.treeName || '', nodeTemplateUrl = attrs.nodeTemplateUrl || '', nodeHeaderUrl = attrs.nodeHeaderUrl || '', childrenPadding = attrs.childrenPadding || 15, template = '', populateMainTemplate = function (nodeTemplate, nodeHeaderTemplate) {
          var data = $templateCache.get('treebrowser/treebrowser.tpl.html');
          template = data.replace(/%=treeName%/g, treeName).replace(/%=treeRootName%/g, attrs.treeRoot).replace(/%=bordered%/g, attrs.bordered).replace(/%=icon-expand%/g, $adConfig.iconClasses.expand).replace(/%=icon-collapse%/g, $adConfig.iconClasses.collapse).replace(/%=icon-loadingSpinner%/g, $adConfig.iconClasses.loadingSpinner).replace(/%=childNodeName%/g, attrs.childNode).replace(/%=childrenPadding%/g, childrenPadding).replace(/%=rowNgClass%/g, attrs.rowNgClass || '').replace(/%=nodeTemplate%/g, nodeTemplate).replace(/%=nodeHeaderTemplate%/g, nodeHeaderTemplate || '');
          element.empty();
          element.append($compile(template)(scope));
        };
      // ---------- initialization ---------- //
      if (nodeTemplateUrl !== '') {
        // Getting the template from nodeTemplateUrl
        $http.get(nodeTemplateUrl, { cache: $templateCache }).success(function (nodeTemplate) {
          if (nodeHeaderUrl !== '') {
            $http.get(nodeHeaderUrl, { cache: $templateCache }).success(function (headerTemplate) {
              populateMainTemplate(nodeTemplate, headerTemplate);
            });
          } else {
            populateMainTemplate(nodeTemplate, '');
          }
        });
      } else {
        populateMainTemplate('<span>{{ item.name || "" }}</span>');
      }
    }
    return {
      restrict: 'E',
      link: _link
    };
  }
]);

// Source: utils.js
angular.module('adaptv.adaptStrap.utils', []).factory('adStrapUtils', [
  '$filter',
  function ($filter) {
    var evalObjectProperty = function (obj, property) {
        var arr = property.split('.');
        if (obj) {
          while (arr.length) {
            if (obj) {
              obj = obj[arr.shift()];
            }
          }
        }
        return obj;
      }, applyFilter = function (value, filter) {
        var parts, filterOptions;
        if (filter) {
          parts = filter.split(':');
          filterOptions = parts[1];
          if (filterOptions) {
            value = $filter(parts[0])(value, filterOptions);
          } else {
            value = $filter(parts[0])(value);
          }
        }
        return value;
      }, itemExistsInList = function (compareItem, list) {
        var exist = false;
        list.forEach(function (item) {
          if (angular.equals(compareItem, item)) {
            exist = true;
          }
        });
        return exist;
      }, itemsExistInList = function (items, list) {
        var exist = true, i;
        for (i = 0; i < items.length; i++) {
          if (itemExistsInList(items[i], list) === false) {
            exist = false;
            break;
          }
        }
        return exist;
      }, addItemToList = function (item, list) {
        list.push(item);
      }, removeItemFromList = function (item, list) {
        var i;
        for (i = list.length - 1; i > -1; i--) {
          if (angular.equals(item, list[i])) {
            list.splice(i, 1);
          }
        }
      }, addRemoveItemFromList = function (item, list) {
        var i, found = false;
        for (i = list.length - 1; i > -1; i--) {
          if (angular.equals(item, list[i])) {
            list.splice(i, 1);
            found = true;
          }
        }
        if (found === false) {
          list.push(item);
        }
      }, addItemsToList = function (items, list) {
        items.forEach(function (item) {
          if (!itemExistsInList(item, list)) {
            addRemoveItemFromList(item, list);
          }
        });
      }, addRemoveItemsFromList = function (items, list) {
        if (itemsExistInList(items, list)) {
          list.length = 0;
        } else {
          addItemsToList(items, list);
        }
      }, getObjectProperty = function (item, property) {
        var arr = property.split('.');
        while (arr.length) {
          item = item[arr.shift()];
        }
        return item;
      };
    return {
      evalObjectProperty: evalObjectProperty,
      applyFilter: applyFilter,
      itemExistsInList: itemExistsInList,
      itemsExistInList: itemsExistInList,
      addItemToList: addItemToList,
      removeItemFromList: removeItemFromList,
      addRemoveItemFromList: addRemoveItemFromList,
      addItemsToList: addItemsToList,
      addRemoveItemsFromList: addRemoveItemsFromList,
      getObjectProperty: getObjectProperty
    };
  }
]).factory('adDebounce', [
  '$timeout',
  '$q',
  function ($timeout, $q) {
var deb = function (func, delay, immediate, ctx) {
      var timer = null, deferred = $q.defer(), wait = delay || 300;
      return function () {
        var context = ctx || this, args = arguments, callNow = immediate && !timer, later = function () {
            if (!immediate) {
              deferred.resolve(func.apply(context, args));
              deferred = $q.defer();
            }
          };
        if (timer) {
          $timeout.cancel(timer);
        }
        timer = $timeout(later, wait);
        if (callNow) {
          deferred.resolve(func.apply(context, args));
          deferred = $q.defer();
        }
        return deferred.promise;
      };
    };
    return deb;
  }
]).directive('adCompileTemplate', [
  '$compile',
  function ($compile) {
    return function (scope, element, attrs) {
      scope.$watch(function (scope) {
        return scope.$eval(attrs.adCompileTemplate);
      }, function (value) {
        element.html(value);
        $compile(element.contents())(scope);
      });
    };
  }
]).factory('adLoadPage', [
  '$adConfig',
  '$http',
  'adStrapUtils',
  function ($adConfig, $http, adStrapUtils) {
    return function (options) {
      var start = (options.pageNumber - 1) * options.pageSize, pagingConfig = angular.copy($adConfig.paging), ajaxConfig = angular.copy(options.ajaxConfig);
      if (ajaxConfig.paginationConfig && ajaxConfig.paginationConfig.request) {
        angular.extend(pagingConfig.request, ajaxConfig.paginationConfig.request);
      }
      if (ajaxConfig.paginationConfig && ajaxConfig.paginationConfig.response) {
        angular.extend(pagingConfig.response, ajaxConfig.paginationConfig.response);
      }
      ajaxConfig.params[pagingConfig.request.start] = start;
      ajaxConfig.params[pagingConfig.request.pageSize] = options.pageSize;
      ajaxConfig.params[pagingConfig.request.page] = options.pageNumber;
      if (options.sortKey) {
        ajaxConfig.params[pagingConfig.request.sortField] = options.sortKey;
      }
      if (options.sortDirection === false) {
        ajaxConfig.params[pagingConfig.request.sortDirection] = pagingConfig.request.sortAscValue;
      } else if (options.sortDirection === true) {
        ajaxConfig.params[pagingConfig.request.sortDirection] = pagingConfig.request.sortDescValue;
      }
      var promise;
      if (ajaxConfig.method === 'JSONP') {
        promise = $http.jsonp(ajaxConfig.url + '?callback=JSON_CALLBACK', ajaxConfig);
      } else {
        promise = $http(ajaxConfig);
      }
      return promise.then(function (result) {
        var response = {
            items: adStrapUtils.evalObjectProperty(result.data, pagingConfig.response.itemsLocation),
            currentPage: options.pageNumber,
            totalPages: Math.ceil(adStrapUtils.evalObjectProperty(result.data, pagingConfig.response.totalItems) / options.pageSize),
            pagingArray: [],
            token: options.token
          };
        var TOTAL_PAGINATION_ITEMS = 5;
        var minimumBound = options.pageNumber - Math.floor(TOTAL_PAGINATION_ITEMS / 2);
        for (var i = minimumBound; i <= options.pageNumber; i++) {
          if (i > 0) {
            response.pagingArray.push(i);
          }
        }
        while (response.pagingArray.length < TOTAL_PAGINATION_ITEMS) {
          if (i > response.totalPages) {
            break;
          }
          response.pagingArray.push(i);
          i++;
        }
        return response;
      });
    };
  }
]).factory('adLoadLocalPage', [
  '$filter',
  function ($filter) {
    return function (options) {
      var response = {
          items: undefined,
          currentPage: options.pageNumber,
          totalPages: undefined,
          pagingArray: [],
          token: options.token
        };
      var start = (options.pageNumber - 1) * options.pageSize, end = start + options.pageSize, i, itemsObject = [], localItems;
      if (angular.isArray(options.localData)) {
        itemsObject = options.localData;
      } else {
        angular.forEach(options.localData, function (item) {
          itemsObject.push(item);
        });
      }
      localItems = $filter('orderBy')(itemsObject, options.sortKey, options.sortDirection);
      response.items = localItems.slice(start, end);
      response.allItems = itemsObject;
      response.currentPage = options.pageNumber;
      response.totalPages = Math.ceil(itemsObject.length / options.pageSize);
      var TOTAL_PAGINATION_ITEMS = 5;
      var minimumBound = options.pageNumber - Math.floor(TOTAL_PAGINATION_ITEMS / 2);
      for (i = minimumBound; i <= options.pageNumber; i++) {
        if (i > 0) {
          response.pagingArray.push(i);
        }
      }
      while (response.pagingArray.length < TOTAL_PAGINATION_ITEMS) {
        if (i > response.totalPages) {
          break;
        }
        response.pagingArray.push(i);
        i++;
      }
      return response;
    };
  }
]);

})(window, document);
