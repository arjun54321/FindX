const axios = require("axios");
var Sentiment = require("sentiment");
var sentiment = new Sentiment();
const Auth_key = "36MG*PWxNRuR2IurlPc8vg((";
class searchQueryHelper {
  stackExchange(queryString, questionCount, callback) {
    var page_size = parseInt(questionCount) + 0;
    const query = queryString.toString();
    var stackOverflowUserURL =
      "https://api.stackexchange.com/2.2/similar?key=" +
      Auth_key +
      "&order=desc&page=1&pagesize=" +
      page_size +
      "&sort=relevance&title=" +
      query +
      "&site=stackoverflow";
    var self = this;
    axios
      .get(stackOverflowUserURL)
      .then((response) => {
        if (response.status == 200) {
          self.getStackExchangeData(response.data, function (result) {
            callback && callback(result);
          });
        } else {
          console.log("Error Occured");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getStackExchangeData(questionData, callback) {
    var totalLinks = questionData["items"].length;
    var questionLink = [];
    var questionID = [];
    var questionTitle = [];
    var actualTags = [];
    var answers_per_question = [];
<<<<<<< HEAD
=======
    var currentLink = 0;

>>>>>>> da8ce74767e4bcbc5cedcef431f6250118f5e9d2
    questionData["items"].forEach(function (item, index) {
      if (!item["is_answered"] || item["score"] < 0) {
        // pass
      } else {
        questionID.push(item["question_id"]);
        actualTags.push(item["tags"]);
        questionLink.push(item["link"]);
        answers_per_question.push(item["answer_count"]);
        questionTitle.push(item["title"]);
      }
    });

    // Get questions by id
    var self = this;
    var comments_count = [];
    var comments_body = [];
    var answer_id = [];
    var answer_accepted = [];
    var score_answer = [];
    var auth_repo = [];
<<<<<<< HEAD
    questionID.forEach(async function (item, index) {
=======
    var test = [];
    var len = Math.max(...answers_per_question);
    var itemsProcessed = 0;


    // My function
   const myfunction = async function() {
    questionID.forEach(function (item, index) {
      itemsProcessed++;
>>>>>>> da8ce74767e4bcbc5cedcef431f6250118f5e9d2
      self.getStackExchangeQuestionById(item, function (result) {
        for (var i = 0; i < answers_per_question[index]; i++) {
          if (typeof result.items[i] !== "undefined") {
            comments_count.push(result.items[i].comment_count);
            answer_id.push(result.items[i].answer_id);
            score_answer.push(result.items[i].score);
            auth_repo.push(result.items[i].owner.reputation);

            // Get Comments Body.......
            for (var j = 0; j < result.items[i].comment_count; j++) {
              comments_body.push(result.items[i]["comments"][j]["body"]);

            }
          } else {
            console.log("Not Defined");
          }
        }
      });
    });
    setTimeout(function () {
      // if (comments_count.length === 0) {
      //   callback && callback("No relevant data found");
      // }
      var k = 0;
      var comments_sentiment = [];
      //Sentimental Analysis for comments........
      for (var i = 0; i < comments_count.length; i++) {
        if (comments_count[i] === 0) {
          comments_sentiment.push("neutral");
        } else {
          for (var j = 0; j < comments_count[i]; j++) {
            var comment_string = comments_body[k];
            k += 1;
            var analysis = sentiment.analyze(comment_string);
            if (analysis.comparative > 0) {
              comments_sentiment.push("positive");
            } else if (analysis.comparative == 0) {
              comments_sentiment.push("neutral");
            } else {
              comments_sentiment.push("negative");
            }
          }
        }
      }
      //Sentimental Analysis for answers.............
      var DATA = [];
      var answer_sentiment = [];
      var k = 0;
      for (var i = 0; i < questionLink.length; i++) {
        var data = {};
        data["link"] = questionLink[i];
        data["id"] = questionID[i];
        data["title"] = questionTitle[i];
        data["actualTags"] = actualTags[i];
        var ANSWERS = [];
        var positive = 0;
        var negative = 0;
        for (var j = 0; j < answers_per_question[i]; j++) {
          var answer = {};
          answer["is_accepted"] = answer_accepted[j];
          answer["answer_id"] = answer_id[j];
          answer["score_answer"] = score_answer[j];
          answer["authRepo"] = auth_repo[j];
          answer["sentiment"] = comments_sentiment[k];
          if (comments_sentiment[k] == "positive") {
            positive += 1;
          }
          if (comments_sentiment[k] == "negative") {
            negative += 1;
          }
          k += 1;
          ANSWERS.push(answer);
        }
        data["answer"] = ANSWERS;
        if (positive > negative) {
          data["onclick_comments_sentiment"] = "positive";
          answer_sentiment.push(1);
        }
        if (negative > positive) {
          data["onclick_comments_sentiment"] = "negative";
          answer_sentiment.push(0);
        }
        if (negative == positive) {
          data["onclick_comments_sentiment"] = "neutral";
          answer_sentiment.push(0.5);
        }
        DATA.push(data);
      }
      //Final JSON obtained.............
      callback && callback(DATA);
      // self.sentimentAnalysis(comments_count, comments_body, function (result) {
      //   callback(result);
      // });
    }, 2000);
  }

  getStackExchangeQuestionById(questionID, callback) {
    var stackOverflowQuestion =
      "https://api.stackexchange.com/2.2/questions/" +
      questionID +
      "/answers?key=" +
      Auth_key +
      "&order=desc&sort=votes&site=stackoverflow&filter=!LfpZw1(lSuQgJ8v-9BuJ.1";
    axios
      .get(stackOverflowQuestion)
      .then((response) => {
        if (response.status == 200) {
          callback && callback(response.data);
        } else {
          console.log("Error Occured");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  // sentimentAnalysis(comments_count, comments_body, callback) {
  //   callback(comments_count);
  //   var k = 0;
  //   var comments_sentiment = [];
  //   console.log("Going for sentiment analysis");
  //   for (var i = 0; i < comments_count.length; i++) {
  //     console.log(comments_count[i]);
  //     // if(comments_count[i] == 0){
  //     //   comments_sentiment.append("neutral")
  //     // }
  //     // else{
  //     //     for(var j=0; j<comments_count[i]; j++){

  //     //     }
  //     // }
  //   }
  // }
}

module.exports = searchQueryHelper;
