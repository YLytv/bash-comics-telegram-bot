const config = require('./config.js');

if (config == undefined || config.chat_id == '' || config.token == '') {
    console.log('Fill config file, please!');
    return;
}

const bot = require('node-telegram-bot'),
    sender = new bot({
        token: config.token
    });

const Datastore = require('nedb'),
      db = new Datastore({ filename: './cache.nedb', autoload: true });

const rss = require('parse-rss');
const download = require('download-file')
const url = require("url");
const path = require("path");

rss(config.url, function(err, data) {
    if (err) throw err;
    const pattern = new RegExp(/src=\"(.*)\"/);
    data = data.reverse();

    data.forEach(function(item) {
        db.find({ id: item.guid }, function (err, docs) {
            console.log(err, docs.length);
            if (docs.length !== 0) return;

            var matches = item.description.match(pattern);
            var link = matches[1] || undefined;
            var parsed = url.parse(link);
            var filename = path.basename(parsed.pathname);

            var options = {
                directory: config.storage,
                filename: filename
            };

            download(link, options, function(err, path){
                if (err) throw err;

                sender.sendPhoto({
                    chat_id: config.chat_id,
                    caption: item.link,
                    files: {
                        photo: path
                    }
                }, function (err, res) {
                     console.log(err, res);
                    if (err) throw err;
                    db.insert({id: item.guid});
                });

            });
        });
    })
});