var https = require('https');
var zlib = require("zlib");

class searchQueryHelper {
    stackExchange(queryString, questionCount) {
        var Auth_key = "36MG*PWxNRuR2IurlPc8vg((";
        var page_size = parseInt(questionCount) + 10;
        var query = queryString.toString();
        var stackOverflowUserURL = "https://api.stackexchange.com/2.2/similar?key=" + Auth_key + "&order=desc&page=1&pagesize=" + page_size + "&sort=relevance&title=" + query + "&site=stackoverflow";
        https.get(stackOverflowUserURL, function(response){
            if (response.statusCode == 200) {
                var gunzip = zlib.createGunzip();
                var jsonString = '';
                response.pipe(gunzip);
                    gunzip.on('data', function (chunk) {
                    jsonString += chunk;
                });
                gunzip.on('end', function () {
                    console.log(JSON.parse(jsonString));
                });
                gunzip.on('error', function (e) {
                    console.log(e);
                });
            }
            else{
                console.log("Error");
            }
        });
    }
}

module.exports = searchQueryHelper;