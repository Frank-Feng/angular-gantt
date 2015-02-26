(function(){
    'use strict';
    angular.module('gantt.toolbars', ['gantt']).directive('ganttToolbars', ['$compile', '$document', function($compile, $document) {
        return {
            restrict: 'E',
            require: '^gantt',
            scope: {
                enabled: '=?'
            },
            link: function(scope, element, attrs, ganttCtrl) {
                var api = ganttCtrl.gantt.api;

                // Load options from global options attribute.
                if (scope.options && typeof(scope.options.toolbars) === 'object') {
                    for (var option in scope.options.toolbars) {
                        scope[option] = scope.options[option];
                    }
                }

                if (scope.enabled === undefined) {
                    scope.enabled = true;
                }

                scope.api = api;

                api.directives.on.new(scope, function(directiveName, taskScope, taskElement) {
                    if (directiveName === 'ganttTask') {
                        var toolbarScope = taskScope.$new();

                        toolbarScope.pluginScope = scope;
                        var ifElement = $document[0].createElement('div');
                        angular.element(ifElement).attr('data-ng-if', 'pluginScope.enabled');

                        var toolbarElement = $document[0].createElement('gantt-toolbar');
                        if (attrs.templateUrl !== undefined) {
                            angular.element(toolbarElement).attr('data-template-url', attrs.templateUrl);
                        }
                        if (attrs.template !== undefined) {
                            angular.element(toolbarElement).attr('data-template', attrs.template);
                        }

                        //append toolbar element to body
                        angular.element(ifElement).append(toolbarElement);
                        taskElement.append($compile(ifElement)(toolbarScope));
                    }
                });
            }
        };
    }]);
}());
