var moment = require('moment');
var chrono = require('chrono-node');
var strftime = require('strftime');

module.exports = function(robot) {
  robot.respond(/envoy guests\s*(.*)$/, function(msg, done) {
    var timeQuery = msg.match[1];
    var startTime = "", endTime = "";

    if(timeQuery && timeQuery.trim() != "") {
      timeQuery = timeQuery.trim();
      results = chrono.parse(timeQuery);
      if(results.length > 0) {
        var result = results[0];
        var start = result.start.date();
        startTime = strftime("%Y-%m-%d", start);

        if(result.end) {
          endTime = strftime("%Y-%m-%d", result.end.date());
        } else {
          var end = new moment(start).add(24, 'h').toDate();
          endTime = strftime("%Y-%m-%d", end);
        }
      }
    }

    var url = "https://app.envoy.com/api/entries.json?api_key=" + process.env.NESTOR_ENVOY_API_KEY;
    var message = "Fetching entries...";

    if(startTime != "" && endTime != "") {
      url = url + "&from_date=" + startTime + "&to_date=" + endTime;
      message = "Fetching entries from " + startTime + " to " + endTime;
    }

    msg.reply(message).then(function() {
      robot.http(url).get()(function(err, resp, body) {
        if(resp.statusCode != 200) {
          msg.reply("Oops, there was an error getting guests list from Envoy", done);
        } else {
          var guestList = [];
          var entries = JSON.parse(body);

          for(var i in entries) {
            var entry = entries[i];
            guestList.push(msg.newRichResponse({
              title: entry.your_full_name,
              fields: [
                { 'title': 'Email', 'value': entry.your_email_address, 'short': true },
                { 'title': 'Company', 'value': entry.your_company, 'short': true },
                { 'title': 'Signed In', 'value': moment(entry.signed_in_time_utc).fromNow(), 'short': true }
              ]
            }));
          }

          if(guestList.length == 0) {
            msg.send("Oops you don't have any guests", done);
          } else {
            msg.send(guestList, done);
          }
        }
      });
    });
  });
};
