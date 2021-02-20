const axios = require("axios");
var Sentiment = require("sentiment");
var sentiment = new Sentiment();
const Auth_key = "36MG*PWxNRuR2IurlPc8vg((";
var questionLink = [];
var questionID = [];
var questionTitle = [];
var actualTags = [];
var answers_per_question = [];
var comments_count = [];
var comments_body = [];
var answer_id = [];
var answer_accepted = [];
var score_answer = [];
var auth_repo = [];
var comments_sentiment = [];
var answer_sentiment = [];
var index = 0;
var positive = 0;
var negative = 0;
var neutral = 0;
class searchQueryHelper {
  stackExchange(queryString, questionCount, callback) {
    var page_size = parseInt(questionCount) + 10;
    const query = queryString.toString();
    const tagged = "javascript";
    var stackOverflowUserURL =
      "https://api.stackexchange.com/2.2/similar?key=" +
      Auth_key +
      "&order=desc&page=1&pagesize=" +
      page_size +
      "&sort=relevance&title=" +
      query +
      "&tagged=" +
      tagged +
      "&site=stackoverflow";
    var self = this;
    axios
      .get(stackOverflowUserURL)
      .then((response) => {
        if (response.status == 200) {
          self.getStackExchangeData(
            response.data,
            questionCount,
            function (result) {
              callback && callback(result);
            }
          );
        } else {
          console.log("Error Occured");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getStackExchangeData(questionData, questionCount, callback) {
    var totalLinks = questionData["items"].length;

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
    self.getStackExchangeQuestionById(function (result) {
      self.sentimentAnalysis(function (result) {
        var Data = [];
        var final_data;
        var final_data_positive = [];
        var final_data_neutral = [];
        var final_data_negative = [];
        var final_data_positive_false = [];
        var final_data_neutral_false = [];
        var final_data_negative_false = [];

        //On the basis of Author repo..................
        var zipped = answer_id.map(function (e, i) {
          return [e, comments_sentiment[i], answer_accepted[i]];
        });
        var sorted = zipped.sort(function (answer_id, auth_repo) {
          return answer_id[1] - auth_repo[1];
        });
        // const arrayColumn = (arr, n) => arr.map((x) => x[n]);
        // sorted_answer_id_auth_repo = arrayColumn(sorted, 0);
        // sorted_answer_id_auth_repo.reverse();

        sorted.forEach(function(item){
          if(item[1] == 'positive' && item[2] == true) {
            final_data_positive.push(item[0]);
          }
          if(item[1] == 'neutral' && item[2] == true) {
            final_data_neutral.push(item[0]);
          }
          if(item[1] == 'negative' && item[2] == true) {
            final_data_negative.push(item[0]);
          }
          if(item[1] == 'positive' && item[2] == false) {
            final_data_positive_false.push(item[0]);
          }
          if(item[1] == 'neutral' && item[2] == false) {
            final_data_neutral_false.push(item[0]);
          }
          if(item[1] == 'negative' && item[2] == false) {
            final_data_negative_false.push(item[0]);
          }
        })

        final_data = final_data_positive.concat(final_data_neutral, final_data_negative, final_data_positive_false, final_data_neutral_false, final_data_negative_false);
        final_data = final_data.slice(0, parseInt(questionCount));

        for (var k=0; k<final_data.length; k++) {
          var data = {};
          for(var i=0; i<result.length; i++) {
            for(var j=0; j<result[i].answer.length; j++) {
              if (result[i].answer[j].answer_id == final_data[k]) {
                data['title'] = result[i].title;
                data['link'] = result[i].link;
              }
            }
          }
          Data.push(data);
        }

        // Remove Duplicates from object..........
        var jsonObject = Data.map(JSON.stringify);
        var uniqueSet = new Set(jsonObject);
        var uniqueArray = Array.from(uniqueSet).map(JSON.parse);

        // Initialize variable length zero......
        questionLink.length = 0;
        questionID.length = 0;
        questionTitle.length = 0;
        actualTags.length = 0;
        answers_per_question.length = 0;
        comments_count.length = 0;
        comments_body.length = 0;
        answer_id.length = 0;
        answer_accepted.length = 0;
        score_answer.length = 0;
        auth_repo.length = 0;
        comments_sentiment.length = 0;
        answer_sentiment.length = 0;
        positive = 0;
        negative = 0;

        console.log(result);
        callback(uniqueArray);
      });
    });
  }

  getStackExchangeQuestionById(callback) {
    var stackOverflowQuestion =
      "https://api.stackexchange.com/2.2/questions/" +
      questionID[index] +
      "/answers?key=" +
      Auth_key +
      "&order=desc&sort=votes&site=stackoverflow&filter=!LfpZw1(lSuQgJ8v-9BuJ.1";
    axios
      .get(stackOverflowQuestion)
      .then((response) => {
        if (response.status == 200) {
          var result = response.data;
          console.log(questionID[index] + " => answerid => ");
          for (var i = 0; i < answers_per_question[index]; i++) {
            if (typeof result.items[i] !== "undefined") {
              console.log(result.items[i].answer_id);
              comments_count.push(result.items[i].comment_count);
              answer_id.push(result.items[i].answer_id);
              score_answer.push(result.items[i].score);
              answer_accepted.push(result.items[i].is_accepted);
              auth_repo.push(result.items[i].owner.reputation);

              // Get Comments Body.......
              for (var j = 0; j < result.items[i].comment_count; j++) {
                console.log(result.items[i].comments[j].body);
                comments_body.push(result.items[i].comments[j].body);
                var comment_string = result.items[i].comments[j].body;
                var analysis = sentiment.analyze(comment_string);
                if (analysis.comparative > 0) {
                  // comments_sentiment.push("positive");
                  positive += 1;
                } else if (analysis.comparative == 0) {
                  // comments_sentiment.push("neutral");
                  neutral += 1;
                } else {
                  // comments_sentiment.push("negative");
                  negative += 1;
                }
              }
              if (positive > negative && positive >= neutral) {
                comments_sentiment.push("positive");
              } else if (negative > neutral && negative > positive) {
                comments_sentiment.push("negative");
              } else {
                comments_sentiment.push("neutral");
              }
              positive = 0;
              negative = 0;
              neutral = 0;
            } else {
              console.log("Not Defined");
            }
          }
        } else {
          console.log("Error Occured");
        }
        index++;
        if (questionID.length == index) {
          index = 0;
          callback();
        } else {
          // console.log("id : " + questionID[index] + ", index : " + index);
          this.getStackExchangeQuestionById(callback);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  sentimentAnalysis(callback) {
    //Sentimental Analysis for answers.............
    var DATA = [];
    var jindex = 0;
    for (var i = 0; i < questionLink.length; i++) {
      positive = 0;
      neutral = 0;
      negative = 0;
      var data = {};
      data["link"] = questionLink[i];
      data["id"] = questionID[i];
      data["title"] = questionTitle[i];
      data["actualTags"] = actualTags[i];
      var ANSWERS = [];
      for (var j = 0; j < answers_per_question[i]; j++) {
        var answer = {};
        answer["is_accepted"] = answer_accepted[jindex];
        answer["answer_id"] = answer_id[jindex];
        answer["score_answer"] = score_answer[jindex];
        answer["authRepo"] = auth_repo[jindex];
        answer["sentiment"] = comments_sentiment[jindex];
        if (comments_sentiment[jindex] == "positive") {
          positive += 1;
        }
        if (comments_sentiment[jindex] == "negative") {
          negative += 1;
        }
        if (comments_sentiment[jindex] == "neutral") {
          neutral += 1;
        }
        ANSWERS.push(answer);
        jindex++;
      }
      data["answer"] = ANSWERS;
      if (positive > negative && positive >= neutral) {
        data["onclick_comments_sentiment"] = "positive";
        answer_sentiment.push(1);
      } else if (negative > neutral && negative > positive) {
        data["onclick_comments_sentiment"] = "negative";
        answer_sentiment.push(0);
      } else {
        data["onclick_comments_sentiment"] = "neutral";
        answer_sentiment.push(0.5);
      }
      DATA.push(data);
    }
    //Final JSON obtained.............
    callback && callback(DATA);
  }
}

module.exports = searchQueryHelper;
