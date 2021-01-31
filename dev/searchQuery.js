const express = require('express');
const bodyParser = require('body-parser');
const requestPromise = require('request-promise');
const {v4: uuidv4} = require('uuid');
// Watson languageTranslator..........
const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');
const { IamAuthenticator } = require('ibm-watson/auth');
// Stackexchange Api..................
const stackexchange = require('stackexchange');
const options = { version: 2.2 };
const context = new stackexchange(options);

var app = express();

// Watson Language Translator API Configuration.....
const languageTranslator = new LanguageTranslatorV3({
  version: '2018-05-01',
  authenticator: new IamAuthenticator({
    apikey: 'owATBr1PcPdXG9KsV0jEe_-xxtvrypJ7gAYHl7uyxVcm',
  }),
  serviceUrl: 'https://api.eu-gb.language-translator.watson.cloud.ibm.com/instances/487d1371-8841-4279-a79e-73336dd67bea',
});

// Get input Query value.........
app.get('/home/:queryString', function(req, res){
    const query = req.params.queryString;
    const identifyParams = {
        text: query
    };
    languageTranslator.identify(identifyParams)
    .then(identifiedLanguages => {
        var language = identifiedLanguages.result.languages[0].language;
        if(language !== "en") {
            const translateParams = {
                text: query,
                modelId: `${language}-en`,
            };
            languageTranslator.translate(translateParams)
            .then(translationResult => {
                var queryString = translationResult.result.translations[0].translation;
                res.json(queryString);
            })
            .catch(err => {
                res.json('error:', err);
            });
        }
        else {
            var queryString = query;
            res.json(queryString);
        }
    })
    .catch(err => {
        res.json('error:', err);
    });
})

// Define port...................
app.listen(3004, function(){
    console.log("App is started on 3000.");
})



