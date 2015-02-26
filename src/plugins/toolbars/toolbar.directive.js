(function() {
    'use strict';
    angular.module('gantt.toolbars').directive('ganttToolbar', ['$timeout', '$compile', '$document', '$templateCache', 'ganttDebounce', 'ganttSmartEvent', function($timeout, $compile, $document, $templateCache, debounce, smartEvent) {
        // This toolbar displays more operation on a task

        return {
            restrict: 'E',
            templateUrl: function(tElement, tAttrs) {
                var templateUrl;
                if (tAttrs.templateUrl !== undefined) {
                    templateUrl = tAttrs.templateUrl;
                }
                if (tAttrs.template !== undefined) {
                    $templateCache.put(templateUrl, tAttrs.template);
                }
                return templateUrl;
            },
            scope: true,
            replace: true,
            controller: ['$scope', '$element', '$attrs', 'ganttUtils', function($scope, $element, $attrs, utils) {
                var bodyElement = angular.element($document[0].body);
                var parentElement = $scope.task.$element;
                var showToolbarPromise;
                var visible = false;
                var mouseEnterX;
                
                var inElement = function (event) {
                    var xIn = false, yIn = false;
                    if (event.clientX >= $element[0].offsetLeft && event.clientX <= $element[0].offsetLeft + $element[0].offsetWidth) {
                        xIn = true;
                    }
                    if (event.clientY >= $element[0].offsetTop && event.clientY <= $element[0].offsetTop + $element[0].offsetHeight) {
                        yIn = true;
                    }
                    return xIn && yIn;
                };

                var mouseMoveHandler = smartEvent($scope, bodyElement, 'mousemove', debounce(function(e) {
                    mouseEnterX = e.clientX;
                    if (!visible) {
                        displayToolbar(true, false);
                    } else if (!inElement(e)) {
                        updateToolbar(mouseEnterX);
                    }
                }, 5, false));

                $scope.task.getForegroundElement().bind('mousemove', function(evt) {
                    mouseEnterX = evt.clientX;
                });

                $scope.task.getForegroundElement().bind('mouseenter', function(evt) {
                    mouseEnterX = evt.clientX;
                    displayToolbar(true, true);
                });

                $scope.task.getForegroundElement().bind('mouseleave', function(evt) {
                    if (!inElement(evt)) {
                        displayToolbar(false);
                    }
                });

                $element.bind('mouseleave', function () {
                    displayToolbar(false);
                });

                if ($scope.pluginScope.api.tasks.on.moveBegin) {
                    $scope.pluginScope.api.tasks.on.moveBegin($scope, function(task) {
                        if (task === $scope.task) {
                            displayToolbar(true);
                        }   
                    });
                    
                    $scope.pluginScope.api.tasks.on.moveEnd($scope, function(task) {
                        if (task === $scope.task) {
                            displayToolbar(false);
                        }
                    });

                    $scope.pluginScope.api.tasks.on.resizeBegin($scope, function(task) {
                        if (task === $scope.task) {
                            displayToolbar(true);
                        }
                    });

                    $scope.pluginScope.api.tasks.on.resizeEnd($scope, function(task) {
                        if (task === $scope.task) {
                            displayToolbar(false);
                        }
                    });
                }

                var displayToolbar = function(newValue, showDelayed) {
                    if (showToolbarPromise) {
                        $timeout.cancel(showToolbarPromise);
                    }

                    var rowToolbar = $scope.task.row.model.toolbar;
                    if (typeof(rowToolbar) === 'boolean') {
                        rowToolbar = {enabled: rowToolbar};
                    }
                    var enabled = utils.firstProperty([rowToolbar], 'enabled', $scope.pluginScope.enabled);
                    if (enabled && !visible && newValue) {
                        if (showDelayed) {
                            showToolbarPromise = $timeout(function() {
                                showToolbar(mouseEnterX);
                            }, 500, false);
                        } else {
                            showToolbar(mouseEnterX);
                        }
                    } else if (!newValue) {
                        if (!$scope.task.active) {
                            hideToolbar();
                        }
                    }
                };

                var showToolbar = function(x) {
                    visible = true;
                    mouseMoveHandler.bind();

                    var taskToolbar = $scope.task.model.toolbar;
                    var rowToolbar = $scope.task.row.model.toolbar;

                    if (typeof(taskToolbar) === 'boolean') {
                        taskToolbar = {enabled: taskToolbar};
                    }

                    if (typeof(rowToolbar) === 'boolean') {
                        rowToolbar = {enabled: rowToolbar};
                    }

                    $scope.displayed = utils.firstProperty([taskToolbar, rowToolbar], 'enabled', $scope.pluginScope.enabled);

                    $scope.$evalAsync(function() {
                        var restoreNgHide;
                        if ($element.hasClass('ng-hide')) {
                            $element.removeClass('ng-hide');
                            restoreNgHide = true;
                        }
                        $scope.elementHeight = $element[0].offsetHeight;
                        if (restoreNgHide) {
                            $element.addClass('ng-hide');
                        }
                        $scope.taskRect = parentElement[0].getBoundingClientRect();
                        updateToolbar(x);
                    });
                };

                var getViewPortWidth = function() {
                    var d = $document[0];
                    return d.documentElement.clientWidth || d.documentElement.getElementById('body')[0].clientWidth;
                };

                var updateToolbar = function(x) {
                    // Check if toolbar is overlapping with view port
                    if (x + $element[0].offsetWidth > getViewPortWidth()) {
                        $element.css('left', (x + 20 - $element[0].offsetWidth) + 'px');
                        $scope.isRightAligned = true;
                    } else {
                        $element.css('left', (x - 20) + 'px');
                        $scope.isRightAligned = false;
                    }
                };

                var hideToolbar = function() {
                    visible = false;
                    mouseMoveHandler.unbind();
                    $scope.$evalAsync(function() {
                        $scope.displayed = false;
                    });
                };

                if ($scope.task.isMoving) {
                    // Display toolbar because task has been moved to a new row
                    displayToolbar(true, false);
                }

                $scope.gantt.api.directives.raise.new('ganttToolbar', $scope, $element);
                $scope.$on('$destroy', function() {
                    $scope.gantt.api.directives.raise.destroy('ganttToolbar', $scope, $element);
                });
            }]
        };
    }]);
}());