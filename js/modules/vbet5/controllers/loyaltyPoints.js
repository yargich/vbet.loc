/**
 * @ngdoc controller
 * @name vbet5.controller: loyaltyPointsCtrl
 * @description
 * points exchange controller
 */
VBET5.controller('loyaltyPointsCtrl', ['$scope', '$rootScope', 'Translator', 'Zergling', 'Config', 'TimeoutWrapper', function ($scope, $rootScope, Translator, Zergling, Config, TimeoutWrapper) {
    'use strict';
    TimeoutWrapper = TimeoutWrapper($scope);

    $scope.pointsExchangeData = {};
    $scope.programs = [];
    $scope.progressValue = 0;

    /**
     * @ngdoc method
     * @name reloadLoyaltyInfo
     * @methodOf vbet5.controller:pointsExchangeCtrl
     * @description prepare and show data on init
     */
    function reloadLoyaltyInfo() {

        Zergling.get({}, 'get_loyalty_levels').then(function (response) {
            if (response.result === 0) {
                $scope.programs =  response.details || [];

                $scope.programs.sort(function (a, b) {
                    return a.Id - b.Id;
                });

                getUserStatuses();
            }
        }, function (error) {
            console.log('error', error);
        });

        Zergling.get({}, 'get_loyalty_rates').then(function (response) {
            if (response.result === 0) {
                $scope.currencyRate =  response.details || [];
                if($scope.currencyRate.length) {
                    var currencyLength = $scope.currencyRate.length;
                    for (var i = 0; i < currencyLength; i++) {
                        if ($scope.currencyRate[i].CurrencyId == $scope.profile.currency_id) {
                            $scope.pointsExchangeData.currencyRate = $scope.currencyRate[i];
                            break;
                        }
                    }
                }
            }
            console.log('get_loyalty_rates successResponse', response);

        }, function (error) {
            console.log('error', error);
        });
    }

    /**
     * @ngdoc method
     * @name getNextStatus
     * @methodOf vbet5.controller:pointsExchangeCtrl
     * @description get current PointsExchange status and min points amount of status by user exchange Id
     *
     */
    function getUserStatuses() {
        if($scope.profile.loyalty_level_id && $scope.programs && $scope.programs.length) {
            for (var i = 0, len = $scope.programs.length; i < len; ++i) {
                if ($scope.profile.loyalty_level_id == $scope.programs[i].Id) {
                    $scope.pointsExchangeData.userCurrentStatus = $scope.programs[i];

                    $scope.progressValue = (100 * $rootScope.profile.loyalty_last_earned_points) / ($scope.programs[$scope.programs.length - 1].MaxPoint - $scope.programs[0].MinPoint);

                    var nextIndex = i;

                    if (Config.main.loyaltyPointsShowAlwaysNextLevel ) {
                        nextIndex = i === len - 1 ? i : i + 1;
                        $scope.pointsExchangeData.nextLevelDifference = $scope.programs[nextIndex].MinPoint - $scope.profile.loyalty_last_earned_points;
                    } else {
                        if ($rootScope.profile.loyalty_last_earned_points < $scope.programs[i].MinPoint) {
                            nextIndex = i === 0 ? 0 : i - 1;
                        } else if ($rootScope.profile.loyalty_last_earned_points > $scope.pointsExchangeData.userCurrentStatus.MaxPoint) {
                            nextIndex = i === len - 1 ? i : i + 1;
                        }
                    }


                    $scope.pointsExchangeData.userNextStatus = $scope.programs[nextIndex];

                    if ($rootScope.profile.loyalty_point_usage_period !== undefined && $rootScope.profile.loyalty_point_usage_period !== null) {
                        $scope.pointsExchangeData.remainingDays = Translator.get('In {1} days', [$rootScope.profile.loyalty_point_usage_period]);
                    }

                    break;
                }
            }
        }
    }

    /**
     * @ngdoc method
     * @name adjustMaxAmount
     * @methodOf vbet5.controller:pointsExchangeCtrl
     * @description User can't input higher then available points
     *
     */
    $scope.adjustMaxAmount = function adjustMaxAmount() {
        if($scope.profile.loyalty_point < $scope.pointsExchangeData.amount) {
            $scope.pointsExchangeData.amount = $scope.profile.loyalty_point;
        }
    };

    /**
     * @ngdoc method
     * @name pointsExchangeRequest
     * @methodOf vbet5.controller:pointsExchangeCtrl
     * @description Send request for point exchange
     *
     */
    $scope.pointsExchangeRequest = function pointsExchangeRequest() {
        var dialog = {
            type: 'error',
            title: 'Error',
            content: Translator.get('There was an unexpected error. Please contact support or try a little later.')
        };
        Zergling.get({'points': $scope.pointsExchangeData.amount}, 'bonus_exchange_points').then(function (response) {
                if (response.code === 0) {
                    dialog.type = 'success';
                    dialog.title = 'Success';
                    dialog.content = Translator.get('Point Exchange was successful.');
                } else if(response.code === 2417) {
                    console.log('2417', response);
                    dialog.content = Translator.get('Entered amount is out of allowable range.');
                } else if(response.code === 2084) {
                    console.log('2084', response);
                    dialog.content = Translator.get('Transaction amount error.');
                }
            },
            function (response) {
                console.log('error:', response);
            }
        )['finally'](function () {
            reloadLoyaltyInfo();
            $rootScope.$broadcast("globalDialogs.addDialog", dialog);
        });
    };

    $scope.selecteProgram = function selecteProgram(program) {
        $scope.selectedProgram = program;
    };

    reloadLoyaltyInfo();
}]);
