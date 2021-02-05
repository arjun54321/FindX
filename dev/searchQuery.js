const express = require("express");
const searchQueryHelper = require("./searchQueryHelper");
const bodyParser = require("body-parser");
const requestPromise = require("request-promise");
const https = require("https");
const zlib = require("zlib");
const { v4: uuidv4 } = require("uuid");
// Watson languageTranslator..........
const LanguageTranslatorV3 = require("ibm-watson/language-translator/v3");
const { IamAuthenticator } = require("ibm-watson/auth");

var app = express();
const searchQuery = new searchQueryHelper();

// Watson Language Translator API Configuration.....
const languageTranslator = new LanguageTranslatorV3({
  version: "2018-05-01",
  authenticator: new IamAuthenticator({
    apikey: "owATBr1PcPdXG9KsV0jEe_-xxtvrypJ7gAYHl7uyxVcm",
  }),
  serviceUrl:
    "https://api.eu-gb.language-translator.watson.cloud.ibm.com/instances/487d1371-8841-4279-a79e-73336dd67bea",
});

// Get input Query value.........
app.get("/home/:queryString/:questionCount", function (req, res) {
  var queryString = req.params.queryString;
  const questionCount = req.params.questionCount;
  const identifyParams = {
    text: queryString,
  };
  languageTranslator
    .identify(identifyParams)
    .then((identifiedLanguages) => {
      var language = identifiedLanguages.result.languages[0].language;
      if (language !== "en") {
        const translateParams = {
          text: queryString,
          modelId: `${language}-en`,
        };
        languageTranslator
          .translate(translateParams)
          .then((translationResult) => {
            var queryString =
              translationResult.result.translations[0].translation;
            searchQuery.stackExchange(
              queryString,
              questionCount,
              function (result) {
                res.status(200).json({
                  status: "succes",
                  data: result,
                });
              }
            );
          })
          .catch((err) => {
            res.sendStatus("error:", err);
          });
      } else {
        searchQuery.stackExchange(
          queryString,
          questionCount,
          function (result) {
            res.status(200).json({
              status: "succes",
              data: result,
            });
          }
        );
      }
    })
    .catch((err) => {
      res.sendStatus("error:", err);
    });
});

// Define port...................
app.listen(3000, function () {
  console.log("App is started on 3000.");
});
