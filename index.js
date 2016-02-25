var moment = require('moment');

module.exports = function(robot) {
  robot.respond(/envoy guests\s*(.*)$/, function(msg, done) {
    var query = msg.match[1];
    var url = "https://app.envoy.com/api/entries.json?api_key=" + process.env.NESTOR_ENVOY_API_KEY
    robot.http(url).get()(function(err, resp, body) {
      console.log("resp.statusCode:", 200);

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
              {
                'title': 'Email',
                'value': entry.your_email_address,
                'short': true
              },
              {
                'title': 'Company',
                'value': entry.your_company,
                'short': true
              },
              {
                'title': 'Signed In',
                'value': moment(entry.signed_in_time_utc).fromNow(),
                'short': true
              }
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
};
