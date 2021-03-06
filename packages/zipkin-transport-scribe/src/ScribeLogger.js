/* eslint-disable no-console */
const {Scribe} = require('scribe');
const {fromByteArray: base64encode} = require('base64-js');
const THRIFT = require('zipkin-encoder-thrift');

function ScribeLogger({scribeHost, scribePort = 9410, scribeInterval = 1000, log = console}) {
  const scribeClient = new Scribe(scribeHost, scribePort, {autoReconnect: true});
  scribeClient.on('error', () => {});

  this.queue = [];

  setInterval(() => {
    if (this.queue.length > 0) {
      try {
        scribeClient.open((err) => {
          if (err) {
            log.error('Error writing Zipkin data to Scribe', err);
          } else {
            this.queue.forEach((span) => {
              scribeClient.send('zipkin', base64encode(THRIFT.encode(span)));
            });
            scribeClient.flush();
            this.queue.length = 0;
          }
        });
      } catch (err) {
        log.error('Error writing Zipkin data to Scribe', err);
      }
    }
  }, scribeInterval);
}
ScribeLogger.prototype.logSpan = function logSpan(span) {
  this.queue.push(span);
};

module.exports = ScribeLogger;
