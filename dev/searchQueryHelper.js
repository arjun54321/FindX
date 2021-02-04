const axios = require("axios");
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
            callback(result);
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
    var currentLink = 0;
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
    var test = [];
    var len = Math.max(...answers_per_question);
    var itemsProcessed = 0;
    questionID.forEach(function (item, index) {
      itemsProcessed++;
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
        console.log(answer_id);
      });
      console.log("Helooooooooo.........");
    });
    // Promise.all([comments_count]).then((values) => {
    //   console.log(values);
    // });
  }

  testing(x) {
    console.log(x);
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
}

module.exports = searchQueryHelper;
