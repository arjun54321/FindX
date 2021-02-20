var express = require('express')
const bodyParser = require('body-parser')
const Blockchain = require('./blockchain')
const rp = require('request-promise')
const axios = require("axios");
const { v4: uuidv4 } = require('uuid')
const searchQueryHelper = require("./searchQueryHelper");
const searchQuery = new searchQueryHelper();
// Watson languageTranslator..........
const LanguageTranslatorV3 = require("ibm-watson/language-translator/v3");
const { IamAuthenticator } = require("ibm-watson/auth");
// const requestPromise = require('request-promise')
const nodeAddress = uuidv4()
const bitcoin = new Blockchain()
var app = express()
const port = process.argv[2]
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.get('/blockchain', function (req, res) {
  res.send(bitcoin)
})

app.post('/transaction', function (req, res) {
  const newTransaction = req.body
  const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction)
  res.json({ note: `Transaction will be added in block ${blockIndex}.` })
})

app.post('/transaction/broadcast', function (req, res) {
  const newTransaction = bitcoin.createNewTransaction(
    req.body.queryResult,
    req.body.sender,
    req.body.recipient
  )
  bitcoin.addTransactionToPendingTransactions(newTransaction)
  const requestPromises = []
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/transaction',
      method: 'POST',
      body: newTransaction,
      json: true
    }
    requestPromises.push(rp(requestOptions))
  })
  Promise.all(requestPromises).then(data => {
    res.json({ note: 'Transaction created & broadcast successfully.' })
  })
})

app.get('/mine', function (req, res) {
  const lastBlock = bitcoin.getLastBlock()
  const previousBlockHash = lastBlock['hash']
  const currentBlockData = {
    transactions: bitcoin.pendingTransactions,
    index: lastBlock['index'] + 1
  }
  const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData)
  const blockHash = bitcoin.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  )
  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash)
  const requestPromises = []
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/recive-new-block',
      method: 'POST',
      body: { newBlock: newBlock },
      json: true
    }
    requestPromises.push(rp(requestOptions))
  })
  Promise.all(requestPromises)
    // .then(data => {
    //   const requestOptions = {
    //     uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
    //     method: 'POST',
    //     body: {
    //       amount: 12.5,
    //       sender: '00',
    //       recipient: nodeAddress
    //     },
    //     json: true
    //   }
    //   return rp(requestOptions)
    // })
    .then(data => {
      res.json({
        note: 'New block mined & broadcast successfully',
        block: newBlock
      })
    })
})

app.post('/recive-new-block', function (req, res) {
  const newBlock = req.body.newBlock
  const lastBlock = bitcoin.getLastBlock()
  const correctHash = lastBlock.hash === newBlock.previousBlockHash
  const correctIndex = lastBlock['index'] + 1 === newBlock['index']
  if (correctHash && correctIndex) {
    bitcoin.chain.push(newBlock)
    bitcoin.pendingTransactions = []
    res.json({
      note: 'New block received and accepted',
      newBlock: newBlock
    })
  } else {
    res.json({
      note: 'New block rejected',
      newBlock: newBlock
    })
  }
})

app.post('/register-and-broadcast-node', function (req, res) {
  const newNodeUrl = req.body.newNodeUrl
  const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl
  if (nodeNotAlreadyPresent && notCurrentNode) {
    bitcoin.networkNodes.push(newNodeUrl)
  }
  const registerNodesPromises = []
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/register-node',
      method: 'POST',
      body: { newNodeUrl: newNodeUrl },
      json: true
    }
    registerNodesPromises.push(rp(requestOptions))
  })
  Promise.all(registerNodesPromises)
    .then(data => {
      console.log(newNodeUrl)
      const bulkRegisterOptions = {
        uri: newNodeUrl + '/register-nodes-bulk',
        method: 'POST',
        body: {
          allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]
        },
        json: true
      }
      return rp(bulkRegisterOptions)
    })
    .then(data => {
      res.json({
        note: 'New node registered with other networks successfully!'
      })
    })
})

app.post('/register-node', function (req, res) {
  const newNodeUrl = req.body.newNodeUrl
  const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl
  if (nodeNotAlreadyPresent && notCurrentNode) {
    bitcoin.networkNodes.push(newNodeUrl)
  }
  res.json({
    note: 'New node registered successfully.'
  })
})

app.post('/register-nodes-bulk', function (req, res) {
  const allNetworkNodes = req.body.allNetworkNodes
  allNetworkNodes.forEach(networkNodeUrl => {
    const nodeNotAlreadyPresent =
      bitcoin.networkNodes.indexOf(networkNodeUrl) == -1
    const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl
    if (nodeNotAlreadyPresent && notCurrentNode) {
      bitcoin.networkNodes.push(networkNodeUrl)
    }
  })
  res.json({
    note: 'Bulk registration successfull.'
  })
})

app.get('/consensus', function (req, res) {
  const requestPromises = []
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/blockchain',
      method: 'GET',
      json: true
    }

    requestPromises.push(rp(requestOptions))
  })

  Promise.all(requestPromises).then(blockchains => {
    const currentChainLength = bitcoin.chain.length
    let maxChainLength = currentChainLength
    let newLongestChain = null
    let newPendingTransactions = null

    blockchains.forEach(blockchain => {
      if (blockchain.chain.length > maxChainLength) {
        maxChainLength = blockchain.chain.length
        newLongestChain = blockchain.chain
        newPendingTransactions = blockchain.pendingTransactions
      }
    })

    if (
      !newLongestChain ||
      (newLongestChain && !bitcoin.chainIsValid(newLongestChain))
    ) {
      res.json({
        note: 'Current chain has not been replaced.',
        chain: bitcoin.chain
      })
    } else {
      bitcoin.chain = newLongestChain
      bitcoin.pendingTransactions = newPendingTransactions
      res.json({
        note: 'This chain has been replaced.',
        chain: bitcoin.chain
      })
    }
  })
})

app.get('/block/:blockHash', function (req, res) {
  const blockHash = req.params.blockHash
  const correctBlock = bitcoin.getBlock(blockHash)
  res.json({
    block: correctBlock
  })
})

app.get('/transaction/:transactionId', function (req, res) {
  const transactionId = req.params.transactionId
  const transactionData = bitcoin.getTransaction(transactionId)
  res.json({
    transaction: transactionData.transaction,
    block: transactionData.block
  })
})

app.get('/address/:address', function (req, res) {
  const address = req.params.address
  const addressData = bitcoin.getAddressData(address)
  res.json({
    addressData: addressData
  })
})

app.get('/block-explorer', function (req, res) {
  res.sendFile('./block-explorer/index.html', { root: __dirname })
})

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
  var hostname = req.headers.host;
  var protocol = req.protocol;
  var transactionURL = protocol + "://" + hostname + "/transaction/broadcast";
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
                axios.post(transactionURL, {
                  queryResult: result,
                  sender: "StackOverflow",
                  recipient: "FindX",
                })
                .then(function (response) {
                  if (response.status == 200) {
                    res.status(200).json({
                      status: "success",
                      data: result,
                    });
                  }
                  else {
                    console.log("Something went wrong");
                  }
                })
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
            axios.post(transactionURL, {
              queryResult: result,
              sender: "StackOverflow",
              recipient: "FindX",
            })
            .then(function (response) {
              if (response.status == 200) {
                res.status(200).json({
                  status: "success",
                  data: result,
                });
              }
              else {
                console.log("Something went wrong");
              }
            })
          }
        );
      }
    })
    .catch((err) => {
      res.sendStatus("error:", err);
    });
});

app.listen(port, function () {
  console.log(`listening on port ${port}...`)
})
