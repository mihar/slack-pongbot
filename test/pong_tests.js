var chai = require('chai');
chai.use(require('chai-string'));
var expect = chai.expect;
var pong = require('../lib/pong.js');
var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
var mongoose = require('mongoose');
var sinon = require('sinon');

describe('Pong', function () {
  before(function (done) {
    pong.init();
    mongoose.connect('mongodb://localhost/pingpong_test', done);
  });

  beforeEach(function (done) {
    Player.remove(done);
  });

  describe('#init()', function () {
    it('sets channel', function () {
      expect(pong.channel).to.eq('#pongbot');
    });
    it('sets deltaTau', function () {
      expect(pong.deltaTau).to.eq(0.94);
    });
    it('unsets currentChallenge', function () {
      expect(pong.currentChallenge).to.be.false;
    });
  });

  describe('#registerPlayer', function () {
    beforeEach(function (done) {
      pong.registerPlayer('ZhangJike', done);
    });

    it('creates a player record', function (done) {
      Player.where({ user_name: 'ZhangJike' }).findOne(function (err, user) {
        expect(user).not.to.be.null;
        expect(user.user_name).to.eq('ZhangJike');
        expect(user.wins).to.eq(0);
        expect(user.losses).to.eq(0);
        expect(user.elo).to.eq(0);
        expect(user.tau).to.eq(0);
        done();
      });
    });

    it('does not create a duplicate player', function (done) {
      pong.registerPlayer('ZhangJike', function (err, user) {
        expect(err).to.not.be.undefined;
        expect(err.code).to.eq(11000);
        done();
      });
    });
  });

  describe('#findPlayer', function () {
    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', done);
      });

      it('finds a player', function (done) {
        pong.findPlayer('ZhangJike', function (err, user) {
          expect(err).to.be.null;
          expect(user).not.to.be.null;
          expect(user.user_name).to.eq('ZhangJike');
          done();
        });
      });
    });

    describe('without a player', function () {
      it("doesn't find player", function (done) {
        pong.findPlayer('ZhangJike', function (err, user) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("User 'ZhangJike' does not exist.");
          expect(user).to.be.null;
          done();
        });
      });
    });
  });

  describe('getEveryone', function () {
    describe('with a player', function (done) {
      beforeEach(function (done) {
        sinon.spy(console, 'log');
        pong.registerPlayer('ZhangJike', done);
      });

      afterEach(function () {
        console.log.restore();
      });

      it('logs and returns users', function (done) {
        pong.getEveryone(function (err, users) {
          expect(users.length).to.eq(1);
          expect(console.log.calledOnce).to.be.true;
          expect(console.log.firstCall.args[0][0].user_name).to.eq('ZhangJike');
          done();
        });
      });
    });
  });

  describe('updateWins', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.updateWins('ZhangJike', function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.updateWins('ZhangJike', done);
        });
      });

      it('increments the number of wins', function (done) {
        pong.findPlayer('ZhangJike', function (err, user) {
          expect(err).to.be.null;
          expect(user.wins).to.eq(1);
          done();
        });
      });

      it('increments the number of wins twice', function (done) {
        pong.updateWins('ZhangJike', function () {
          pong.findPlayer('ZhangJike', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(2);
            done();
          });
        });
      });
    });
  });

  describe('updateLosses', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.updateLosses('ZhangJike', function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.updateLosses('ZhangJike', done);
        });
      });

      it('increments the number of losses', function (done) {
        pong.findPlayer('ZhangJike', function (err, user) {
          expect(err).to.be.null;
          expect(user.losses).to.eq(1);
          done();
        });
      });

      it('increments the number of losses twice', function (done) {
        pong.updateLosses('ZhangJike', function () {
          pong.findPlayer('ZhangJike', function (err, user) {
            expect(err).to.be.null;
            expect(user.losses).to.eq(2);
            done();
          });
        });
      });
    });
  });

  describe('createSingleChallenge', function () {
    it('returns an error when the challenger cannot be found', function (done) {
      pong.createSingleChallenge('ZhangJike', 'DengYaping', function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a challenger', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', done);
      });

      it('returns an error when the challenged cannot be found', function (done) {
        pong.createSingleChallenge('ZhangJike', 'DengYaping', function (err) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("User 'DengYaping' does not exist.");
          done();
        });
      });

      describe('with a challenged', function () {
        beforeEach(function (done) {
          pong.registerPlayer('DengYaping', done);
        });

        it('creates a challenge', function (done) {
          pong.createSingleChallenge('ZhangJike', 'DengYaping', function (err, challenge) {
            expect(err).to.not.be.null;
            expect(err.message).to.eq("You have challenged DengYaping to a ping pong match!");
            expect(challenge).to.not.be.null;
            pong.findPlayer('ZhangJike', function (err, challenger) {
              expect(challenger.currentChallenge).to.not.be.undefined;
              expect(challenge._id.equals(challenger.currentChallenge)).to.be.true;
              pong.findPlayer('DengYaping', function (err, challenged) {
                expect(challenged.currentChallenge).to.not.be.undefined;
                expect(challenged.currentChallenge.equals(challenger.currentChallenge)).to.be.true;
                done();
              });
            });
          });
        });

        describe('with an existing challenge', function (done) {
          beforeEach(function (done) {
            pong.createSingleChallenge('ZhangJike', 'DengYaping', function() {
              done();
            });
          });

          it('fails to create a challenge', function (done) {
            pong.createSingleChallenge('ZhangJike', 'DengYaping', function (err, challenge) {
              expect(err).to.not.be.null;
              expect(err.message).to.eq("There's already an active challenge for ZhangJike");
              done();
            });
          });
        });
      });
    });
  });

  describe('createDoubleChallenge', function () {
    describe('with 4 players', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.registerPlayer('DengYaping', function () {
            pong.registerPlayer('ChenQi', function () {
              pong.registerPlayer('ViktorBarna', function () {
                done();
              });
            });
          });
        });
      });

      it('creates a challenge', function (done) {
        pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna', function (err, challenge) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("You and DengYaping have challenged ChenQi and ViktorBarna to a ping pong match!");
          expect(challenge).to.not.be.null;
          pong.findPlayer('ZhangJike', function (err, c1) {
            expect(c1.currentChallenge.equals(challenge._id)).to.be.true;
            pong.findPlayer('DengYaping', function (err, c2) {
              expect(c2.currentChallenge.equals(challenge._id)).to.be.true;
              pong.findPlayer('ChenQi', function (err, c3) {
                expect(c3.currentChallenge.equals(challenge._id)).to.be.true;
                pong.findPlayer('ViktorBarna', function (err, c4) {
                  expect(c4.currentChallenge.equals(challenge._id)).to.be.true;
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  describe('checkChallenge', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.checkChallenge('ZhangJike', function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function (err, user) {
          var challenge = new Challenge({
            state: 'Proposed',
            type: 'Single',
            date: Date.now(),
            challenger: [],
            challenged: []
          });
          challenge.save(function () {
            user.currentChallenge = challenge.id;
            user.save(done);
          });
        });
      });

      it('returns current challenge', function (done) {
        pong.checkChallenge('ZhangJike', function (err, challenge) {
          expect(err).to.be.null;
          expect(challenge.type).to.eq('Single');
          done();
        });
      });
    });
  });

  describe('setChallenge', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.setChallenge('ZhangJike', null, function(err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', done);
      });

      it('sets challenge', function(done) {
        var challenge = new Challenge({
          state: 'Proposed',
          type: 'Single',
          date: Date.now(),
          challenger: [],
          challenged: []
        });
        challenge.save(function (err, challenge) {
          pong.setChallenge('ZhangJike', challenge._id, function () {
            pong.findPlayer('ZhangJike', function (err, user) {
              expect(user.currentChallenge.equals(challenge._id)).to.be.true;
              done();
            });
          });
        });
      });
    });
  });

  describe('removeChallenge', function () {
    describe('with a challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.registerPlayer('DengYaping', function () {
            pong.createSingleChallenge('ZhangJike', 'DengYaping', function () {
              done();
            });
          });
        });
      });

      it('removes challenge', function (done) {
        pong.removeChallenge('DengYaping', function () {
          pong.findPlayer('DengYaping', function (err, user) {
            expect(err).to.be.null;
            expect(user.currentChallenge).to.be.undefined;
            done();
          });
        });
      });
    });
  });

  describe('acceptChallenge', function () {
  });

  describe('declineChallenge', function () {
  });

  describe('calculateTeamElo', function () {
  });

  describe('eloSinglesChange', function () {
  });

  describe('eloDoublesChange', function () {
  });

  describe('win', function () {
  });

  describe('lose', function () {
  });

  describe('findDoublesPlayers', function () {
  });

  describe('reset', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.reset('ZhangJike', function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function (err, user) {
          user.wins = 42;
          user.losses = 24;
          user.tau = 3;
          user.elo = 158;
          user.save(done);
        });
      });

      it('resets user fields', function (done) {
        pong.reset('ZhangJike', function () {
          pong.findPlayer('ZhangJike', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(0);
            expect(user.tau).to.eq(1);
            expect(user.elo).to.eq(0);
            expect(user.losses).to.eq(0);
            done();
          });
        });
      });
    });
  });

  describe('getDuelGif', function () {
    it('returns a gif', function (done) {
      pong.getDuelGif(function (gif) {
        expect(gif).to.startsWith('http');
        done();
      });
    });
  });
});
