'use strict';

var ustcTennis = angular.module('ustc.tennis', ['ui.router', 'ui.bootstrap']);

ustcTennis.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('config');
    $stateProvider
        .state('config', {
            url: '/config',
            controller: 'ConfigCtrl',
            templateUrl: 'config.html'
        })
        .state('scoring', {
            url: '/scoring',
            controller: 'ScoringCtrl',
            templateUrl: 'scoring.html'
        })
        .state('result', {
            url: '/result',
            controller: 'ResultCtrl',
            templateUrl: 'result.html'
        })
        .state('help', {
            url: '/help',
            templateUrl: 'help.html'
        });
});

// pass match data to scoring page
ustcTennis.service('matchService', function() {
    var match = {};

    var addMatch = function(customMatch) {
        match = customMatch;
    };

    var getMatch = function() {
        // generate default match info
        if (Object.keys(match).length === 0) {
            match = {
                player1: 'Player 1',
                player2: 'Player 2',
                title: 'Demo Match',
                sets: 6,
                server: 'P1',
                advantage: true
            }
        }
        return match;
    };

    return {
        addMatch: addMatch,
        getMatch: getMatch
    }
});

// pass progress data to result page
ustcTennis.service('progressService', function() {
    var progress = [];

    var addProgress = function(customProgress) {
        progress = customProgress;
    };

    var getProgress = function() {
        // default match progress data
        if (Object.keys(progress).length === 0) {
            progress = window.DEMO_PROGRESS;
        }
        return progress;
    };

    return {
        addProgress: addProgress,
        getProgress: getProgress
    }
});

ustcTennis.controller('ConfigCtrl', function($scope, matchService) {
    // provide config data to service,
    $scope.submitMatch = function () {
        matchService.addMatch($scope.match);
    };
});

ustcTennis.controller('ScoringCtrl', function($scope, matchService, progressService, $location) {
    $scope.match = matchService.getMatch();

    // record all points in this match
    $scope.progress = [];

    // record current point selected on main panel
    $scope.currentPoint = {
        serveTime: '1st',
        hand: '',
        net: ''
    };

    // init current match status
    $scope.status = {
        currentServer: $scope.match.server,
        setsP1: 0,
        setsP2: 0,
        pointsP1: 0,
        pointsP2: 0
    };

    // define what happens when user clicks the 'Out' button
    $scope.setPointServeTime = function() {
        // when 1st serve is out
        if ($scope.currentPoint.serveTime == '1st') {
            $scope.currentPoint.serveTime = '2nd';
        }
        // when 2nd serve is out
        // set current currentPoint to double fault
        else if ($scope.currentPoint.serveTime == '2nd') {
            // when server makes double fault, the opponent wins
            $scope.currentPoint.win = ($scope.status.currentServer === 'P1') ? 'P2' : 'P1';
            $scope.currentPoint.type = 'UE';
            $scope.currentPoint.hand = 'F';
            $scope.currentPoint.net = '';
        }
    };

    var endMatch = function(winner) {
        progressService.addProgress($scope.progress);
        $location.path('result');
        alert("End of Match, Winner is " + winner + "!");
    };

    var updatePointRegular = function() {
        var pointsP1 = $scope.status.pointsP1.toString();
        var pointsP2 = $scope.status.pointsP2.toString();
        var currentWinner = $scope.currentPoint.win;

        // update point according to table
        var nextPointTable = $scope.match.advantage ? window.NEXT_POINT_WITH_ADV : window.NEXT_POINT_WITHOUT_ADV;
        var nextPoint = nextPointTable[pointsP1][pointsP2][currentWinner];
        $scope.status.pointsP1 = nextPoint[0];
        $scope.status.pointsP2 = nextPoint[1];

        // when a set ends, update score of this set
        if (nextPoint[2] == true) {
            if (currentWinner === 'P1') {
                $scope.status.setsP1 = parseInt($scope.status.setsP1) + 1;
                $scope.status.currentServer = 'P2';
            } else {
                $scope.status.setsP2 = parseInt($scope.status.setsP2) + 1;
                $scope.status.currentServer = 'P1';
            }
        }

        // end of match
        var maxSet = $scope.match.sets;
        if ($scope.status.setsP1 >= maxSet && $scope.status.setsP1 >= $scope.status.setsP2 + 2) {
            endMatch("P1");
        } else if ($scope.status.setsP2 >= maxSet && $scope.status.setsP2 >= $scope.status.setsP1 + 2) {
            endMatch("P2");
        }
    };

    var updatePointTieBreak = function() {
        var pointsP1 = parseInt($scope.status.pointsP1);
        var pointsP2 = parseInt($scope.status.pointsP2);
        var currentWinner = $scope.currentPoint.win;

        if (currentWinner === 'P1') {
            $scope.status.pointsP1 = pointsP1 + 1;
            $scope.status.pointsP2 = pointsP2;
        } else {
            $scope.status.pointsP1 = pointsP1;
            $scope.status.pointsP2 = pointsP2 + 1;
        }

        // end of tie break
        if ($scope.status.pointsP1 >= 7 && $scope.status.pointsP1 - $scope.status.pointsP2 >= 2) {
            $scope.status.setsP1 = parseInt($scope.match.sets) + 1;
            endMatch("P1");
        } else if ($scope.status.pointsP2 >= 7 && $scope.status.pointsP2 - $scope.status.pointsP1 >= 2) {
            $scope.status.setsP2 = parseInt($scope.match.sets) + 1;
            endMatch("P2");
        }
    };

    var savePoint = function() {
        // save this point
        var pointToSave = {
            pointsP1: $scope.status.pointsP1,
            pointsP2: $scope.status.pointsP2,
            setsP1: $scope.status.setsP1,
            setsP2: $scope.status.setsP2,
            pointServer: $scope.status.currentServer,
            pointWin: $scope.currentPoint.win,
            pointType: $scope.currentPoint.type,
            pointHand: $scope.currentPoint.hand,
            pointNet: $scope.currentPoint.net,
            pointServeTime: $scope.currentPoint.serveTime
        };
        $scope.progress.push(pointToSave);

        // clear button status
        $scope.currentPoint.serveTime = "1st";
        $scope.currentPoint.win = "";
        $scope.currentPoint.type = "";
        $scope.currentPoint.hand = "";
        $scope.currentPoint.net = "";
    };

    // update current point
    $scope.updatePoint = function() {
        $scope.status.setsP1 = parseInt($scope.status.setsP1);
        $scope.status.setsP2 = parseInt($scope.status.setsP2);

        if ($scope.status.setsP1 == $scope.match.sets && $scope.status.setsP2 == $scope.match.sets) {
            updatePointTieBreak();
        } else {
            updatePointRegular();
        }

        savePoint();
    };

});

ustcTennis.controller('ResultCtrl', function($scope, matchService, progressService) {
    $scope.match = matchService.getMatch();
    $scope.progress = progressService.getProgress();
    var progressLen = $scope.progress.length;
    $scope.match.endSetsP1 = $scope.progress[progressLen - 1].setsP1;
    $scope.match.endSetsP2 = $scope.progress[progressLen - 1].setsP2;
});