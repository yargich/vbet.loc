/* global VBET5 */

/**
 * @ngdoc controller
 * @name vbet5.controller:messagesCtrl
 * @description
 *  messages controller
 */
VBET5.controller('messagesCtrl', ['$scope', '$rootScope', '$sce', 'Utils', 'Zergling', 'Translator', 'Config', 'TimeoutWrapper', function ($scope, $rootScope, $sce, Utils, Zergling, Translator, Config, TimeoutWrapper) {
    'use strict';
    TimeoutWrapper = TimeoutWrapper($scope);
    var TYPE_INCOMING = 0, TYPE_OUTGOING = 1,
        SYSTEM_MESSAGES = {
            'BET_APPROVED_TITLE': Translator.get('APPROVED BET'),
            'BET_APPROVED_MESSAGE:': Translator.get('YOUR BET HAS BEEN APPROVED'),
            'BET_DECLINE_TITLE': Translator.get('DECLINED BET'),
            'BET_DECLINE_MESSAGE:': Translator.get('YOUR BET HAS BEEN DECLINED')
        };

    $rootScope.env.unreadCountOld = undefined;

    /**
     * @ngdoc method
     * @name replaceSystemMessages
     * @methodOf vbet5.controller:messagesCtrl
     * @description Replaces system messages with more readable ones
     * @param {String} Default text
     */
    function replaceSystemMessages(text) {
        var replaced;
        angular.forEach(SYSTEM_MESSAGES, function (value, key) {
            if (text.indexOf(key) > -1) {
                replaced = text.replace(key, value);
            }
        });
        return (replaced) ? replaced : text;
    }

    $scope.messagesProps = {
        page: Config.main.messagesPageMenu[0],
        names: {
            'inbox': 'Inbox',
            'sent': 'Sent messages',
            'new': 'New Message'
        },
        inboxLoading: false,
        outboxLoading: false
    };
    $scope.newMessage = {subject: '', body: ''};

    $scope.$on('messages.delete', function (event, data) {
        console.log(JSON.stringify(data.message));
        var callData = undefined;
        var commandName = undefined;
        if(Config.main.GmsPlatform){
            callData = {"message_id": data.message.id};
            commandName = "delete_user_message";
        }else{
            callData = {
                messages: [
                    {message_id: data.message.id}
                ]
            };
            commandName = "delete_internal_messages";
        }
        // zergling call here


        Zergling.get(callData, commandName).then(function (response) {
            TimeoutWrapper(function () {
                $scope.loadMessages(data.message.isInbox, !data.message.isInbox);
            }, 1500);
        }, function (failResponse) {
            console.log(failResponse);
        });
    });

    /**
     * @ngdoc method
     * @name updateIncomingMessages
     * @methodOf vbet5.controller:messagesCtrl
     * @description Prepares incoming messsages for the template
     * @param {Object} Response data
     */
    function updateIncomingMessages(response) {
        $scope.inboxMessages = response.messages;
        angular.forEach($scope.inboxMessages, function (message) {
            message.body = replaceSystemMessages(message.body);
            message.subject = replaceSystemMessages(message.subject);
            message.body = $sce.trustAsHtml(message.body.substr(0, 6).toLowerCase() === '<html>' ? message.body : Utils.nl2br(message.body));
            message.subject = $sce.trustAsHtml(message.subject);
            message.isSystem = false;
            message.isSystem = !message.hasOwnProperty('checked');
            message.isDeletable = !!Config.main.deleteInboxMessages;
            message.isInbox = true;
        });
    }

    /**
     * @ngdoc method
     * @name updateOutgoingMessages
     * @methodOf vbet5.controller:messagesCtrl
     * @description Prepares outgoing messsages for the template
     * @param {Object} Response data
     */
    function updateOutgoingMessages(response) {
        $scope.sentMessages = response.messages;
        angular.forEach($scope.sentMessages, function (message) {
            message.body = $sce.trustAsHtml(Utils.nl2br(message.body));
            message.subject = $sce.trustAsHtml(message.subject);
            message.isDeletable = !!Config.main.deleteSentMessages;
            message.isInbox = false;
        });
    }

    /**
     * @ngdoc method
     * @name loadMessages
     * @methodOf vbet5.controller:messagesCtrl
     * @description loads incoming and outgoing messages and marks their bodies and subjects as safe for displaying html
     * @param {Boolean} inbox whether to load inbox messages
     * @param {Boolean} outbox whether to load outbox messages
     */
    $scope.loadMessages = function loadMessages(inbox, outbox) {
        var request;
        inbox = inbox === undefined ? true : inbox;
        outbox = outbox === undefined ? true : outbox;

        if (inbox) {
            $scope.messagesProps.inboxLoading = true;

            request = {
                where: {
                    type: TYPE_INCOMING
                }
            };

            Zergling.get(request, 'user_messages').then(function (response) {
                updateIncomingMessages(response);
                $scope.messagesProps.inboxLoading = false;
            });
        }

        if (outbox && !Config.main.disableInternalMessageSending) {
            $scope.messagesProps.outboxLoading = true;

            request = {
                where: {
                    type: TYPE_OUTGOING
                }
            };

            Zergling.get(request, 'user_messages').then(function (response) {
                updateOutgoingMessages(response);
                $scope.messagesProps.outboxLoading = false;
            });
        }

    };

    /**
     * @ngdoc method
     * @name updateUnreadCount
     * @methodOf vbet5.controller:messagesCtrl
     * @description Updates unread messages count in the header before backend data is received
     */
    function updateUnreadCount() {
        if ($rootScope.profile.unread_count > 0) {
            $rootScope.profile.unread_count--;
        }
    }

    /**
     * @ngdoc method
     * @name openMessage
     * @methodOf vbet5.controller:messagesCtrl
     * @description opens message and marks as read
     */
    $scope.openMessage = function openMessage(message, messageType) {
        message.open = !message.open;
        if (messageType !== TYPE_INCOMING) {
            return;
        }
        if (message.checked == 0 || message.isSystem) {
            Zergling.get({'message_id': message.id}, 'read_user_message').then(function (resp) {
                if (!message.isSystem) {
                    message.checked = 1;
                    updateUnreadCount();
                }
            });
        }

    };

    /**
     * @ngdoc method
     * @name sendMessage
     * @methodOf vbet5.controller:messagesCtrl
     * @description sends message using $scope.newMessage form model and clears form on success
     */
    $scope.sendMessage = function sendMessage() {

        if ($scope.newMessage.subject.length > 255 || $scope.newMessage.body.length > 4000) {
            $rootScope.$broadcast("globalDialogs.addDialog", {
                type: 'error',
                title: 'Error',
                content: 'Message not sent. Title or content probably too long.'
            });
            return;
        }

        $scope.working = true;
        Zergling.get({
            subject: $scope.newMessage.subject,
            body: $scope.newMessage.body
        }, 'add_user_message').then(function (response) {
            console.log(response);
            if (response && parseInt(response.result, 10) === 0) {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'success',
                    title: 'Success',
                    content: 'Message sent'
                });
            } else {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: 'Message not sent. Title or content probably too long.'
                });
            }
            $scope.working = false;
            $scope.newMessage = {subject: '', body: ''};
            $scope.sendMessageForm.$setPristine();
            TimeoutWrapper(function () {
                $scope.loadMessages(false, true); // to make sent message visible in sent messages
            }, 2000);
        }, function (response) {
            console.log(response);
            if (response && parseInt(response.code, 10) === 24) {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: 'Message contains abusive content.'
                });
            } else {
                $rootScope.$broadcast("globalDialogs.addDialog", {
                    type: 'error',
                    title: 'Error',
                    content: 'Message not sent.'
                });
            }
            $scope.working = false;

        });

        console.log($scope.newMessage);
    };

    /**
     * @ngdoc method
     * @name sendMessage
     * @methodOf vbet5.controller:messagesCtrl
     * @description sends message using $scope.newMessage form model and clears form on success
     */
    $scope.deleteMessage = function  deleteMessage (message) {
        $rootScope.$broadcast("globalDialogs.addDialog", {
            type: 'confirm',
            title: 'Confirm',
            yesno: true,
            content: 'Are you sure you want to delete this message ?',
            hideCloseButton: true,
            yesButton: ['messages.delete', {message: message}]
        });
    };

    /**
     * @ngdoc method
     * @name updateMessageBody
     * @methodOf vbet5.controller:messagesCtrl
     * @description Changes message body length based on character maximum limit
     */
    $scope.updateMessageBody = function updateMessageBody () {
        if (Config.main.maxMessageLength && $scope.newMessage.body && $scope.newMessage.body.length && $scope.newMessage.body.length > Config.main.maxMessageLength) {
            $scope.newMessage.body = $scope.newMessage.body.substring(0, Config.main.maxMessageLength);
        }
    };

    $scope.$on('messages.updateMessages', function (event, messages) {
        $scope.loadMessages(true, true);
    });

}]);
