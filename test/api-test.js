'use strict';
const _ = require('lodash');
const assert = require('assert-diff');
const setupAPI = require('./setup-api');
const address = require('./fixtures/addresses').ACCOUNT;
const hashes = require('./fixtures/hashes');
const paymentSpecification = require('./fixtures/payment-specification');
const paymentResponse = require('./fixtures/payment-response');
const orderSpecification = require('./fixtures/order-specification');
const orderResponse = require('./fixtures/order-response');
const trustlineSpecification =
  require('./fixtures/trustline-specification');
const trustlineResponse = require('./fixtures/trustline-response');
const balancesResponse = require('./fixtures/balances-response');
const orderCancellationResponse =
  require('./fixtures/ordercancellation-response');
const settingsSpecification = require('./fixtures/settings-specification');
const settingsResponse = require('./fixtures/settings-response');
const signInput = require('./fixtures/sign-input');
const signOutput = require('./fixtures/sign-output');
const MockPRNG = require('./mock-prng');
const sjcl = require('../src').sjcl;
const submitResponse = require('./fixtures/submit-response');
const transactionResponse = require('./fixtures/transaction-response');
const accountTransactionsResponse =
  require('./fixtures/account-transactions-response');
const trustlinesResponse = require('./fixtures/trustlines-response');

function checkResult(expected, done, error, response) {
  if (error) {
    done(error);
    return;
  }
  assert.deepEqual(response, expected);
  done();
}

function withDeterministicPRNG(f) {
  const prng = sjcl.random;
  sjcl.random = new MockPRNG();
  f();
  sjcl.random = prng;
}

describe('RippleAPI', function() {
  const instructions = {maxLedgerVersionOffset: 100};
  beforeEach(setupAPI.setup);
  afterEach(setupAPI.teardown);

  it('preparePayment', function(done) {
    this.api.preparePayment(address, paymentSpecification, instructions,
      _.partial(checkResult, paymentResponse, done));
  });

  it('prepareOrder', function(done) {
    this.api.prepareOrder(address, orderSpecification, instructions,
      _.partial(checkResult, orderResponse, done));
  });

  it('prepareOrderCancellation', function(done) {
    this.api.prepareOrderCancellation(address, 23, instructions,
      _.partial(checkResult, orderCancellationResponse, done));
  });

  it('prepareTrustline', function(done) {
    this.api.prepareTrustline(address, trustlineSpecification,
      instructions, _.partial(checkResult, trustlineResponse, done));
  });

  it('prepareSettings', function(done) {
    this.api.prepareSettings(address, settingsSpecification,
      instructions, _.partial(checkResult, settingsResponse, done));
  });

  it('sign', function() {
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV';
    withDeterministicPRNG(() => {
      const result = this.api.sign(signInput, secret);
      assert.deepEqual(result, signOutput);
    });
  });

  it('submit', function(done) {
    this.api.submit(signOutput.signedTransaction,
      _.partial(checkResult, submitResponse, done));
  });

  it('getBalances', function(done) {
    this.api.getBalances(address, {},
      _.partial(checkResult, balancesResponse, done));
  });

  it('getTransaction', function(done) {
    this.api.getTransaction(hashes.VALID_TRANSACTION_HASH, {},
      _.partial(checkResult, transactionResponse, done));
  });

  it('getAccountTransactions', function(done) {
    const options = {types: ['payment', 'order'], outgoing: true, limit: 2};
    this.api.getAccountTransactions(address, options,
      _.partial(checkResult, accountTransactionsResponse, done));
  });

  // TODO: this doesn't test much, just that it doesn't crash
  it('getAccountTransactions with start option', function(done) {
    const options = {
      start: hashes.VALID_TRANSACTION_HASH,
      earliestFirst: false,
      limit: 2
    };
    this.api.getAccountTransactions(address, options,
      _.partial(checkResult, accountTransactionsResponse, done));
  });

  it('getTrustlines', function(done) {
    const options = {currency: 'USD'};
    this.api.getTrustlines(address, options,
      _.partial(checkResult, trustlinesResponse, done));
  });
});