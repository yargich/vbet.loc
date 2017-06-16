/* global VBET5 */
/**
 * @ngdoc controller
 * @name vbet5.controller:settingsCtrl
 * @description
 * settings controller
 */
VBET5.controller('settingsCtrl', ['$scope', '$rootScope', '$location', 'Zergling', 'Translator', 'AuthData', 'Config', 'Utils', 'Moment', 'CountryCodes', function ($scope, $rootScope, $location, Zergling, Translator, AuthData, Config, Utils, Moment, CountryCodes) {
    'use strict';

    var REG_FORM_BIRTH_YEAR_LOWEST = 1900;
    var referralStartDate = Config.main.friendReferral;
    $scope.countryCodes = Utils.objectToArray(Utils.getAvailableCountries(CountryCodes), 'key');
    if (Config.main.registration.sortCountry) {
        $scope.countryCodes = $scope.countryCodes.sort(Utils.alphabeticalSorting);
    }
    $scope.personalDetails = angular.copy(Config.main.personalDetails);
    $scope.patterns = Config.main.personalDetails.patterns;
    $scope.settingsPage = $location.search().settingspage || Config.main.settingsDefaultPage; //deep linking
    $location.search('settingspage', undefined);
    $scope.changepasswordData = {
        oldpassword: '',
        password: '',
        password2: ''
    };

    $scope.preferences = {
        oddFormat: 'american',
        language: $rootScope.env.lang
    };

    $scope.monthNames = Config.main.monthNames;

    $scope.resetError = {};
    $scope.passwordResetError = {};

    // if field name is not in this object then name of the field in get_user and update_user requests is the same
    var fieldNamesInUpdateUserInfo = {
        sur_name: 'last_name',
        phone_number: 'phone'
    };

    /**
     * @ngdoc method
     * @name changePassword
     * @methodOf vbet5.controller:settingsCtrl
     * @description changes user password using data from corresponding form
     */
    $scope.changePassword = function changePassword() {
        $scope.changepasswordForm.oldpassword.$invalid = $scope.changepasswordForm.oldpassword.$error.incorrect = false;
        $scope.working = true;
        $scope.changepasswordForm.$setPristine();
        var request = {
            password: $scope.changepasswordData.oldpassword,
            new_password: $scope.changepasswordData.password
        };
        Zergling.get(request, 'update_user_password').then(function (response) {
            $scope.working = false;
            console.log(response);
            if (response.auth_token) {
                var authData = AuthData.get();
                authData.auth_token = response.auth_token;
                AuthData.set(authData);
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'success',
                    title: 'Success',
                    content: Translator.get('Password changed')
                });
            } else {
                throw response;
            }
        })['catch'](function (response) {
            $scope.working = false;
            if (response.data.match("1006")) {
                $scope.changepasswordForm.oldpassword.$invalid = $scope.changepasswordForm.oldpassword.$error.incorrect = true;
                return;
            }
            var message = response.code == 12 ? 'Incorrect Current Password' : (Translator.get('Error occured') + ' : ' +response.msg);
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: message
            });
        });

    };

    /**
     * @ngdoc method
     * @name changeDetails
     * @methodOf vbet5.controller:settingsCtrl
     * @description changes user details using data from corresponding form
     */
    $scope.changeDetails = function changeDetails() {
        $scope.details.country_code = $scope.details.selectCountryCode && $scope.details.selectCountryCode.key;
        $scope.working = true;
        var request = {user_info:{}};
        if ($scope.personalDetails.editableFields.length) {
            var index, i;
            for(i = 0; i < $scope.personalDetails.editableFields.length; i++) {
                index = $scope.personalDetails.editableFields[i];
                if(index === 'birth_date' && $scope.birthDate && $scope.birthDate.year && $scope.birthDate.month && $scope.birthDate.day) {
                    $scope.details[index] = $scope.birthDate.year.toString() + '-' + $scope.birthDate.month.toString() + '-' + $scope.birthDate.day.toString();
                }
                request.user_info[fieldNamesInUpdateUserInfo[index] || index] = index == 'gender' ? $scope.details.sex : $scope.details[index];
            }
        }
        request.user_info.password = $scope.details.password;
        if(Config.main.GmsPlatform) {
            request.user_info.subscribed_to_news = $scope.details.subscribed_to_news;
        }

        console.log("changeDetails", $scope.personalDetails.editableFields, request, $scope.details);
        Zergling.get(request, 'update_user').then(function (response) {
            $scope.working = false;
            if (response.result === 0) {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'success',
                    title: 'Success',
                    content: 'Personal information updated.'
                });
                prepareOnceEditableFields();

            } else if (response.result === '-1002' || response.result === '-1003') {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: 'Wrong Password' // No need to translate since its translated on the dialog side already
                });
            } else if (response.result === '-1119') {
                $scope.detailsForm.email.$invalid = $scope.detailsForm.email.$error.dublicate = true;
            } else if (response.result === '-1123') {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: 'Passport Number is already registered for another account' // No need to translate since its translated on the dialog side already
                });
            }
            console.log(response);
        })['catch'](function (response) {
            $scope.working = false;
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: Translator.get('Error occured') + ' : ' + response.data
            });
            console.log(response);
        });

    };

    /**
     * @ngdoc method
     * @name savePreferences
     * @methodOf vbet5.controller:settingsCtrl
     * @description changes user preferences using data from corresponding form
     */
    $scope.savePreferences = function savePreferences() {
        $scope.working = true;

    };

    /**
     * @ngdoc method
     * @name loadUserInfo
     * @methodOf vbet5.controller:settingsCtrl
     * @description loads user information from swarm
     */
    $scope.loadUserInfo = function loadUserInfo() {
        $scope.loadingInfo = true;
        Zergling.get({}, 'get_user').then(function (data) {
            $scope.details = data;
            $scope.details.phone_number = $scope.details.phone; // field name is different when loading/saving  :/
            $scope.details.selectCountryCode = CountryCodes[$scope.details.country_code];
            if ($scope.details.selectCountryCode !== undefined && $scope.countryCodes.indexOf($scope.details.selectCountryCode) === -1) {
                $scope.countryCodes.push($scope.details.selectCountryCode);
                if (Config.main.registration.sortCountry) {
                    $scope.countryCodes = $scope.countryCodes.sort(Utils.alphabeticalSorting);
                }
                var countryCodeIndex = $scope.personalDetails.disabledFields.indexOf('country_code');
                if (countryCodeIndex > -1) {
                    $scope.personalDetails.disabledFields.splice(countryCodeIndex, 1);
                }
                var readOnlyIndex = $scope.personalDetails.readOnlyFields.indexOf('country_code');
                if(readOnlyIndex > -1){
                    $scope.personalDetails.editableFields.push($scope.personalDetails.readOnlyFields.splice(readOnlyIndex, 1)[0]);
                }
            }
            if (Config.main.getBankInfoToProfile) {
                Zergling.get({}, 'get_bank_info').then(function (response) {
                    if (response && response.details) {
                        $scope.details.bank_info = response.details.bank_info;
                        if ($scope.details.bank_info) {
                            var index = $scope.personalDetails.editableFields.indexOf('bank_info');
                            if (index > -1) {
                                $scope.personalDetails.readOnlyFields.push($scope.personalDetails.editableFields.splice(index, 1)[0]);
                            }
                        }
                    }
                });
            }

            prepareOnceEditableFields(); // must be refactored '5163'

            $scope.loadingInfo = false;
        });
    };

    /**
     * @ngdoc method
     * @name prepareOnceEditableFields
     * @methodOf vbet5.controller:settingsCtrl
     * @description Prepare the fields which should be editable only once
     */
    function prepareOnceEditableFields () {
        var index;

        if (!$scope.details.sex) {
            $scope.details.sex = 'M';
        } else {
            index = $scope.personalDetails.editableFields.indexOf('gender');
            if (index > -1) {
                $scope.personalDetails.readOnlyFields.push($scope.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }
        $scope.details.viewGender = Translator.get({'M': 'Male', 'F': 'Female'}[$scope.details.sex]);

        if ($scope.details.first_name) {
            index = $scope.personalDetails.editableFields.indexOf('first_name');
            if (index > -1) {
                $scope.personalDetails.readOnlyFields.push($scope.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }

        if ($scope.details.sur_name) {
            index = $scope.personalDetails.editableFields.indexOf('sur_name');
            if (index > -1) {
                $scope.personalDetails.readOnlyFields.push($scope.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }

        if ($scope.details.email) {
            index = $scope.personalDetails.editableFields.indexOf('email');
            if (index > -1) {
                $scope.personalDetails.readOnlyFields.push($scope.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }

        if ($scope.details.doc_number) {
            index = $scope.personalDetails.editableFields.indexOf('doc_number');
            if (index > -1) {
                $scope.personalDetails.readOnlyFields.push($scope.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }

        if ($scope.details.zip_code) {
            index = $scope.personalDetails.editableFields.indexOf('zip_code');
            if (index > -1) {
                $scope.personalDetails.readOnlyFields.push($scope.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }

        if($scope.details.birth_date) {  // can edit if birthdate is empty and functionality of edit  enabled from config
            var birthOptions = $scope.details.birth_date.split('-');
            $scope.birthDate = $scope.birthDate || {};
            $scope.birthDate.month = birthOptions[1];
            $scope.birthDate.day = birthOptions[2];
            $scope.birthDate.year = birthOptions[0];

            index = $scope.personalDetails.editableFields.indexOf('birth_date');
            if (index > -1) {
                $scope.personalDetails.readOnlyFields.push($scope.personalDetails.editableFields.splice(index, 1)[0]);
            }
        } else if($scope.personalDetails.editableFields.indexOf('birth_date') !== -1) {
            $scope.birthDate = $scope.birthDate || {};
            $scope.birthDate.years = [];
            var i, max = new Date().getFullYear() - Config.main.registration.minimumAllowedAge;
            for (i = max; i >= REG_FORM_BIRTH_YEAR_LOWEST; i -= 1) {
                $scope.birthDate.years[i] = i.toString();
            }
        }

        if ($scope.details.bank_info) {
            index = $scope.personalDetails.editableFields.indexOf('bank_info');
            if (index > -1) {
                $scope.personalDetails.readOnlyFields.push($scope.personalDetails.editableFields.splice(index, 1)[0]);
            }
        }
    }


    $scope.depositLimitsData = {
        amount: '',
        day: '',
        week: '',
        month: ''
    };

    $scope.selfExclusionData = {period: 0};

    /**
     * @ngdoc method
     * @name getLimits
     * @methodOf vbet5.controller:settingsCtrl
     * @description loads deposit limits into $scope.depositLimitsData
     */
    $scope.getLimits = function getLimits() {
        Zergling.get({type : 'deposit'}, 'user_limits').then(function (response) {
            $scope.working = false;
            if (response.result === 0) {
                console.log(response.details);
                $scope.depositLimitsData = response.details;
            }

        })['catch'](function (response) {
            $scope.working = false;
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: Translator.get('Error occured') + ' : ' + response.data
            });
            console.log(response);
        });
    };

    /**
     * @ngdoc method
     * @name setDepositLimits
     * @methodOf vbet5.controller:settingsCtrl
     * @description sets deposit limits
     */
    $scope.setDepositLimits = function setDepositLimits() {
        $scope.working = true;
        var request = {
            type: 'deposit'
        };

        if (Config.main.GmsPlatform) {
            request.limits = [{
                deposit_limit: parseFloat($scope.depositLimitsData.max_day_deposit),
                period_type: 2,
                period: 1
            },
            {
                deposit_limit: parseFloat($scope.depositLimitsData.max_week_deposit),
                period_type: 3,
                period: 1
            },
            {
                deposit_limit: parseFloat($scope.depositLimitsData.max_month_deposit),
                period_type: 4,
                period: 1
            }];
        } else {
            request.limits = {
                single: $scope.depositLimitsData.max_single_deposit,
                daily: $scope.depositLimitsData.max_day_deposit,
                weekly: $scope.depositLimitsData.max_week_deposit,
                monthly: $scope.depositLimitsData.max_month_deposit
            };
        }

        Zergling.get(request, 'set_user_limits').then(function (response) {
            $scope.working = false;
            if (response.result === 0 || response.result === 'OK') {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'success',
                    title: 'Success',
                    content: Translator.get('Deposit limits set.')
                });
            } else {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: Translator.get('Please try later or contact support.')
                });
            }
            console.log(response);
        })['catch'](function (response) {
            $scope.working = false;
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: Translator.get('Error occured') + ' : ' + response.data
            });
            console.log(response);
        });
        console.log(request);
    };

    /**
     * @ngdoc method
     * @name setRealityCheckInterval
     * @methodOf vbet5.controller:settingsCtrl
     * @description Set reality check interval and shows corresponding dialog
     * @param {Number} Input value
     */
    $scope.setRealityCheckInterval = function setRealityCheckInterval (value) {
        var parsedValue = parseInt(value);
        var request = {active_time: parseInt(parsedValue)};
        $scope.working = true;
        Zergling.get(request, 'update_user_active_time').then(function (response) {
            $scope.working = false;
            if (response.result === 0) {
                $rootScope.profile.active_time_in_casino = parsedValue;
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'success',
                    title: 'Success',
                    content: 'Your Reality Check settings have been updated.'
                });

            } else {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: 'Error'
                });
            }
        })['catch'](function (response) {
            $scope.working = false;
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: Translator.get('Error occured') + ' : ' + response.data
            });
        });
    };

    $scope.selectPeriod = function selectPeriod(value) {
        $scope.selfExclusionData = value;
    };

    /**
     * @ngdoc method
     * @name setSelfExclusion
     * @methodOf vbet5.controller:settingsCtrl
     * @description sets self-exclusion periods
     */
    $scope.setSelfExclusion = function setSelfExclusion(type) {
        $scope.working = true;
        var request = {
            exc_type: type
        };
        request[$scope.selfExclusionData.type] = $scope.selfExclusionData.period;
        Zergling.get(request, "set_client_self_exclusion").then(function (response) {
            $scope.working = false;
            var exTipe = "Time-Out";
            if (response.result === 0 || response.result === 'OK') {
                if (type === Config.main.selfExclusion.type) {
                    $scope.logOut();
                    console.log('Logout After Exclusion');
                    exTipe = "Self-Exclusion";
                }
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'success',
                    title: 'Success',
                    content: Translator.get( exTipe + ' period set.')
                });
            } else {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: Translator.get(response.result_text || 'Error occured')
                });
            }
            console.log(response);
        })['catch'](function (response) {
            $scope.working = false;
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: Translator.get(response.result_text || 'Error occured') + ' : ' + response.data
            });
            console.log(response);
        });
        console.log(request);
    };

    /**
     * @ngdoc method
     * @name initFriendReferral
     * @methodOf vbet5.controller:settingsCtrl
     * @description initialize
     */
    $scope.initFriendReferral = function initFriendReferral() {
        $scope.loadingReferralsList = false;
        if (!$scope.refDatesArray) {
            var startDate = Moment.moment([referralStartDate.year, referralStartDate.month - 2]);// (month - 2) because momentjs starts month count from 0 and because we need to include current month
            var monthsPeriod =  Moment.get().diff(startDate, 'months');
            var firstMonth = Config.main.GmsPlatform ? 1 : 0;

            $scope.refDatesArray = [];
            for(var i = firstMonth; i < monthsPeriod; i++) {
                var item = Moment.get().subtract('months', i).startOf('month');
                var date = {
                    text: item.format(('MMMM YYYY')),
                    month: item.month() + 1,
                    year: item.year(),
                    id: i
                };
                $scope.refDatesArray.push(date);
            }
            $scope.selectedFriendRefData = {
                date: $scope.refDatesArray[0]
            };
        }

        $scope.loadFriendReferralData();
    };


    /**
     * @ngdoc method
     * @name loadFriendReferralData
     * @methodOf vbet5.controller:settingsCtrl
     * @description load data for friend referral
     */
    $scope.loadFriendReferralData = function loadFriendReferralData() {
        $scope.loadingReferralsList = true;
        var request = {
            month: $scope.selectedFriendRefData.date.month,
            year: $scope.selectedFriendRefData.date.year
        };
        Zergling.get(request, 'get_ref_client_info').then(function(response) {
            if(response && response.details) {
                console.log("Friend Referral Data:", response);
                $scope.friendReferralData = response.details;
                if(response.details.sub_clients) {
                    if(angular.isArray(response.details.sub_clients.sub_client)) {
                        $scope.friendReferralList =  response.details.sub_clients.sub_client;
                    } else {
                        $scope.friendReferralList = [response.details.sub_clients.sub_client] || "";
                    }
                }
                $scope.loadingReferralsList = false;
            }
        })['catch'](function(error) {
            console.log(error);
        });
    };

    /**
     * @ngdoc method
     * @name calculateAge
     * @methodOf vbet5.controller:settingsCtrl
     * @description Recalculate user age and set to userAge
     */
    $scope.calculateAge = function calculateAge() {
        if ($scope.birthDate && $scope.birthDate.year && $scope.birthDate.month && $scope.birthDate.day)
        {
            var birthDate = new Date($scope.birthDate.year, $scope.birthDate.month - 1, $scope.birthDate.day);
            var today = new Date();
            var age = today.getFullYear() - birthDate.getFullYear();
            var mounts = today.getMonth() - birthDate.getMonth();
            if (mounts < 0 || (mounts === 0 && today.getDate() < birthDate.getDate())){
                age--;
            }
            $scope.userAge = age;
        } else {
            $scope.userAge = null;
        }

    };

    /**
     * @ngdoc method
     * @name resetFieldError
     * @methodOf vbet5.controller:settingsCtrl
     * @description Resets field error
     * @param {String} Field name
     * @param {Boolean} true if the field type is password
     */
    $scope.resetFieldError = function resetFieldError(fieldName, changePassword){
        if(!Config.main.enableResetError) {
            return;
        }
        if (changePassword) {
            $scope.changepasswordData[fieldName] = '';
            $scope.passwordResetError[fieldName] = true;
            $scope.changepasswordForm[fieldName].blur = false;
        } else {
            $scope.details[fieldName] = '';
            $scope.resetError[fieldName] = true;
            $scope.detailsForm[fieldName].blur = false;
        }

    };
}]);
